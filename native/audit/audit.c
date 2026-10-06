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

/* Läser sista raden i loggfilen. Returnerar 0 om filen inte kunde öppnas. */
static int get_last_log_line(const char *log_path, char *last_line, size_t size)
{
    FILE *file = fopen(log_path, "r");
    if (file == NULL)
        return 0;

    char line[1100];
    last_line[0] = '\0';

    while (fgets(line, sizeof(line), file) != NULL)
    {
        line[strcspn(line, "\n")] = '\0';
        size_t line_length = strlen(line);

        if (line_length >= size)
        {
            fclose(file);
            return 0;
        }

        for (size_t i = 0; i <= line_length; i++)
        {
            last_line[i] = line[i];
        }
    }

    fclose(file);
    return 1;
}

/*
 * Lägger till en ny post i audit-loggen.
 * Varje post innehåller: TIMESTAMP | USER_ID | ACTION | ENTITY_ID | DESCRIPTION | PREV_HASH | HMAC
 * PREV_HASH länkar posten till föregående post. HMAC-SHA256 skyddar mot ändringar.
 */
int audit_append(const char *log_path, const char *secret_key, int user_id,
                 const char *action, int entity_id, const char *description)
{
    char timestamp[64], prev_hash[65], log_data[1024], hmac[65], final_log[1100], last_line[1100];

    get_timestamp(timestamp, sizeof(timestamp));
    for (int i = 0; i < 64; i++)
    {
        prev_hash[i] = '0';
    }
    prev_hash[64] = '\0';

    if (get_last_log_line(log_path, last_line, sizeof(last_line)))
        sha256_hex(last_line, prev_hash);

    if (snprintf(log_data, sizeof(log_data), "%s|%d|%s|%d|%s|%s",
                 timestamp, user_id, action, entity_id, description, prev_hash) >= (int)sizeof(log_data))
    {
        return -1;
    }

    hmac_sha256_hex(log_data, secret_key, hmac);

    if (snprintf(final_log, sizeof(final_log), "%s|%s",
                 log_data, hmac) >= (int)sizeof(final_log))
    {
        return -1;
    }

    int fd = open(log_path, O_WRONLY | O_CREAT | O_APPEND | O_SYNC, 0644);
    if (fd == -1)
        return -1;

    if (write(fd, final_log, strlen(final_log)) == -1 || write(fd, "\n", 1) == -1)
    {
        close(fd);
        return -1;
    }

    close(fd);
    return 0;
}

/*
 * Verifierar audit-loggens integritet:
 * - HMAC-signaturen för varje post.
 * - PREV_HASH för den första posten.
 * (Full kedjeverifiering av PREV_HASH för resterande poster är under implementering.)
 */
int audit_verify(const char *log_path, const char *secret_key)
{
    FILE *file = fopen(log_path, "r");
    if (file == NULL)
        return -1;

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

    fclose(file);
    return -1;
}
