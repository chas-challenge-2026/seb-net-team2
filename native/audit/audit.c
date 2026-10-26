#include "audit.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <fcntl.h>
#include <unistd.h>

#include <openssl/sha.h>
#include <openssl/hmac.h>

/* Skapar en SHA256-hash av input och lagrar resultatet som hex-sträng. */
static void sha256_hex(const char *input, char output[65])
{
    unsigned char hash[SHA256_DIGEST_LENGTH];
    SHA256((const unsigned char *)input, strlen(input), hash);
    for (int i = 0; i < SHA256_DIGEST_LENGTH; i++)
    {
        const char hex[] = "0123456789abcdef";
        output[i * 2] = hex[(hash[i] >> 4) & 0x0F];
        output[i * 2 + 1] = hex[hash[i] & 0x0F];
    }

    output[64] = '\0';
}

/* Skapar en HMAC-SHA256-signatur med angiven hemlig nyckel. */
static void hmac_sha256_hex(const char *input, const char *secret_key, char output[65])
{
    unsigned char hmac[EVP_MAX_MD_SIZE];
    unsigned int hmac_length;
    HMAC(EVP_sha256(), secret_key, strlen(secret_key),
         (const unsigned char *)input, strlen(input), hmac, &hmac_length);
    for (unsigned int i = 0; i < hmac_length; i++)
    {
        int written = snprintf(output + (i * 2), 3, "%02x", hmac[i]);

        if (written != 2)
        {
            output[0] = '\0';
            return;
        }
    }
}

/* Hämtar och formaterar aktuell tidsstämpel för loggen. */
static void get_timestamp(char *buffer, size_t size)
{
    time_t now = time(NULL);
    const struct tm *time_info = localtime(&now);
    strftime(buffer, size, "%Y-%m-%d %H:%M:%S", time_info);
}

/*
 * Läser sista raden i en befintlig loggfil.
 * Returnerar:
 *   1 = sista raden lästes korrekt
 *   0 = loggfilen är tom
 *  -1 = filen saknas, kan inte läsas eller innehåller en för lång rad
 */
static int get_last_log_line(
    const char *log_path,
    char *last_line,
    size_t size)
{
    FILE *file = fopen(log_path, "r");

    if (file == NULL)
        return -1;

    char line[1100];
    last_line[0] = '\0';

    while (fgets(line, sizeof(line), file) != NULL)
    {
        size_t line_length = strcspn(line, "\n");

        if (line[line_length] == '\n')
            line[line_length] = '\0';

        if (line_length >= size)
        {
            fclose(file);
            return -1;
        }

        memcpy(last_line, line, line_length + 1);
    }

    int read_error = ferror(file);
    fclose(file);

    if (read_error)
        return -1;

    if (last_line[0] == '\0')
        return 0;

    return 1;
}

int audit_initialize(
    const char *log_path,
    const char *secret_key,
    int user_id,
    const char *action,
    int entity_id,
    const char *description)
{
    if (!log_path || !secret_key || !action || !description)
        return -1;

    char timestamp[64], prev_hash[65], log_data[1024];
    char hmac[65], final_log[1100];

    get_timestamp(timestamp, sizeof(timestamp));
    memset(prev_hash, '0', 64);
    prev_hash[64] = '\0';

    int len = snprintf(log_data, sizeof(log_data),
                       "%s|%d|%s|%d|%s|%s",
                       timestamp, user_id, action, entity_id, description, prev_hash);

    if (len < 0 || len >= (int)sizeof(log_data))
        return -1;

    hmac_sha256_hex(log_data, secret_key, hmac);
    if (strlen(hmac) != 64)
        return -1;

    len = snprintf(final_log, sizeof(final_log), "%s|%s\n", log_data, hmac);
    if (len < 0 || len >= (int)sizeof(final_log))
        return -1;

    int fd = open(log_path, O_WRONLY | O_CREAT | O_EXCL | O_SYNC, 0644);
    if (fd == -1)
        return -1;

    ssize_t written = write(fd, final_log, (size_t)len);
    int close_result = close(fd);

    return written == len && close_result == 0 ? 0 : -1;
}

/*
 * Lägger till en ny post i audit-loggen.
 * Varje post innehåller: TIMESTAMP | USER_ID | ACTION | ENTITY_ID | DESCRIPTION | PREV_HASH | HMAC
 * PREV_HASH länkar posten till föregående post. HMAC-SHA256 skyddar mot ändringar.
 */

static int audit_append_internal(
    const char *log_path,
    const char *secret_key,
    int user_id,
    const char *action,
    int entity_id,
    const char *description,
    char *out_hash,
    size_t out_hash_size)
{
    if (!log_path || !secret_key || !action || !description)
        return -1;

    if (out_hash && out_hash_size < 65)
        return -1;

    char timestamp[64], prev_hash[65], log_data[1024];
    char hmac[65], final_log[1100], last_line[1100];

    get_timestamp(timestamp, sizeof(timestamp));

    int log_status = get_last_log_line(
        log_path, last_line, sizeof(last_line));

    /*
     * Skapa inte automatiskt en ny loggkedja.
     * Loggfilen måste finnas, innehålla poster och vara läsbar.
     */
    if (log_status != 1)
        return -1;

    /* Verifiera hela kedjan innan vi lägger till en ny post. */
    if (audit_verify(log_path, secret_key) != -1)
        return -1;

    sha256_hex(last_line, prev_hash);

    int data_len = snprintf(
        log_data, sizeof(log_data), "%s|%d|%s|%d|%s|%s",
        timestamp, user_id, action, entity_id, description, prev_hash);

    if (data_len < 0 || data_len >= (int)sizeof(log_data))
        return -1;

    hmac_sha256_hex(log_data, secret_key, hmac);

    if (strlen(hmac) != 64)
        return -1;

    int log_len = snprintf(
        final_log, sizeof(final_log), "%s|%s\n", log_data, hmac);

    if (log_len < 0 || log_len >= (int)sizeof(final_log))
        return -1;

    int fd = open(log_path, O_WRONLY | O_CREAT | O_APPEND | O_SYNC, 0644);
    if (fd == -1)
        return -1;

    ssize_t written = write(fd, final_log, (size_t)log_len);
    int close_result = close(fd);

    if (written != log_len || close_result == -1)
        return -1;

    if (out_hash)
        memcpy(out_hash, hmac, 65);

    return 0;
}

int audit_append(const char *log_path, const char *secret_key, int user_id,
                 const char *action, int entity_id, const char *description)
{
    return audit_append_internal(
        log_path, secret_key, user_id, action, entity_id,
        description, NULL, 0);
}

int audit_append_with_hash(
    const char *log_path,
    const char *secret_key,
    int user_id,
    const char *action,
    int entity_id,
    const char *description,
    char *out_hash,
    size_t out_hash_size)
{
    if (!out_hash)
        return -1;

    return audit_append_internal(
        log_path, secret_key, user_id, action, entity_id,
        description, out_hash, out_hash_size);
}

/*
 * Verifierar audit-loggens integritet:
 * HMAC-signaturen för varje post.
 * PREV_HASH för varje post i hashkedjan.
 * Första posten måste ha en PREV_HASH bestående av 64 nollor.
 * Returnerar -1 om loggen är giltig,
 * annars radnumret för den första felaktiga posten.
 */
int audit_verify(const char *log_path, const char *secret_key)
{
    FILE *file = fopen(log_path, "r");
    if (file == NULL)
        return -2;

    char line[1100], previous_line[1100] = "", current_line[1100];
    int line_number = 0;

    while (fgets(line, sizeof(line), file) != NULL)
    {
        line_number++;
        line[strcspn(line, "\n")] = '\0';
        size_t line_length = strlen(line);

        if (line_length >= sizeof(current_line))
        {
            fclose(file);
            return line_number;
        }

        for (size_t i = 0; i <= line_length; i++)
        {
            current_line[i] = line[i];
        }

        char *last_separator = strrchr(line, '|');
        if (last_separator == NULL)
        {
            fclose(file);
            return line_number;
        }
        *last_separator = '\0';
        const char *stored_hmac = last_separator + 1;

        char *prev_hash_separator = strrchr(line, '|');
        if (prev_hash_separator == NULL)
        {
            fclose(file);
            return line_number;
        }
        const char *stored_prev_hash = prev_hash_separator + 1;

        if (line_number == 1)
        {
            char zero_hash[65];
            for (int i = 0; i < 64; i++)
            {
                zero_hash[i] = '0';
            }
            zero_hash[64] = '\0';
            if (strcmp(stored_prev_hash, zero_hash) != 0)
            {
                fclose(file);
                return line_number;
            }
        }
        else
        {
            char expected_prev_hash[65];
            sha256_hex(previous_line, expected_prev_hash);
            if (strcmp(stored_prev_hash, expected_prev_hash) != 0)
            {
                fclose(file);
                return line_number;
            }
        }

        char calculated_hmac[65];
        hmac_sha256_hex(line, secret_key, calculated_hmac);
        if (strcmp(stored_hmac, calculated_hmac) != 0)
        {
            fclose(file);
            return line_number;
        }

        size_t current_line_length = strlen(current_line);

        if (current_line_length >= sizeof(previous_line))
        {
            fclose(file);
            return line_number;
        }

        for (size_t i = 0; i <= current_line_length; i++)
        {
            previous_line[i] = current_line[i];
        }
    }

    int read_error = ferror(file);
    fclose(file);

    if (read_error)
        return -2;

    if (line_number == 0)
        return 1;

    return -1;
}
