#include "csv.h"

#include <stdlib.h>
#include <string.h>

static void add_to_data(Csv* csv, void* data)
{
    if (csv->data_length == csv->data_capacity)
    {
        size_t previous_size = csv->data_capacity;
        csv->data_capacity *= 2;
        csv->data = (void **)realloc(csv->data, sizeof(void *) * csv->data_capacity);
        memset(&csv->data[csv->data_length], 0, sizeof(void *) * (csv->data_capacity - previous_size));
    }

    csv->data[csv->data_length] = data;
    csv->data_length++;
}

void csv_free(Csv* csv)
{
    if (csv == NULL || csv->data == NULL)
    {
        return;
    }

    for (size_t i = 0; i < csv->data_length; i++)
    {
        free(csv->data[i]);
    }
    free(csv->data);
    csv->data = NULL;
    csv->data_length = 0;
    csv->data_capacity = 0;
}

static Csv_Error fail_parse(Csv* csv, char* buffer)
{
    csv_free(csv);
    free(buffer);
    memset(csv, 0, sizeof(*csv));
    return Csv_Error_Invalid_Parsing;
}

static bool is_integer_text(const char* text, size_t length)
{
    if (length == 0)
    {
        return false;
    }
    for (size_t i = 0; i < length; i++)
    {
        if (text[i] < '0' || text[i] > '9')
        {
            return false;
        }
    }
    return true;
}

static bool is_decimal_text(const char* text, size_t length)
{
    size_t i = 0;

    while (i < length && text[i] >= '0' && text[i] <= '9')
    {
        i++;
    }
    if (i == 0 || i >= length || text[i] != '.')
    {
        return false;
    }

    i++;
    if (i >= length)
    {
        return false;
    }
    while (i < length && text[i] >= '0' && text[i] <= '9')
    {
        i++;
    }
    return i == length;
}

// This saves the actual element data and adds it on csv->data.
static Csv_Error emit_field(Csv* csv, const char* buffer, int start, int end)
{
    bool quoted = end > start && buffer[start] == '"';
    char* text = NULL;
    size_t length = 0;

    if (quoted)
    {
        int inner_start = start + 1;
        int inner_end = end - 1;
        size_t pos = 0;

        if (inner_end < inner_start || buffer[end - 1] != '"')
        {
            return Csv_Error_Invalid_Parsing;
        }

        length = 0;
        for (int i = inner_start; i < inner_end; i++)
        {
            length++;
            if (buffer[i] == '"' && i + 1 < inner_end && buffer[i + 1] == '"')
            {
                i++;
            }
        }

        text = (char*)malloc(length + 1);
        if (text == NULL)
        {
            return Csv_Error_Invalid_Parsing;
        }

        for (int i = inner_start; i < inner_end; i++)
        {
            text[pos++] = buffer[i];
            if (buffer[i] == '"' && i + 1 < inner_end && buffer[i + 1] == '"')
            {
                i++;
            }
        }
        text[pos] = '\0';
        length = pos;
    }
    else
    {
        length = (size_t)(end - start);
        text = (char*)malloc(length + 1);
        if (text == NULL)
        {
            return Csv_Error_Invalid_Parsing;
        }
        if (length > 0)
        {
            memcpy(text, buffer + start, length);
        }
        text[length] = '\0';
    }

    if (is_integer_text(text, length))
    {
        int* stored = (int*)malloc(sizeof(int));
        if (stored == NULL)
        {
            free(text);
            return Csv_Error_Invalid_Parsing;
        }
        *stored = (int)strtol(text, NULL, 10);
        free(text);
        add_to_data(csv, stored);
        return Csv_Error_Success;
    }
    else if (is_decimal_text(text, length))
    {
        double* stored = (double*)malloc(sizeof(double));
        if (stored == NULL)
        {
            free(text);
            return Csv_Error_Invalid_Parsing;
        }
        *stored = strtod(text, NULL);
        free(text);
        add_to_data(csv, stored);
        return Csv_Error_Success;
    }

    add_to_data(csv, text);
    return Csv_Error_Success;
}

Csv_Error csv_parse(const char* content, int content_len, Csv* out_csv)
{
    char* buffer = NULL;
    int start = 0;
    int current = 0;
    bool in_quotes = false;
    bool require_delimiter = false;
    bool ended_on_record_separator = false;

    if (content == NULL)
    {
        return Csv_Error_Content_Is_NULL;
    }

    if (out_csv == NULL)
    {
        return Csv_Error_Out_Csv_Is_NULL;
    }

    memset(out_csv, 0, sizeof(Csv));

    if (content_len <= 0)
    {
        return Csv_Error_Content_Length_Is_Invalid;
    }

    buffer = (char*)malloc((size_t)content_len + 1);
    if (buffer == NULL)
    {
        return Csv_Error_Invalid_Parsing;
    }

    memcpy(buffer, content, (size_t)content_len);
    buffer[content_len] = '\0';

    out_csv->data_length = 0;
    out_csv->data_capacity = 8;
    out_csv->data = (void**)malloc(sizeof(void*) * out_csv->data_capacity);
    if (out_csv->data == NULL)
    {
        free(buffer);
        memset(out_csv, 0, sizeof(Csv));
        return Csv_Error_Invalid_Parsing;
    }
    memset(out_csv->data, 0, sizeof(void*) * out_csv->data_capacity);

    while (true)
    {
        char c;

        if (current == content_len)
        {
            if (in_quotes)
            {
                return fail_parse(out_csv, buffer);
            }

            /* We do not create an empty field, as there is no point. */
            if (!(start == content_len && ended_on_record_separator))
            {
                if (emit_field(out_csv, buffer, start, current) != Csv_Error_Success)
                {
                    return fail_parse(out_csv, buffer);
                }
            }
            free(buffer);
            return Csv_Error_Success;
        }

        c = buffer[current];

        if (in_quotes)
        {
            if (c == '"')
            {
                if (current + 1 < content_len && buffer[current + 1] == '"')
                {
                    current += 2;
                    continue;
                }
                in_quotes = false;
                require_delimiter = true;
                current++;
                continue;
            }
            current++;
            continue;
        }

        if (c == '"' && current == start)
        {
            in_quotes = true;
            current++;
            continue;
        }

        if (c == ',')
        {
            if (emit_field(out_csv, buffer, start, current) != Csv_Error_Success)
            {
                return fail_parse(out_csv, buffer);
            }
            start = current + 1;
            ended_on_record_separator = false;
            require_delimiter = false;
            current++;
            continue;
        }

        if (c == '\n')
        {
            if (emit_field(out_csv, buffer, start, current) != Csv_Error_Success)
            {
                return fail_parse(out_csv, buffer);
            }
            start = current + 1;
            ended_on_record_separator = true;
            require_delimiter = false;
            current++;
            continue;
        }

        if (c == '\r')
        {
            if (current + 1 < content_len && buffer[current + 1] == '\n')
            {
                if (emit_field(out_csv, buffer, start, current) != Csv_Error_Success)
                {
                    return fail_parse(out_csv, buffer);
                }
                start = current + 2;
                ended_on_record_separator = true;
                require_delimiter = false;
                current += 2;
                continue;
            }
            return fail_parse(out_csv, buffer);
        }

        if (require_delimiter || c == '"')
        {
            return fail_parse(out_csv, buffer);
        }

        current++;
    }
}
