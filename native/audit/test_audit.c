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

static void test_append_success(void **state)
{
    remove("audit.log");

    assert_int_equal(
        audit_append("audit.log", secret_key, 1,
                     "CREATE_PAYMENT", 100, "Test payment"),
        0);
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

int main(void)
{
    secret_key = getenv("AUDIT_SIGNING_KEY");
    assert_non_null(secret_key);

    const struct CMUnitTest tests[] = {
        cmocka_unit_test(test_append_success),
        cmocka_unit_test_setup(test_valid_log, setup_test_log),
        cmocka_unit_test_setup(test_tampered_action, setup_test_log),
        cmocka_unit_test_setup(test_wrong_key, setup_test_log),
        cmocka_unit_test_setup(test_tampered_previous_hash, setup_test_log),
    };

    return cmocka_run_group_tests(tests, NULL, NULL);
}
