#include "iban.h"


int validate_iban(const char* iban, int* error_out) {


    return 1;
}

int validate_bic(const char* bic) {


    return 1;
}

int iban_mod97(const char* iban) {
    char iban_rearranged[35];
    memset(iban_rearranged, 0, sizeof(iban_rearranged));

    int iban_converted[70];
    memset(iban_converted, 0, sizeof(iban_converted));
    
    size_t iban_len = strlen(iban);
    int i;

    // Move country code and check digits to the end
    const char* iban_ptr = &iban[4];
    for (i = 0; i < iban_len - 4; i++) {
        iban_rearranged[i] = toupper((unsigned char)(*iban_ptr));
        iban_ptr++;
    }

    iban_ptr = iban;
    for (i = 0; i < 4; i++) {
        iban_rearranged[i + (iban_len - 4)] = toupper((unsigned char)(*iban_ptr));
        iban_ptr++;
    }

    // Convert to integer
    iban_ptr = iban_rearranged;
    int j = 0;
    for (i = 0; i < iban_len; i++) {
        int index_as_num = (int)(*iban_ptr);

        if (index_as_num >= 'A' && index_as_num <= 'Z') { // Is letter
            int value = ((int)(*iban_ptr) - 'A' + 10);
            iban_converted[j] = (value / 10);
            iban_converted[j+1] = (value % 10);
            j++;

        } else if (index_as_num >= '0' && index_as_num <= '9') { // Is number
            iban_converted[j] = ((int)(*iban_ptr) - '0');

        }
        iban_ptr++; 
        j++;
    }
    // Update len to match expanded length
    iban_len = j;

    // modulus
    int remainder = 0;
    
    for (i = 0; i < iban_len; i++) {
        remainder = (remainder * 10 + iban_converted[i]) % 97;
    }

    // printf("Result: %i\n", remainder);

    return remainder;
}