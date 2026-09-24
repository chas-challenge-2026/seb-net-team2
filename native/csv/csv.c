#define _GNU_SOURCE

#include "csv.h"

#include <stdio.h>
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

    out_csv->data = (void*)malloc(sizeof(void*) * 8);
    memset(out_csv->data, 0, sizeof(void*) * 8);


    while (true)
    {
        if (buffer[current] == ',')
        {
            if (isalpha(start) != 0)
            {
                
            }
        }

        current++;
    }




    return 0;
}

void csv_free(Csv* csv)
{
    if (csv->data != NULL)
    {
        free(csv->data);
    }
}