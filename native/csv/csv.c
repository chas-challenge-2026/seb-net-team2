#define _GNU_SOURCE

#include "csv.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <errno.h>
#include <math.h>

typedef enum
{
    Row_Data_From_Account_Id = 0,
    Row_Data_To_Iban,
    Row_Data_Amount,
    Row_Data_Reference
} RowData;

static bool is_end_of_line(char* curr)
{
    if (curr[0] == '\r' || curr[0] == '\0')
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

    char *csv =
        "from_account_id,to_iban,amount,reference\r\n"
        "1,SE8550000000054910000003,5000.00,Faktura #2001\r\n"
        "1,SE8550000000054910000005,12500.00,Faktura #2002\r\n"
        "1,SE8550000000054910000006,8750.50,Faktura #2003\r\n";

    char* buffer = (char*)malloc(sizeof(char) * strlen(csv) + 1);
    snprintf(buffer, sizeof(char) * strlen(csv) + 1, "%s", csv);

    char* start = buffer;
    char* current = start;
    int length = 0;

    bool is_headers = true;

    int index = 0;
    int inner_index = 0;

    while (true)
    {
        //printf("Current: %c\r\n", current[0]);

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
            continue;
        }

        if (current[0] != ',')
        {
            printf("Current: %c\n", current[0]);
            current++;
            length++;
        }
        else if (current[0] == ',')
        {
            char* temp;
            switch (inner_index)
            {
            case Row_Data_From_Account_Id:
                current[0] = '\0';

                rows[index].from_account_id = strtol(start, &temp, 10);
                length = 0;
                //printf("ID: %d\n", rows[index].from_account_id);
                current = &current[1];
                start = current;

                break;
            case Row_Data_To_Iban:
                current[0] = '\0';

                snprintf(rows[index].to_iban, CSV_TO_IBAN_LENGTH, "%s", start);
                printf("TO IBAN: %s\n", rows[index].to_iban);

                length = 0;
                current = &current[1];
                start = current;

                break;
            case Row_Data_Amount:
                current[0] = '\0';

                rows[index].amount = strtod(start, &temp);
                printf("Amount: %lf\n", rows[index].amount);

                length = 0;
                current = &current[1];
                start = current;
                break;
            case Row_Data_Reference:
                strncpy(rows[index].reference, start, length);
                printf("[Reference: %s]\n", rows[index].reference);

                length = 0;
                current = &current[1];
                start = current;
                break;
            default:
                printf("Inner index is out of range\n");
                return NULL;
                break;
            }

            inner_index++;
            //start = &current[1];
        }
        else if (is_end_of_line(current))
        {
            printf("Found current!\n");
            index++;
            inner_index = 0;
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