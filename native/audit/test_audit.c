#include <stddef.h>
#include <stdarg.h>
#include <setjmp.h>
#include <cmocka.h>

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "audit.h"

static const char *secret_key;

static void create_test_log(void)
{
    remove("audit.log");

    assert_int_equal(
        audit_initialize("audit.log", secret_key, 1,
                         "CREATE_PAYMENT", 100,
                         "Test payment created"),
        0);

    assert_int_equal(
        audit_append("audit.log", secret_key, 2,
                     "APPROVE_PAYMENT", 100,
                     "Test payment approved"),
        0);
}

static int setup_test_log(void **state)
{
    create_test_log();
    return 0;
}

/* Ändrar en specifik rad i Audit-loggen för att testa integritetskontroller. */
static void tamper_line(int line_no, void (*mutate)(char *line))
{
    FILE *file = fopen("audit.log", "r+");
    assert_non_null(file);

    char line[1024];
    long offset = 0;

    for (int i = 1; i <= line_no; i++)
    {
        offset = ftell(file);
        assert_true(offset >= 0);

        assert_non_null(fgets(line, sizeof(line), file));
    }

    mutate(line);

    fseek(file, offset, SEEK_SET);
    fputs(line, file);
    fclose(file);
}

static void remove_first_line(void)
{
    FILE *file = fopen("audit.log", "r");
    assert_non_null(file);

    char line[1024];

    assert_non_null(fgets(line, sizeof(line), file));

    FILE *temp = fopen("audit.tmp", "w");
    assert_non_null(temp);

    while (fgets(line, sizeof(line), file) != NULL)
    {
        fputs(line, temp);
    }

    fclose(file);
    fclose(temp);

    assert_int_equal(remove("audit.log"), 0);
    assert_int_equal(rename("audit.tmp", "audit.log"), 0);
}

static void mutate_action(char *line)
{
    char *action = strstr(line, "CREATE_PAYMENT");
    assert_non_null(action);
    memcpy(action, "DELETE_PAYMENT", 14);
}

static void mutate_prev_hash(char *line)
{
    char *hmac_sep = strrchr(line, '|');
    assert_non_null(hmac_sep);
    *hmac_sep = '\0';

    char *prev_sep = strrchr(line, '|');
    assert_non_null(prev_sep);
    prev_sep[1] = (prev_sep[1] == '0') ? '1' : '0';

    *hmac_sep = '|';
}

static void mutate_hmac(char *line)
{
    char *hmac = strrchr(line, '|');
    assert_non_null(hmac);
    hmac[1] = (hmac[1] == '0') ? '1' : '0';
}

static void remove_hmac(char *line)
{
    char *hmac = strrchr(line, '|');
    assert_non_null(hmac);

    *hmac = '\n';
    hmac[1] = '\0';
}

static void test_append_success(void **state)
{
    create_test_log();

    assert_int_equal(
        audit_append("audit.log", secret_key, 1,
                     "CREATE_PAYMENT", 100, "Test payment"),
        0);
}

static void test_description_too_long(void **state)
{
    (void)state;

    remove("audit.log");

    char description[2001];

    memset(description, 'A', 2000);
    description[2000] = '\0';

    assert_int_equal(
        audit_append("audit.log", secret_key, 1,
                     "DESCRIPTION_TOO_LONG", 100,
                     description),
        -1);

    FILE *file = fopen("audit.log", "r");
    assert_null(file);
}

static void test_existing_empty_log(void **state)
{
    (void)state;
    const char *path = "audit_empty_test.log";
    remove(path);

    FILE *file = fopen(path, "w");
    assert_non_null(file);
    assert_int_equal(fclose(file), 0);

    assert_int_equal(
        audit_append(path, secret_key, 1,
                     "EMPTY_LOG_TEST", 100, "First entry"),
        -1);
    assert_int_equal(audit_verify(path, secret_key), 1);

    remove(path);
}

static void test_verify_empty_log_fails(void **state)
{
    (void)state;
    const char *path = "audit_empty_verify_test.log";
    remove(path);

    FILE *file = fopen(path, "w");
    assert_non_null(file);
    assert_int_equal(fclose(file), 0);

    assert_int_equal(audit_verify(path, secret_key), 1);

    remove(path);
}

static void test_empty_description(void **state)
{
    create_test_log();

    assert_int_equal(
        audit_append("audit.log", secret_key, 1,
                     "EMPTY_DESCRIPTION", 100, ""),
        0);

    assert_int_equal(
        audit_verify("audit.log", secret_key),
        -1);
}

static void test_multiple_entries(void **state)
{
    create_test_log();

    for (int i = 3; i <= 10; i++)
    {
        assert_int_equal(
            audit_append("audit.log", secret_key, i,
                         "TEST_EVENT", i, "Test event"),
            0);
    }

    assert_int_equal(
        audit_verify("audit.log", secret_key),
        -1);
}

static void test_corrupt_log_line(void **state)
{
    setup_test_log(state);
    tamper_line(1, remove_hmac);

    assert_int_equal(
        audit_verify("audit.log", secret_key),
        1);
}

static void test_notification_events(void **state)
{
    create_test_log();

    assert_int_equal(
        audit_append("audit.log", secret_key, 1,
                     AUDIT_NOTIFICATION_SENT, 100,
                     "Notification sent"),
        0);

    assert_int_equal(
        audit_append("audit.log", secret_key, 1,
                     AUDIT_NOTIFICATION_RETRY, 100,
                     "Notification retry"),
        0);

    assert_int_equal(
        audit_append("audit.log", secret_key, 1,
                     AUDIT_NOTIFICATION_FAILED, 100,
                     "Notification failed"),
        0);

    assert_int_equal(
        audit_verify("audit.log", secret_key),
        -1);
}

static void test_valid_log(void **state)
{
    assert_int_equal(
        audit_verify("audit.log", secret_key),
        -1);
}

static void test_append_with_hash(void **state)
{
    (void)state;

    create_test_log();

    char hash[65] = {0};

    assert_int_equal(
        audit_append_with_hash(
            "audit.log", secret_key, 7,
            "CREATE_PAYMENT", 123, "Hash return test",
            hash, sizeof(hash)),
        0);

    assert_int_equal(strlen(hash), 64);

    for (int i = 0; i < 64; i++)
    {
        assert_true(
            (hash[i] >= '0' && hash[i] <= '9') ||
            (hash[i] >= 'a' && hash[i] <= 'f'));
    }

    FILE *file = fopen("audit.log", "r");
    assert_non_null(file);

    char line[1100];
    assert_non_null(fgets(line, sizeof(line), file));

    while (fgets(line, sizeof(line), file) != NULL)
    {
        /* Behåll den senast lästa raden. */
    }

    fclose(file);

    line[strcspn(line, "\n")] = '\0';

    char *separator = strrchr(line, '|');
    assert_non_null(separator);

    assert_string_equal(separator + 1, hash);
    assert_int_equal(audit_verify("audit.log", secret_key), -1);
}

static void test_tampered_action(void **state)
{
    tamper_line(1, mutate_action);

    assert_int_equal(
        audit_verify("audit.log", secret_key),
        1);
}

static void test_wrong_key(void **state)
{
    assert_int_equal(
        audit_verify("audit.log", "wrong-secret"),
        1);
}

static void test_tampered_previous_hash(void **state)
{
    tamper_line(2, mutate_prev_hash);

    assert_int_equal(
        audit_verify("audit.log", secret_key),
        2);
}

static void test_tampered_hmac(void **state)
{
    tamper_line(1, mutate_hmac);

    assert_int_equal(
        audit_verify("audit.log", secret_key),
        1);
}
static void test_removed_first_line(void **state)
{
    setup_test_log(state);
    remove_first_line();

    assert_int_equal(
        audit_verify("audit.log", secret_key),
        1);
}
static void test_missing_log_file(void **state)
{
    const char *missing_log = "audit_missing_test.log";
    remove(missing_log);

    assert_int_equal(
        audit_verify(missing_log, secret_key),
        -2);

    remove(missing_log);
}

static void test_description_with_newlines(void **state)
{
    (void)state;

    const char *path = "audit_newline_test.log";
    const char *initial_description = "Rad 1\nRad 2\rRad 3";
    const char *appended_description = "Append rad 1\nAppend rad 2\rAppend rad 3";

    remove(path);

    assert_int_equal(
        audit_initialize(path, secret_key, 1,
                         "NEWLINE_INIT", 101, initial_description),
        0);

    assert_int_equal(
        audit_append(path, secret_key, 2,
                     "NEWLINE_APPEND", 101, appended_description),
        0);

    assert_int_equal(audit_verify(path, secret_key), -1);

    FILE *file = fopen(path, "r");
    assert_non_null(file);

    char line[1100];
    int line_count = 0;
    int found_initial = 0;
    int found_appended = 0;

    while (fgets(line, sizeof(line), file) != NULL)
    {
        line_count++;

        if (strstr(line, "Rad 1\\nRad 2\\rRad 3") != NULL)
            found_initial = 1;

        if (strstr(line, "Append rad 1\\nAppend rad 2\\rAppend rad 3") != NULL)
            found_appended = 1;
    }

    assert_int_equal(fclose(file), 0);
    assert_int_equal(line_count, 2);
    assert_true(found_initial);
    assert_true(found_appended);
    assert_int_equal(remove(path), 0);
}

int main(void)
{
    secret_key = getenv("AUDIT_SIGNING_KEY");
    assert_non_null(secret_key);

    const struct CMUnitTest tests[] = {
        cmocka_unit_test(test_missing_log_file),
        cmocka_unit_test(test_append_success),
        cmocka_unit_test(test_append_with_hash),
        cmocka_unit_test(test_description_with_newlines),
        cmocka_unit_test(test_description_too_long),
        cmocka_unit_test(test_existing_empty_log),
        cmocka_unit_test(test_verify_empty_log_fails),
        cmocka_unit_test(test_empty_description),
        cmocka_unit_test(test_multiple_entries),
        cmocka_unit_test(test_notification_events),
        cmocka_unit_test_setup(test_valid_log, setup_test_log),
        cmocka_unit_test_setup(test_tampered_action, setup_test_log),
        cmocka_unit_test_setup(test_wrong_key, setup_test_log),
        cmocka_unit_test_setup(test_tampered_previous_hash, setup_test_log),
        cmocka_unit_test(test_removed_first_line),
        cmocka_unit_test_setup(test_tampered_hmac, setup_test_log),
        cmocka_unit_test(test_corrupt_log_line),
    };

    return cmocka_run_group_tests(tests, NULL, NULL);
}
