#include <cmocka.h>
#include <string.h>
#include <stdio.h>

#include "csv.h"

/* A test that will always pass */
static void csv_test_values(void **state) {
    char *content =
            "from_account_id,to_iban,amount,reference\r\n"
            "1,SE8550000000054910000003,5000.00,Faktura #2001\r\n"
            "1,SE8550000000054910000005,12500.00,Faktura #2002\r\n"
            "1,SE8550000000054910000006,8750.50,Faktura #2003\r\n";

    Csv csv = {0};
    Csv_Error error = csv_parse(content, strlen(content), &csv);

    assert_true(strcmp((char*)csv.data[0], "from_account_id") == 0);
    assert_true(strcmp((char*)csv.data[15], "Faktura #2003") == 0);
    assert_true(*(int*)csv.data[4] == 1);
    assert_true(*(double*)csv.data[6] == 5000.00);
    assert_true(csv.data_length == 16);
    csv_free(&csv);
}

int main(void) {
    const struct CMUnitTest tests[] = {
        cmocka_unit_test(csv_test_values),
    };
    return cmocka_run_group_tests(tests, NULL, NULL);
}