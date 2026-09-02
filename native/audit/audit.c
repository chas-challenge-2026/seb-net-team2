#include "audit.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#include <fcntl.h>
#include <unistd.h>

#include <openssl/sha.h>
#include <openssl/hmac.h>

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

    memset(prev_hash, '0', 64);
    prev_hash[64] = '\0';

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
        hmac
    );

    int fd = open(
        log_path,
        O_WRONLY | O_CREAT | O_APPEND | O_SYNC,
        0644
    );

    if (fd == -1)
    {
        return -1;
    }

    write(
        fd,
        final_log,
        strlen(final_log)
    );

    write(
        fd,
        "\n",
        1
    );
    
    close(fd);

    return 0;
}