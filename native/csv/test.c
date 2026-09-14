#include <cmocka.h>
#include <string.h>
#include <stdio.h>

#include "csv.h"

/* A test that will always pass */
static void csv_test_rows(void **state) {
    char *csv =
            "from_account_id,to_iban,amount,reference\r\n"
            "1,SE8550000000054910000003,5000.00,Faktura #2001\r\n"
            "1,SE8550000000054910000005,12500.00,Faktura #2002\r\n"
            "1,SE8550000000054910000006,8750.50,Faktura #2003\r\n";

    int rows = 0;
    CsvRow* csv_rows = parse_csv(csv, strlen(csv), &rows);

    assert_true(rows == 3);

    free_csv_rows(csv_rows);
}

static void csv_test_header_fields_dont_match_with_row_2(void **state) {
    char *csv =
            "from_account_id,to_iban,amount,reference\r\n"
            "1,SE8550000000054910000003,5000.00,Faktura #2001\r\n"
            "1,SE855000000005491000000500.00,Faktura #2002\r\n"
            "1,SE8550000000054910000006,8750.50,Faktura #2003\r\n";

    int rows = 0;
    CsvRow* csv_rows = parse_csv(csv, strlen(csv), &rows);

    assert_int_equal(csv_rows->valid, 0);

    free_csv_rows(csv_rows);
}

int main(void) {
    const struct CMUnitTest tests[] = {
        cmocka_unit_test(csv_test_rows),
        cmocka_unit_test(csv_test_header_fields_dont_match_with_row_2),
    };
    return cmocka_run_group_tests(tests, NULL, NULL);
}