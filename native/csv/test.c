#include <cmocka.h>
#include <string.h>

#include "csv.h"

static void expect_strings(const char *content, const char *const *fields, size_t count)
{
    Csv csv = {0};
    Csv_Error error = csv_parse(content, (int)strlen(content), &csv);

    assert_int_equal(error, Csv_Error_Success);
    assert_int_equal(csv.data_length, count);
    for (size_t i = 0; i < count; i++) {
        assert_non_null(csv.data[i]);
        assert_string_equal((char *)csv.data[i], fields[i]);
    }
    csv_free(&csv);
}

static void expect_invalid(const char *content)
{
    Csv csv;
    Csv zero = {0};

    memset(&csv, 0x5a, sizeof(csv));
    Csv_Error error = csv_parse(content, (int)strlen(content), &csv);

    assert_int_equal(error, Csv_Error_Invalid_Parsing);
    assert_memory_equal(&csv, &zero, sizeof(csv));
}

static void assert_example_batch(const Csv *csv)
{
    assert_int_equal(csv->data_length, 16);

    assert_string_equal((char *)csv->data[0], "from_account_id");
    assert_string_equal((char *)csv->data[1], "to_iban");
    assert_string_equal((char *)csv->data[2], "amount");
    assert_string_equal((char *)csv->data[3], "reference");

    assert_int_equal(*(int *)csv->data[4], 1);
    assert_string_equal((char *)csv->data[5], "SE8550000000054910000003");
    assert_double_equal(*(double *)csv->data[6], 5000.00, 0.001);
    assert_string_equal((char *)csv->data[7], "Faktura #2001");

    assert_int_equal(*(int *)csv->data[8], 1);
    assert_string_equal((char *)csv->data[9], "SE8550000000054910000005");
    assert_double_equal(*(double *)csv->data[10], 12500.00, 0.001);
    assert_string_equal((char *)csv->data[11], "Faktura #2002");

    assert_int_equal(*(int *)csv->data[12], 1);
    assert_string_equal((char *)csv->data[13], "SE8550000000054910000006");
    assert_double_equal(*(double *)csv->data[14], 8750.50, 0.001);
    assert_string_equal((char *)csv->data[15], "Faktura #2003");
}

static void csv_test_null_content_leaves_output_untouched(void **state)
{
    Csv csv;
    Csv original;

    (void)state;
    memset(&csv, 0x5a, sizeof(csv));
    original = csv;

    assert_int_equal(csv_parse(NULL, 8, &csv), Csv_Error_Content_Is_NULL);
    assert_memory_equal(&csv, &original, sizeof(csv));
}

static void csv_test_null_content_is_reported_before_null_output(void **state)
{
    (void)state;
    assert_int_equal(csv_parse(NULL, 0, NULL), Csv_Error_Content_Is_NULL);
    assert_int_equal(csv_parse(NULL, -1, NULL), Csv_Error_Content_Is_NULL);
}

static void csv_test_null_output(void **state)
{
    (void)state;
    assert_int_equal(csv_parse("aaa\r\n", 5, NULL), Csv_Error_Out_Csv_Is_NULL);
    /* Length is not checked until out_csv is known to be writable. */
    assert_int_equal(csv_parse("aaa", 0, NULL), Csv_Error_Out_Csv_Is_NULL);
}

static void csv_test_zero_length_zeroes_output(void **state)
{
    Csv csv;
    Csv zero = {0};

    (void)state;
    memset(&csv, 0x5a, sizeof(csv));
    assert_int_equal(csv_parse("aaa", 0, &csv), Csv_Error_Content_Length_Is_Invalid);
    assert_memory_equal(&csv, &zero, sizeof(csv));
}

static void csv_test_negative_length_zeroes_output(void **state)
{
    Csv csv;
    Csv zero = {0};

    (void)state;
    memset(&csv, 0x5a, sizeof(csv));
    assert_int_equal(csv_parse("aaa", -5, &csv), Csv_Error_Content_Length_Is_Invalid);
    assert_memory_equal(&csv, &zero, sizeof(csv));
}

static void csv_test_content_len_does_not_read_past_the_prefix(void **state)
{
    const char raw[] = "aaa,bbb,ccc";
    Csv csv = {0};

    (void)state;
    /* Seven bytes: "aaa,bbb". The comma and "ccc" are outside the prefix. */
    assert_int_equal(csv_parse(raw, 7, &csv), Csv_Error_Success);
    assert_int_equal(csv.data_length, 2);
    assert_string_equal((char *)csv.data[0], "aaa");
    assert_string_equal((char *)csv.data[1], "bbb");
    csv_free(&csv);
}

static void csv_test_values(void **state)
{
    const char *content =
        "from_account_id,to_iban,amount,reference\r\n"
        "1,SE8550000000054910000003,5000.00,Faktura #2001\r\n"
        "1,SE8550000000054910000005,12500.00,Faktura #2002\r\n"
        "1,SE8550000000054910000006,8750.50,Faktura #2003\r\n";
    Csv csv = {0};

    (void)state;
    assert_int_equal(csv_parse(content, (int)strlen(content), &csv), Csv_Error_Success);
    assert_example_batch(&csv);
    csv_free(&csv);
}

static void csv_test_rfc4180_rule1_crlf_between_records(void **state)
{
    const char *fields[] = {"aaa", "bbb", "ccc", "zzz", "yyy", "xxx"};

    (void)state;
    expect_strings("aaa,bbb,ccc\r\nzzz,yyy,xxx\r\n", fields, 6);
}

static void csv_test_rfc4180_rule2_last_record_omits_crlf(void **state)
{
    const char *fields[] = {"aaa", "bbb", "ccc", "zzz", "yyy", "xxx"};

    (void)state;
    expect_strings("aaa,bbb,ccc\r\nzzz,yyy,xxx", fields, 6);
}

static void csv_test_rfc4180_rule2_single_field_without_break(void **state)
{
    const char *fields[] = {"aaa"};

    (void)state;
    expect_strings("aaa", fields, 1);
}

static void csv_test_rfc4180_rule3_header_is_a_record(void **state)
{
    const char *fields[] = {"field_name", "field_name", "field_name", "aaa", "bbb", "ccc"};

    (void)state;
    expect_strings("field_name,field_name,field_name\r\naaa,bbb,ccc\r\n", fields, 6);
}

static void csv_test_rfc4180_rule4_spaces_are_part_of_the_field(void **state)
{
    const char *fields[] = {" aaa", " b ", "c "};

    (void)state;
    expect_strings(" aaa,\" b \",c \r\n", fields, 3);
    expect_strings(" aaa, b ,c ", fields, 3);
}

static void csv_test_rfc4180_rule4_empty_fields(void **state)
{
    const char *between[] = {"aaa", "", "ccc"};
    const char *quoted[] = {"aaa", "", "ccc"};
    const char *edges[] = {"", "bbb", ""};
    const char *only_commas[] = {"", "", ""};

    (void)state;
    expect_strings("aaa,,ccc\r\n", between, 3);
    expect_strings("aaa,\"\",ccc", quoted, 3);
    expect_strings(",bbb,\r\n", edges, 3);
    expect_strings(",,", only_commas, 3);
}

static void csv_test_rfc4180_rule5_quoted_fields(void **state)
{
    const char *quoted[] = {"aaa", "bbb", "ccc", "zzz", "yyy", "xxx"};
    const char *mixed[] = {"aaa", "bbb", "ccc"};

    (void)state;
    expect_strings("\"aaa\",\"bbb\",\"ccc\"\r\nzzz,yyy,xxx", quoted, 6);
    expect_strings("\"aaa\",bbb,\"ccc\"\r\n", mixed, 3);
}

static void csv_test_rfc4180_rule6_embedded_comma(void **state)
{
    const char *fields[] = {"aaa", "b,bb", "ccc"};

    (void)state;
    expect_strings("\"aaa\",\"b,bb\",\"ccc\"\r\n", fields, 3);
}

static void csv_test_rfc4180_rule6_embedded_crlf(void **state)
{
    const char *fields[] = {"aaa", "b\r\nbb", "ccc", "zzz", "yyy", "xxx"};
    const char *only_break[] = {"\r\n"};

    (void)state;
    expect_strings("\"aaa\",\"b\r\nbb\",\"ccc\"\r\nzzz,yyy,xxx", fields, 6);
    expect_strings("\"\r\n\"", only_break, 1);
}

static void csv_test_rfc4180_rule6_lf_inside_quotes_is_data(void **state)
{
    const char *fields[] = {"aaa", "b\nbb", "ccc", "ddd", "eee"};

    (void)state;
    /* The quoted LF is one field. The LF after "ccc" starts the next record. */
    expect_strings("\"aaa\",\"b\nbb\",\"ccc\"\nddd,eee\n", fields, 5);
}

static void csv_test_rfc4180_rule6_quoted_cr_is_data(void **state)
{
    const char *fields[] = {"a\rb"};

    (void)state;
    expect_strings("\"a\rb\"\r\n", fields, 1);
}

static void csv_test_rfc4180_rule7_escaped_quotes(void **state)
{
    const char *rfc[] = {"aaa", "b\"bb", "ccc"};
    const char *edges[] = {"\"", "say \"hello\"", "\"quoted\""};
    const char *one[] = {"\""};

    (void)state;
    expect_strings("\"aaa\",\"b\"\"bb\",\"ccc\"", rfc, 3);
    expect_strings("\"\"\"\",\"say \"\"hello\"\"\",\"\"\"quoted\"\"\"\r\n", edges, 3);
    expect_strings("\"\"\"\"", one, 1);
}

static void csv_test_rfc4180_quote_comma_and_break_in_one_field(void **state)
{
    const char *fields[] = {"a\"b,c\r\nd\"", "next"};

    (void)state;
    expect_strings("\"a\"\"b,c\r\nd\"\"\"\r\nnext\r\n", fields, 2);
}

static void csv_test_rfc4180_quoted_reference_with_comma(void **state)
{
    const char *content =
        "from_account_id,to_iban,amount,reference\r\n"
        "1,SE8550000000054910000003,5000.00,\"Malmö Bygg, projektfaktura\"\r\n";
    Csv csv = {0};

    (void)state;
    assert_int_equal(csv_parse(content, (int)strlen(content), &csv), Csv_Error_Success);
    assert_int_equal(csv.data_length, 8);
    assert_string_equal((char *)csv.data[0], "from_account_id");
    assert_string_equal((char *)csv.data[1], "to_iban");
    assert_string_equal((char *)csv.data[2], "amount");
    assert_string_equal((char *)csv.data[3], "reference");
    assert_int_equal(*(int *)csv.data[4], 1);
    assert_string_equal((char *)csv.data[5], "SE8550000000054910000003");
    assert_double_equal(*(double *)csv.data[6], 5000.00, 0.001);
    assert_string_equal((char *)csv.data[7], "Malmö Bygg, projektfaktura");
    csv_free(&csv);
}

static void csv_test_rfc4180_batch_comma_blank_row_and_newline(void **state)
{
    const char *content =
        "from_account_id,to_iban,amount,reference\r\n"
        "1,SE8550000000054910000003,5000.00,\"Malmö Bygg, projektfaktura\"\r\n"
        "\r\n"
        "1,SE8550000000054910000006,8750.50,\"rad1\r\nrad \"\"två\"\"\"\r\n";
    Csv csv = {0};

    (void)state;
    assert_int_equal(csv_parse(content, (int)strlen(content), &csv), Csv_Error_Success);
    assert_int_equal(csv.data_length, 13);
    assert_string_equal((char *)csv.data[0], "from_account_id");
    assert_string_equal((char *)csv.data[1], "to_iban");
    assert_string_equal((char *)csv.data[2], "amount");
    assert_string_equal((char *)csv.data[3], "reference");
    assert_int_equal(*(int *)csv.data[4], 1);
    assert_string_equal((char *)csv.data[5], "SE8550000000054910000003");
    assert_double_equal(*(double *)csv.data[6], 5000.00, 0.001);
    assert_string_equal((char *)csv.data[7], "Malmö Bygg, projektfaktura");
    assert_non_null(csv.data[8]);
    assert_string_equal((char *)csv.data[8], "");
    assert_int_equal(*(int *)csv.data[9], 1);
    assert_string_equal((char *)csv.data[10], "SE8550000000054910000006");
    assert_double_equal(*(double *)csv.data[11], 8750.50, 0.001);
    assert_string_equal((char *)csv.data[12], "rad1\r\nrad \"två\"");
    csv_free(&csv);
}

static void csv_test_rfc4180_blank_line_between_records(void **state)
{
    const char *fields[] = {"aaa", "bbb", "", "ccc"};

    (void)state;
    expect_strings("aaa,bbb\r\n\r\nccc\r\n", fields, 4);
}

static void csv_test_rfc4180_trailing_blank_line(void **state)
{
    const char *fields[] = {"aaa", "bbb", ""};

    (void)state;
    expect_strings("aaa,bbb\r\n\r\n", fields, 3);
}

static void csv_test_rfc4180_file_is_a_blank_line(void **state)
{
    const char *one[] = {""};
    const char *two[] = {"", ""};

    (void)state;
    expect_strings("\r\n", one, 1);
    expect_strings("\r\n\r\n", two, 2);
}

static void csv_test_rfc4180_trailing_break_is_not_an_extra_field(void **state)
{
    const char *fields[] = {"aaa", "bbb"};
    const char *one[] = {"aaa"};

    (void)state;
    expect_strings("aaa,bbb\r\n", fields, 2);
    expect_strings("aaa\r\n", one, 1);
}

static void csv_test_rfc4180_lf_separated_records(void **state)
{
    const char *fields[] = {"aaa", "bbb", "ccc", "ddd"};
    const char *with_blank[] = {"aaa", "bbb", "", "ccc"};
    const char *mixed[] = {"aaa", "bbb", "ccc"};

    (void)state;
    expect_strings("aaa,bbb\nccc,ddd\n", fields, 4);
    expect_strings("aaa,bbb\n\nccc\n", with_blank, 4);
    expect_strings("aaa\r\nbbb\nccc\r\n", mixed, 3);
}

static void csv_test_example_batch_with_lf(void **state)
{
    const char *content =
        "from_account_id,to_iban,amount,reference\n"
        "1,SE8550000000054910000003,5000.00,Faktura #2001\n"
        "1,SE8550000000054910000005,12500.00,Faktura #2002\n"
        "1,SE8550000000054910000006,8750.50,Faktura #2003\n";
    Csv csv = {0};

    (void)state;
    assert_int_equal(csv_parse(content, (int)strlen(content), &csv), Csv_Error_Success);
    assert_example_batch(&csv);
    csv_free(&csv);
}

static void csv_test_rfc4180_ragged_rows_stay_a_flat_field_list(void **state)
{
    const char *fields[] = {"aaa", "bbb", "ccc"};

    (void)state;
    expect_strings("aaa,bbb\r\nccc\r\n", fields, 3);
}

static void csv_test_rfc4180_backslash_is_not_an_escape(void **state)
{
    const char *fields[] = {"a\\b", "c"};

    (void)state;
    expect_strings("a\\b,c\r\n", fields, 2);
}

static void csv_test_rfc4180_quoted_run_of_commas(void **state)
{
    char content[64];
    Csv csv = {0};
    const int commas = 50;

    (void)state;
    content[0] = '"';
    memset(content + 1, ',', commas);
    content[1 + commas] = '"';
    content[2 + commas] = '\r';
    content[3 + commas] = '\n';
    content[4 + commas] = '\0';

    assert_int_equal(csv_parse(content, 4 + commas, &csv), Csv_Error_Success);
    assert_int_equal(csv.data_length, 1);
    assert_non_null(csv.data[0]);
    assert_int_equal(strlen((char *)csv.data[0]), (size_t)commas);
    for (int i = 0; i < commas; i++) {
        assert_int_equal(((char *)csv.data[0])[i], ',');
    }
    csv_free(&csv);
}

static void csv_test_rfc4180_bare_cr_in_plain_field_is_invalid(void **state)
{
    (void)state;
    expect_invalid("aa\rb,ccc");
    expect_invalid("aaa\r");
}

static void csv_test_rfc4180_unclosed_quote_is_invalid(void **state)
{
    (void)state;
    expect_invalid("\"abc");
    expect_invalid("\"abc\r\n");
    expect_invalid("\"");
    expect_invalid("\"\"\"");
    expect_invalid("\"a\"\"");
    expect_invalid("aaa,\"b,c");
}

static void csv_test_rfc4180_unclosed_quote_discards_earlier_fields(void **state)
{
    (void)state;
    expect_invalid("aaa,bbb\r\n\"ccc");
}

static void csv_test_rfc4180_quote_in_plain_field_is_invalid(void **state)
{
    (void)state;
    expect_invalid("ab\"c");
    expect_invalid(" \"aaa\",bbb");
}

static void csv_test_rfc4180_junk_after_closing_quote_is_invalid(void **state)
{
    (void)state;
    expect_invalid("\"ab\"c");
    expect_invalid("\"aaa\" ,bbb");
    expect_invalid("\"aaa\" ,\"bbb\"");
}

static void csv_test_plain_integers_and_decimals(void **state)
{
    const char *content = "0,1,42,0.0,1.5,5000.00,8750.50\r\n";
    Csv csv = {0};

    (void)state;
    assert_int_equal(csv_parse(content, (int)strlen(content), &csv), Csv_Error_Success);
    assert_int_equal(csv.data_length, 7);
    assert_int_equal(*(int *)csv.data[0], 0);
    assert_int_equal(*(int *)csv.data[1], 1);
    assert_int_equal(*(int *)csv.data[2], 42);
    assert_double_equal(*(double *)csv.data[3], 0.0, 0.001);
    assert_double_equal(*(double *)csv.data[4], 1.5, 0.001);
    assert_double_equal(*(double *)csv.data[5], 5000.00, 0.001);
    assert_double_equal(*(double *)csv.data[6], 8750.50, 0.001);
    csv_free(&csv);
}

static void csv_test_quoted_numbers_are_typed_after_unquote(void **state)
{
    const char *content = "\"0\",\"42\",\"1.50\",\"10.00\"\r\n";
    Csv csv = {0};

    (void)state;
    assert_int_equal(csv_parse(content, (int)strlen(content), &csv), Csv_Error_Success);
    assert_int_equal(csv.data_length, 4);
    assert_int_equal(*(int *)csv.data[0], 0);
    assert_int_equal(*(int *)csv.data[1], 42);
    assert_double_equal(*(double *)csv.data[2], 1.50, 0.001);
    assert_double_equal(*(double *)csv.data[3], 10.00, 0.001);
    csv_free(&csv);
}

static void csv_test_digit_text_that_is_not_a_pure_number_stays_text(void **state)
{
    const char *fields[] = {"1e2", "123.", "5000.00 SEK", "0.5.1"};

    (void)state;
    expect_strings("1e2,123.,5000.00 SEK,0.5.1\r\n", fields, 4);
}

static void csv_test_signs_spaces_and_punctuation_stay_text(void **state)
{
    const char *fields[] = {"-12", "-12.50", " 1", "1 ", "#2001", "foo.bar"};

    (void)state;
    expect_strings("-12,-12.50, 1,1 ,#2001,foo.bar\r\n", fields, 6);
}

static void csv_test_long_field(void **state)
{
    enum { N = 4096 };
    char content[N + 8];
    Csv csv = {0};

    (void)state;
    memset(content, 'm', N);
    content[N] = ',';
    content[N + 1] = 'z';
    content[N + 2] = '\r';
    content[N + 3] = '\n';
    content[N + 4] = '\0';

    assert_int_equal(csv_parse(content, N + 4, &csv), Csv_Error_Success);
    assert_int_equal(csv.data_length, 2);
    assert_int_equal(strlen((char *)csv.data[0]), (size_t)N);
    assert_int_equal(((char *)csv.data[0])[0], 'm');
    assert_int_equal(((char *)csv.data[0])[N - 1], 'm');
    assert_string_equal((char *)csv.data[1], "z");
    csv_free(&csv);
}

static void csv_test_more_fields_than_the_initial_capacity(void **state)
{
    enum { N = 20 };
    char content[64];
    char expected[N][3];
    const char *fields[N];
    size_t pos = 0;

    (void)state;
    for (int i = 0; i < N; i++) {
        if (i != 0) {
            content[pos++] = ',';
        }
        expected[i][0] = 'a';
        expected[i][1] = (char)('a' + i);
        expected[i][2] = '\0';
        content[pos++] = expected[i][0];
        content[pos++] = expected[i][1];
        fields[i] = expected[i];
    }
    content[pos++] = '\r';
    content[pos++] = '\n';
    content[pos] = '\0';

    expect_strings(content, fields, N);
}

static void csv_test_reparse_replaces_previous_fields(void **state)
{
    Csv csv = {0};

    (void)state;
    assert_int_equal(csv_parse("aaa,bbb\r\n", 9, &csv), Csv_Error_Success);
    assert_int_equal(csv.data_length, 2);

    assert_int_equal(csv_parse("ccc\r\n", 5, &csv), Csv_Error_Success);
    assert_int_equal(csv.data_length, 1);
    assert_non_null(csv.data[0]);
    assert_string_equal((char *)csv.data[0], "ccc");
    csv_free(&csv);
}

int main(void)
{
    const struct CMUnitTest tests[] = {
        cmocka_unit_test(csv_test_null_content_leaves_output_untouched),
        cmocka_unit_test(csv_test_null_content_is_reported_before_null_output),
        cmocka_unit_test(csv_test_null_output),
        cmocka_unit_test(csv_test_zero_length_zeroes_output),
        cmocka_unit_test(csv_test_negative_length_zeroes_output),
        cmocka_unit_test(csv_test_content_len_does_not_read_past_the_prefix),
        cmocka_unit_test(csv_test_values),
        cmocka_unit_test(csv_test_rfc4180_rule1_crlf_between_records),
        cmocka_unit_test(csv_test_rfc4180_rule2_last_record_omits_crlf),
        cmocka_unit_test(csv_test_rfc4180_rule2_single_field_without_break),
        cmocka_unit_test(csv_test_rfc4180_rule3_header_is_a_record),
        cmocka_unit_test(csv_test_rfc4180_rule4_spaces_are_part_of_the_field),
        cmocka_unit_test(csv_test_rfc4180_rule4_empty_fields),
        cmocka_unit_test(csv_test_rfc4180_rule5_quoted_fields),
        cmocka_unit_test(csv_test_rfc4180_rule6_embedded_comma),
        cmocka_unit_test(csv_test_rfc4180_rule6_embedded_crlf),
        cmocka_unit_test(csv_test_rfc4180_rule6_lf_inside_quotes_is_data),
        cmocka_unit_test(csv_test_rfc4180_rule6_quoted_cr_is_data),
        cmocka_unit_test(csv_test_rfc4180_rule7_escaped_quotes),
        cmocka_unit_test(csv_test_rfc4180_quote_comma_and_break_in_one_field),
        cmocka_unit_test(csv_test_rfc4180_quoted_reference_with_comma),
        cmocka_unit_test(csv_test_rfc4180_batch_comma_blank_row_and_newline),
        cmocka_unit_test(csv_test_rfc4180_blank_line_between_records),
        cmocka_unit_test(csv_test_rfc4180_trailing_blank_line),
        cmocka_unit_test(csv_test_rfc4180_file_is_a_blank_line),
        cmocka_unit_test(csv_test_rfc4180_trailing_break_is_not_an_extra_field),
        cmocka_unit_test(csv_test_rfc4180_lf_separated_records),
        cmocka_unit_test(csv_test_example_batch_with_lf),
        cmocka_unit_test(csv_test_rfc4180_ragged_rows_stay_a_flat_field_list),
        cmocka_unit_test(csv_test_rfc4180_backslash_is_not_an_escape),
        cmocka_unit_test(csv_test_rfc4180_quoted_run_of_commas),
        cmocka_unit_test(csv_test_rfc4180_bare_cr_in_plain_field_is_invalid),
        cmocka_unit_test(csv_test_rfc4180_unclosed_quote_is_invalid),
        cmocka_unit_test(csv_test_rfc4180_unclosed_quote_discards_earlier_fields),
        cmocka_unit_test(csv_test_rfc4180_quote_in_plain_field_is_invalid),
        cmocka_unit_test(csv_test_rfc4180_junk_after_closing_quote_is_invalid),
        cmocka_unit_test(csv_test_plain_integers_and_decimals),
        cmocka_unit_test(csv_test_quoted_numbers_are_typed_after_unquote),
        cmocka_unit_test(csv_test_digit_text_that_is_not_a_pure_number_stays_text),
        cmocka_unit_test(csv_test_signs_spaces_and_punctuation_stay_text),
        cmocka_unit_test(csv_test_long_field),
        cmocka_unit_test(csv_test_more_fields_than_the_initial_capacity),
        cmocka_unit_test(csv_test_reparse_replaces_previous_fields),
    };

    return cmocka_run_group_tests(tests, NULL, NULL);
}
