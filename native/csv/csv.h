#ifndef __CSV_H_
#define __CSV_H_

/*
    CSV-parser: ska hantera batchfiler på 10 000+ rader med parallell 
    körning. En ren .NET-implementation är tillräcklig för v1:s 500-radersgräns 
    men skalas inte till produktionsvolymer.

*/

#define CSV_TO_IBAN_LENGTH 35
#define CSV_REFERENCE_LENGTH 101
#define CSV_ERROR_LENGTH 256

typedef struct {
    int     from_account_id;
    char    to_iban[CSV_TO_IBAN_LENGTH];
    double  amount;
    char    reference[CSV_REFERENCE_LENGTH];
    int     valid;         // 1 = ok, 0 = parsningsfel
    char    error[CSV_ERROR_LENGTH];    // felmeddelande om valid == 0
} CsvRow;

// Parsar CSV-innehåll. Allokerar och returnerar array av CsvRow.
// rows_out: antal rader (exkl. header)
// Anroparen ansvarar för att frigöra minnet med free_csv_rows().
CsvRow* parse_csv(const char* content, int content_len, int* rows_out);

void free_csv_rows(CsvRow* rows);


#endif