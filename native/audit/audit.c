#include "audit.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#include <fcntl.h>
#include <unistd.h>

#include <openssl/sha.h>
#include <openssl/hmac.h>

/*
 * Creates a SHA256 hash from input data
 * and stores the result as a hexadecimal string.
 */
static void sha256_hex(const char *input, char output[65])
{

    unsigned char hash[SHA256_DIGEST_LENGTH];

    SHA256(
        (const unsigned char *)input,
        strlen(input),
        hash);

    for (int i = 0; i < SHA256_DIGEST_LENGTH; i++)
    {
        sprintf(output + (i * 2), "%02x", hash[i]);
    }

    output[64] = '\0';
}

/*
 * Creates an HMAC-SHA256 signature using
 * the provided secret key.
 */
static void hmac_sha256_hex(
    const char *input,
    const char *secret_key,
    char output[65])
{

    unsigned char hmac[EVP_MAX_MD_SIZE];
    unsigned int hmac_length;

    HMAC(
        EVP_sha256(),
        secret_key,
        strlen(secret_key),
        (const unsigned char *)input,
        strlen(input),
        hmac,
        &hmac_length);

    for (unsigned int i = 0; i < hmac_length; i++)
    {
        sprintf(output + (i * 2), "%02x", hmac[i]);
    }

    output[64] = '\0';
}

/*
 * Gets the current timestamp and formats it
 * for use in the audit log.
 */
static void get_timestamp(char *buffer, size_t size)
{
    time_t now = time(NULL);
    struct tm *time_info = localtime(&now);

    strftime(
        buffer,
        size,
        "%Y-%m-%d %H:%M:%S",
        time_info);
}

static int get_last_log_line(
    const char *log_path,
    char *last_line,
    size_t size)

{
    FILE *file = fopen(log_path, "r");

    if (file == NULL)
    {
        return 0;
    }

    char line[1100];

    last_line[0] = '\0';

    while (fgets(line, sizeof(line), file) != NULL)
    {
        strcpy(last_line, line);
    }

    fclose(file);
    return 1;
}
/*
 * Adds a new entry to the audit log.
 * Each log entry contains:
 * TIMESTAMP | USER_ID | ACTION | ENTITY_ID |DESCRIPTION | PREV_HASH | HMAC
 * PREV_HASH connects the current entry to the previous log entry.
 * HMAC-SHA256 protects the entry from undetected modification.
 */
int audit_append(
    const char *log_path,
    const char *secret_key,
    int user_id,
    const char *action,
    int entity_id,
    const char *description)

{

    char timestamp[64];
    char prev_hash[65];
    char log_data[1024];
    char hmac[65];

    get_timestamp(timestamp, sizeof(timestamp));

    char last_line[1100];

    if (get_last_log_line(log_path, last_line, sizeof(last_line)))
    {
        sha256_hex(last_line, prev_hash);
    }
    else
    {
        memset(prev_hash, '0', 64);
        prev_hash[64] = '\0';
    }

    snprintf(
        log_data,
        sizeof(log_data),
        "%s|%d|%s|%d|%s|%s",
        timestamp,
        user_id,
        action,
        entity_id,
        description,
        prev_hash

    );

    hmac_sha256_hex(
        log_data,
        secret_key,
        hmac

    );

    char final_log[1100];

    snprintf(
        final_log,
        sizeof(final_log),
        "%s|%s",
        log_data,
        hmac);

    int fd = open(
        log_path,
        O_WRONLY | O_CREAT | O_APPEND | O_SYNC,
        0644);

    if (fd == -1)
    {
        return -1;
    }

    write(
        fd,
        final_log,
        strlen(final_log));

    write(
        fd,
        "\n",
        1);

    close(fd);

    return 0;
}
/*
 * Verifies the integrity of the audit log.
 * The function verifies:
 * - The HMAC signature of each log entry.
 * - The PREV_HASH value of the first log entry.
 * PREV_HASH chain verification for the remaining entries is currently being implemented.
 */
int audit_verify(
    const char *log_path,
    const char *secret_key)

{

    FILE *file = fopen(log_path, "r");

    if (file == NULL)
    {
        return -1;
    }

    char line[1100];
    char previous_line[1100] = "";
    int line_number = 0;

    while (fgets(line, sizeof(line), file) != NULL)
    {
        line_number++;
        line[strcspn(line, "\n")] = '\0';
        char *last_separator = strrchr(line, '|');
        if (last_separator == NULL)

        {

            fclose(file);

            return -1;
        }

        *last_separator = '\0';

        char *prev_separator = strrchr(line, '|');
        if (prev_separator == NULL)
        {
            fclose(file);
            return -1;
        }
        char *stored_prev_hash = prev_separator + 1;
        if (line_number == 1)
        {
            char zero_hash[65];
            memset(zero_hash, '0', 64);
            zero_hash[64] = '\0';
            if (strcmp(stored_prev_hash, zero_hash) != 0)
            {
                fclose(file);
                return -1;
            }
        }
        char *stored_hmac = last_separator + 1;
        char calculated_hmac[65];

        hmac_sha256_hex(
            line,
            secret_key,
            calculated_hmac);

        if (strcmp(stored_hmac, calculated_hmac) != 0)
        {
            fclose(file);
            return -1;
        }
    }

    fclose(file);
    return 0;
}
