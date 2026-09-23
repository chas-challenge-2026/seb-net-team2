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

    audit_append("audit.log", secret_key, 1,
                 "CREATE_PAYMENT", 100, "Test payment created");

    audit_append("audit.log", secret_key, 2,
                 "APPROVE_PAYMENT", 100, "Test payment approved");
}

static int setup_test_log(void **state)
{
    create_test_log();
    return 0;
}

/* Modifies one line in the audit log. */
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
    remove("audit.log");

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

static void test_empty_description(void **state)
{
    remove("audit.log");

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
    remove("audit.log");

    for (int i = 1; i <= 10; i++)
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
    remove("audit.log");

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
int main(void)
{
    secret_key = getenv("AUDIT_SIGNING_KEY");
    assert_non_null(secret_key);

    const struct CMUnitTest tests[] = {
        cmocka_unit_test(test_append_success),
        cmocka_unit_test(test_description_too_long),
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
