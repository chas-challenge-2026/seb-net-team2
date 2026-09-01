#define _GNU_SOURCE

#include "csv.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

CsvRow* parse_csv(const char* content, int content_len, int* rows_out)
{
    CsvRow* rows = (CsvRow*)malloc(sizeof(CsvRow) * 500);

    const char *csv =
        "from_account_id,to_iban,amount,reference\r\n"
        "1,SE8550000000054910000003,5000.00,Faktura #2001\r\n"
        "1,SE8550000000054910000005,12500.00,Faktura #2002\r\n"
        "1,SE8550000000054910000006,8750.50,Faktura #2003\r\n";

    char* buffer = (char*)malloc(sizeof(char) * strlen(csv) + 1);
    snprintf(buffer, strlen(csv) + 1, "%s", csv);

    int index = 0;

    char* token_ctx = NULL;
    char* token = strtok_r(buffer, "\r\n", &token_ctx);

    while (true)
    {
        printf("Token: %s\n", token);
        char* inner_token_ctx = NULL;
        char* inner_token = strtok_r(token, ",", &inner_token_ctx);

        while (inner_token != NULL) 
        {
            printf("[%d] %s\n", index, inner_token);
            inner_token = strtok_r(NULL, ",", &inner_token_ctx);
        }

        if (inner_token == NULL)
        {
            token = strtok_r(NULL, "\r\n", &token_ctx);
            if (token == NULL)
            {
                printf("Found end!\n");
                break;
            }
            else
            {
                index++;
            }
        }
    }
    return NULL;
}

void free_csv_rows(CsvRow* rows)
{
    if (rows != NULL)
    {
        free(rows);
    }
}