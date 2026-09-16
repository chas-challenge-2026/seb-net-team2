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

/* RFC 4180 §2: last record may omit the ending CRLF */
static void csv_test_optional_trailing_crlf(void **state) {
    char *with =
            "from_account_id,to_iban,amount,reference\r\n"
            "1,SE8550000000054910000003,5000.00,Faktura #2001\r\n";
    char *without =
            "from_account_id,to_iban,amount,reference\r\n"
            "1,SE8550000000054910000003,5000.00,Faktura #2001";

    int rows_with = 0, rows_without = 0;
    CsvRow *a = parse_csv(with, strlen(with), &rows_with);
    CsvRow *b = parse_csv(without, strlen(without), &rows_without);

    assert_int_equal(rows_with, 1);
    assert_int_equal(rows_without, 1);
    assert_int_equal(a[0].valid, 1);
    assert_int_equal(b[0].valid, 1);
    assert_true(strcmp(a[0].reference, "Faktura #2001") == 0);
    assert_true(strcmp(b[0].reference, "Faktura #2001") == 0);

    free_csv_rows(a);
    free_csv_rows(b);
}

/* RFC 4180 §5: fields may be quoted even when they do not need it */
static void csv_test_all_fields_quoted(void **state) {
    char *csv =
            "from_account_id,to_iban,amount,reference\r\n"
            "\"1\",\"SE8550000000054910000003\",\"5000.00\",\"Faktura #2001\"\r\n";

    int rows = 0;
    CsvRow *csv_rows = parse_csv(csv, strlen(csv), &rows);

    assert_int_equal(rows, 1);
    assert_int_equal(csv_rows[0].valid, 1);
    assert_int_equal(csv_rows[0].from_account_id, 1);
    printf("What is parsed: [%s]\n", csv_rows[0].to_iban);
    assert_true(strcmp(csv_rows[0].to_iban, "SE8550000000054910000003") == 0);
    assert_true(csv_rows[0].amount == 5000.00);
    assert_true(strcmp(csv_rows[0].reference, "Faktura #2001") == 0);

    free_csv_rows(csv_rows);
}

/* RFC 4180 §6: comma inside a field must be quoted and is data, not a delimiter */
static void csv_test_quoted_comma_in_reference(void **state) {
    char *csv =
            "from_account_id,to_iban,amount,reference\r\n"
            "1,SE8550000000054910000003,5000.00,\"Faktura #2001, delbetalning\"\r\n";

    int rows = 0;
    CsvRow *csv_rows = parse_csv(csv, strlen(csv), &rows);

    assert_int_equal(rows, 1);
    assert_int_equal(csv_rows[0].valid, 1);
    assert_true(strcmp(csv_rows[0].reference, "Faktura #2001, delbetalning") == 0);

    free_csv_rows(csv_rows);
}

/* RFC 4180 §6: CRLF inside a quoted field is part of the field, not a new record */
static void csv_test_quoted_embedded_crlf(void **state) {
    char *csv =
            "from_account_id,to_iban,amount,reference\r\n"
            "1,SE8550000000054910000003,5000.00,\"Faktura #2001\r\nRad 2\"\r\n"
            "1,SE8550000000054910000005,12500.00,Faktura #2002\r\n";

    int rows = 0;
    CsvRow *csv_rows = parse_csv(csv, strlen(csv), &rows);

    assert_int_equal(rows, 2);
    assert_int_equal(csv_rows[0].valid, 1);
    assert_true(strcmp(csv_rows[0].reference, "Faktura #2001\r\nRad 2") == 0);
    assert_true(strcmp(csv_rows[1].reference, "Faktura #2002") == 0);

    free_csv_rows(csv_rows);
}

/* RFC 4180 §7: "" inside a quoted field becomes a single " */
static void csv_test_escaped_double_quotes(void **state) {
    char *csv =
            "from_account_id,to_iban,amount,reference\r\n"
            "1,SE8550000000054910000003,5000.00,\"Faktura \"\"2001\"\"\"\r\n";

    int rows = 0;
    CsvRow *csv_rows = parse_csv(csv, strlen(csv), &rows);

    assert_int_equal(rows, 1);
    assert_int_equal(csv_rows[0].valid, 1);
    assert_true(strcmp(csv_rows[0].reference, "Faktura \"2001\"") == 0);

    free_csv_rows(csv_rows);
}

/* RFC 4180 §4: spaces are part of the field and must not be ignored */
static void csv_test_spaces_are_part_of_field(void **state) {
    char *csv =
            "from_account_id,to_iban,amount,reference\r\n"
            "1,SE8550000000054910000003,5000.00, Faktura #2001\r\n";

    int rows = 0;
    CsvRow *csv_rows = parse_csv(csv, strlen(csv), &rows);

    assert_int_equal(rows, 1);
    assert_int_equal(csv_rows[0].valid, 1);
    assert_true(strcmp(csv_rows[0].reference, " Faktura #2001") == 0);

    free_csv_rows(csv_rows);
}

/* RFC 4180 §4: trailing comma means an extra empty field → field count mismatch */
static void csv_test_trailing_comma_is_extra_field(void **state) {
    char *csv =
            "from_account_id,to_iban,amount,reference\r\n"
            "1,SE8550000000054910000003,5000.00,Faktura #2001,\r\n";

    int rows = 0;
    CsvRow *csv_rows = parse_csv(csv, strlen(csv), &rows);

    assert_int_equal(csv_rows[0].valid, 0);

    free_csv_rows(csv_rows);
}

/* RFC 4180 §5: a " may not appear in an unquoted field */
static void csv_test_bare_quote_in_unquoted_field_is_invalid(void **state) {
    char *csv =
            "from_account_id,to_iban,amount,reference\r\n"
            "1,SE8550000000054910000003,5000.00,Faktura \"2001\r\n";

    int rows = 0;
    CsvRow *csv_rows = parse_csv(csv, strlen(csv), &rows);

    assert_int_equal(csv_rows[0].valid, 0);

    free_csv_rows(csv_rows);
}

/* Opening quote must immediately follow the comma (no leading space) */
static void csv_test_space_before_opening_quote_is_not_quoted(void **state) {
    char *csv =
            "from_account_id,to_iban,amount,reference\r\n"
            "1,SE8550000000054910000003,5000.00, \"Faktura #2001\"\r\n";

    int rows = 0;
    CsvRow *csv_rows = parse_csv(csv, strlen(csv), &rows);

    /* Strict RFC: this is an unquoted field that contains ", so it is invalid.
       If you choose to be liberal (Excel/LibreOffice style), change this
       assertion and document the deviation. */
    assert_int_equal(csv_rows[0].valid, 0);

    free_csv_rows(csv_rows);
}

/* Empty quoted field is a valid empty string, not a missing column */
static void csv_test_empty_quoted_reference(void **state) {
    char *csv =
            "from_account_id,to_iban,amount,reference\r\n"
            "1,SE8550000000054910000003,5000.00,\"\"\r\n";

    int rows = 0;
    CsvRow *csv_rows = parse_csv(csv, strlen(csv), &rows);

    assert_int_equal(rows, 1);
    assert_int_equal(csv_rows[0].valid, 1);
    assert_true(strcmp(csv_rows[0].reference, "") == 0);

    free_csv_rows(csv_rows);
}

/* Empty unquoted field (two commas) is also an empty string */
static void csv_test_empty_unquoted_reference(void **state) {
    char *csv =
            "from_account_id,to_iban,amount,reference\r\n"
            "1,SE8550000000054910000003,5000.00,\r\n";

    int rows = 0;
    CsvRow *csv_rows = parse_csv(csv, strlen(csv), &rows);

    assert_int_equal(rows, 1);
    assert_int_equal(csv_rows[0].valid, 1);
    assert_true(strcmp(csv_rows[0].reference, "") == 0);

    free_csv_rows(csv_rows);
}

/* Unclosed quoted field is invalid */
static void csv_test_unclosed_quote_is_invalid(void **state) {
    char *csv =
            "from_account_id,to_iban,amount,reference\r\n"
            "1,SE8550000000054910000003,5000.00,\"Faktura #2001\r\n";

    int rows = 0;
    CsvRow *csv_rows = parse_csv(csv, strlen(csv), &rows);

    assert_int_equal(csv_rows[0].valid, 0);

    free_csv_rows(csv_rows);
}

/* Header must not be returned as a data row */
static void csv_test_header_is_not_a_data_row(void **state) {
    char *csv =
            "from_account_id,to_iban,amount,reference\r\n"
            "1,SE8550000000054910000003,5000.00,Faktura #2001\r\n";

    int rows = 0;
    CsvRow *csv_rows = parse_csv(csv, strlen(csv), &rows);

    assert_int_equal(rows, 1);
    assert_int_equal(csv_rows[0].from_account_id, 1);

    free_csv_rows(csv_rows);
}

/* Mix quoted and unquoted fields in the same record */
static void csv_test_mixed_quoting(void **state) {
    char *csv =
            "from_account_id,to_iban,amount,reference\r\n"
            "1,\"SE8550000000054910000003\",5000.00,\"Faktura, #2001\"\r\n";

    int rows = 0;
    CsvRow *csv_rows = parse_csv(csv, strlen(csv), &rows);

    assert_int_equal(rows, 1);
    assert_int_equal(csv_rows[0].valid, 1);
    assert_true(strcmp(csv_rows[0].to_iban, "SE8550000000054910000003") == 0);
    assert_true(strcmp(csv_rows[0].reference, "Faktura, #2001") == 0);

    free_csv_rows(csv_rows);
}

static void csv_test_values(void **state) {
    char *csv =
            "from_account_id,to_iban,amount,reference\r\n"
            "1,SE8550000000054910000003,5000.00,Faktura #2001\r\n"
            "1,SE8550000000054910000005,12500.00,Faktura #2002\r\n"
            "1,SE8550000000054910000006,8750.50,Faktura #2003\r\n";

    int rows = 0;
    CsvRow* csv_rows = parse_csv(csv, strlen(csv), &rows);
    
    assert_true(csv_rows[0].from_account_id == 1);
    assert_true(csv_rows[1].from_account_id == 1);
    assert_true(csv_rows[2].from_account_id == 1);

    assert_true(strcmp(csv_rows[0].to_iban, "SE8550000000054910000003") == 0);
    assert_true(strcmp(csv_rows[1].to_iban, "SE8550000000054910000005") == 0);
    assert_true(strcmp(csv_rows[2].to_iban, "SE8550000000054910000006") == 0);

    assert_true(csv_rows[0].amount == 5000.00);
    assert_true(csv_rows[1].amount == 12500.00);
    assert_true(csv_rows[2].amount == 8750.50);

    assert_true(strcmp(csv_rows[0].reference, "Faktura #2001") == 0);
    assert_true(strcmp(csv_rows[1].reference, "Faktura #2002") == 0);
    assert_true(strcmp(csv_rows[2].reference, "Faktura #2003") == 0);

    free_csv_rows(csv_rows);
}


int main(void) {
    const struct CMUnitTest tests[] = {
        cmocka_unit_test(csv_test_rows),
        cmocka_unit_test(csv_test_header_fields_dont_match_with_row_2),
        cmocka_unit_test(csv_test_values),
        cmocka_unit_test(csv_test_optional_trailing_crlf),
        cmocka_unit_test(csv_test_all_fields_quoted),
        cmocka_unit_test(csv_test_quoted_comma_in_reference),
        cmocka_unit_test(csv_test_quoted_embedded_crlf),
        cmocka_unit_test(csv_test_escaped_double_quotes),
        cmocka_unit_test(csv_test_spaces_are_part_of_field),
        cmocka_unit_test(csv_test_trailing_comma_is_extra_field),
        cmocka_unit_test(csv_test_bare_quote_in_unquoted_field_is_invalid),
        cmocka_unit_test(csv_test_space_before_opening_quote_is_not_quoted),
        cmocka_unit_test(csv_test_empty_quoted_reference),
        cmocka_unit_test(csv_test_empty_unquoted_reference),
        cmocka_unit_test(csv_test_unclosed_quote_is_invalid),
        cmocka_unit_test(csv_test_header_is_not_a_data_row),
        cmocka_unit_test(csv_test_mixed_quoting),
    };
    return cmocka_run_group_tests(tests, NULL, NULL);
}