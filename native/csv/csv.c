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
                printf("Hello world!\n");


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
            if (isalpha(buffer[start]) != 0)
            {
                char* text = (char*)malloc(sizeof(char) * (current - start) + 1);
                memcpy(text, &buffer[start], (current - start));
                text[(current-start)] = '\0';
                printf("Hello test: [%s] | length: %d\n", text, current - start );

                if (out_csv->data_length == out_csv->data_capacity)
                {
                    size_t previous_size = out_csv->data_capacity;
                    out_csv->data_capacity *= 2;
                    out_csv->data = (void**)realloc(out_csv->data, sizeof(void*) * out_csv->data_capacity);
                    memset(&out_csv->data[out_csv->data_length], 0, sizeof(void*) * out_csv->data_capacity - previous_size); 
                }

                out_csv->data[out_csv->data_length] = (void*)text;
                out_csv->data_length++;
                
                if (!is_eol)
                    start = current + 1; // a comma is just 1 character so we need to add 1.
                else
                    start = current + 2; // eol is 2 characters so we need to add 2.
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