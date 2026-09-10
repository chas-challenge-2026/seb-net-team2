#define _GNU_SOURCE

#include "csv.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

typedef enum
{
    Row_Data_From_Account_Id = 0,
    Row_Data_To_Iban,
    Row_Data_Amount,
    Row_Data_Reference
} RowData;

static bool is_end_of_line(char* curr)
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

CsvRow* parse_csv(const char* content, int content_len, int* rows_out)
{
    CsvRow* rows = (CsvRow*)malloc(sizeof(CsvRow) * 500);
    if (rows == NULL)
    {
        return NULL;
    }
    memset(rows, 0, sizeof(CsvRow) * 500);

    char* buffer = (char*)malloc(content_len + 1);
    if (buffer == NULL)
    {
        rows->valid = 0;
        snprintf(rows->error, CSV_ERROR_LENGTH, "%s\n", "ERROR: Slut på heap memory");
        return NULL;
    }

    snprintf(buffer, content_len, "%s", content);

    char* start = buffer;
    char* current = start;
    int length = 0;

    size_t current_length = 0;
    size_t full_length = content_len;

    bool is_headers = true;

    int fields = 0;
    int index = 0;
    int inner_index = 0;

    while (true)
    {
        if (current_length >= full_length)
        {
            rows->valid = 1;
            *rows_out = index + 1;
            return rows;
        }

        if (is_headers)
        {
            if (is_end_of_line(current))
            {
                current = &current[2];
                start = current;
                is_headers = false;
                
                continue;
            }

            current++;
            current_length++;
            continue;
        }

        bool eol = is_end_of_line(current);
        if (eol || current[0] == ',')
        {
            char* temp;
            current[0] = '\0';

            switch (inner_index)
            {
            case Row_Data_From_Account_Id:
                rows[index].from_account_id = strtol(start, &temp, 10);
                break;
            case Row_Data_To_Iban:
                snprintf(rows[index].to_iban, CSV_TO_IBAN_LENGTH, "%s", start);
                break;
            case Row_Data_Amount:
                rows[index].amount = strtod(start, &temp);
                break;
            case Row_Data_Reference:
                snprintf(rows[index].reference, CSV_REFERENCE_LENGTH, "%s", start);

                break;
            default:
                rows->valid = 0;
                snprintf(rows->error, CSV_ERROR_LENGTH, "%s\n", "ERROR: Inner index är utanför range");
                return rows;
                break;
            }

            if (eol) 
            {
                if (fields != 3)
                {
                    snprintf(rows->error, CSV_ERROR_LENGTH, "%s\n", "ERROR: Fields matchar inte header fields");
                    rows->valid = 0;
                    return rows;
                }

                current += 2;
                current_length += 2;
                start = current;
                index++;
                inner_index = 0;
                fields = 0;
            } 
            else 
            { // comma
                fields++;
                current += 1;
                current_length += 1;
                start = current;
                inner_index++;
            }
        }
        else
        {
            current_length++;
            current++;
            length++;
        }
    }
    return rows;
}

void free_csv_rows(CsvRow* rows)
{
    if (rows != NULL)
    {
        free(rows);
    }
}