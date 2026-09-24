#define _GNU_SOURCE

#include "csv.h"

#include <stdlib.h>
#include <string.h>
#include <ctype.h>

static bool is_end_of_line(char *curr)
{
    if (curr[0] == '\r')
    {
        if (curr[1] == '\n')
        {
            return true;
        }
    }
    return false;
}

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

Csv_Error csv_parse(const char* content, int content_len, Csv* out_csv)
{
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

    size_t buffer_alloc_size = sizeof(char) * content_len + 1;
    char* buffer = (char*)malloc(buffer_alloc_size);
    memcpy(buffer, content, buffer_alloc_size - 1);
    buffer[buffer_alloc_size - 1] = '\0';

    int start = 0;
    int current = 0;

    out_csv->data_length = 0;
    out_csv->data_capacity = 8;
    out_csv->data = (void**)malloc(sizeof(void*) * out_csv->data_capacity);
    memset(out_csv->data, 0, sizeof(void*) * out_csv->data_capacity);

    while (true)
    {
        if (current > content_len)
        {
            return Csv_Error_Success;
        }

        bool is_eol = is_end_of_line(&buffer[current]);
        if (buffer[current] == ',' || is_eol)
        {//from_account_i
            // text

            //printf("Checking alpha [%c]\n", buffer[start]);
            if (isalpha(buffer[start]) != 0)
            {

                char* text = (char*)malloc(sizeof(char) * (current - start) + 1);
                memcpy(text, &buffer[start], (current - start));
                text[(current-start)] = '\0';
                printf("Hello test: [%s] | length: %d\n", text, current - start );
                add_to_data(out_csv, (void*)text);
                
                if (!is_eol)
                    start = current + 1; // a comma is just 1 character so we need to add 1.
                else
                {
                    start = current + 2; // eol is 2 characters so we need to add 2.
                    printf("Found EOL[%d]!\n", start);
                }
            }
            else if (isdigit(buffer[start]) != 0)
            {
                bool is_decimal = false;
                for (size_t i = start; i < current; i++)
                {
                    if (buffer[i] == '.')
                    {
                        is_decimal = true;
                        break;
                    }
                }

                char temp_buffer[current - start + 1];
                memcpy(temp_buffer, &buffer[start], current - start);
                temp_buffer[current - start] = '\0';

                printf("Decimal/Digit buffer: [%s]\n", temp_buffer);
                char* temp;

                if (is_decimal)
                {
                    double* decimal_value = (double*)malloc(sizeof(double));
                    *decimal_value = strtod(temp_buffer, &temp);

                    add_to_data(out_csv, (void*)decimal_value);
                }
                else 
                {
                    int* value = (int*)malloc(sizeof(int));
                    *value = strtol(temp_buffer, &temp, 10);

                    add_to_data(out_csv, (void*)value);
                }

                
                start = current + 1;
            }
        }

        current++;
    }

    return Csv_Error_Success;
}

void csv_free(Csv* csv)
{
    if (csv->data != NULL)
    {
        free(csv->data);
    }
}