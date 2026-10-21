#ifndef __CSV_H_
#define __CSV_H_

#include <stdbool.h>
#include <stdio.h>

/*
    CSV-parser: ska hantera batchfiler på 10 000+ rader med parallell 
    körning. En ren .NET-implementation är tillräcklig för v1:s 500-radersgräns 
    men skalas inte till produktionsvolymer.

*/

typedef enum
{
    Csv_Error_Success = 0,
    Csv_Error_Content_Is_NULL = -10, // Happens if someone tries to pass a NULL ptr as content.
    Csv_Error_Out_Csv_Is_NULL, // Happens if someone tries to pass a NULL ptr as out_csv.
    Csv_Error_Content_Length_Is_Invalid, // Happens if content length is too short (<= 0).
    Csv_Error_Invalid_Parsing, // Happens when the CSV file is formatted wrong so parsing it wont work.
} Csv_Error;

typedef struct 
{
    void** data;
    size_t data_capacity;
    size_t data_length;
} Csv;

// Parsar CSV-innehåll. Allokerar och returnerar error Kod (0 eller Csv_Error_Success vid success).
// content: CSV strängen att parsa
// content_len: Längden på CSV length.
// out_csv: Det parsade CSV resultatet
Csv_Error csv_parse(const char* content, int content_len, Csv* out_csv);

// free:ar rows->data o dess indexes.
void csv_free(Csv* rows);


#endif