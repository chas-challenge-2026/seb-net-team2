#include "iban_validator.h"

const char* VALID_COUNTRY_CODES[] = {
"AL", "AD", "AT", "AZ", "BH", "BY", "BE", "BA", "BR", "BG",
"BI", "CR", "HR", "CY", "CZ", "DK", "DJ", "DO", "EG", "SV",
"EE", "FK", "FO", "FI", "FR", "GE", "DE", "GI", "GR", "GL",
"GT", "HN", "HU", "IS", "IQ", "IE", "IL", "IT", "JO", "KZ",
"XK", "KW", "LV", "LB", "LY", "LI", "LT", "LU", "MT", "MR",
"MU", "MD", "MC", "MN", "ME", "NL", "NI", "MK", "NO", "PK",
"PS", "PL", "PT", "QA", "RO", "RU", "LC", "SM", "ST", "SA",
"RS", "SC", "SK", "SI", "SO", "ES", "VA", "SD", "OM", "SE",
"CH", "TL", "TN", "TR", "UA", "AE", "GB", "VG", "YE"
};

const int NUM_COUNTRY_CODES = sizeof(VALID_COUNTRY_CODES) / sizeof(VALID_COUNTRY_CODES[0]);

int validate_iban(const char* iban, int* error_out) {
    if (!iban || !error_out) { return -1; }

    // Length
    size_t length = strlen(iban);

    if (length < 15 || length > 34) {
        *error_out = 1;
        return 0;
    }

    // Invalid characters
    const char* iban_ptr = iban;
    for (int i = 0; i < 2; i++){
        if (!isalpha((unsigned char)(*iban_ptr))) {
            *error_out = 3;
            return 0;
        } else {
            iban_ptr++;
        }
    }
    for (int i = 2; i < 4; i++){
        if (!isdigit((unsigned char)(*iban_ptr))) {
            *error_out = 3;
            return 0;
        } else {
            iban_ptr++;
        }
    }
    for (int i = 4; i < length; i++){
        if (!isalnum((unsigned char)(*iban_ptr))) {
            *error_out = 3;
            return 0;
        } else {
            iban_ptr++;
        }
    }

    // Country code
    char country_code[3];
    country_code[0] = toupper((unsigned char)iban[0]);
    country_code[1] = toupper((unsigned char)iban[1]);
    country_code[2] = '\0';

    int cc_match = 0;
    for (int i = 0; i < NUM_COUNTRY_CODES; i++) {
        if (strcmp(country_code, VALID_COUNTRY_CODES[i]) == 0) {
            cc_match = 1;
            break;
        }
    }
    if (!cc_match) {
        *error_out = 2;
        return 0;
    }

    // MOD97 Checksum
    if (iban_mod97(iban) != 1) {
        *error_out = 4;
        return 0;
    }

    return 1;
}

int validate_bic(const char* bic) {
    if (!bic) { return -1; }

    size_t length = strlen(bic);
    if (length != 8 && length != 11) { return 0;}

    const char* bic_ptr = bic;

    // Bank + Country code format
    int i = 0;
    for (i = 0; i < 6; i++) {
        char index_as_val = toupper((unsigned char)(*bic_ptr));
        if (index_as_val >= 'A' && index_as_val <= 'Z') {
            bic_ptr++;
            continue;
        } else {
            return 0;
        }
    }

    // Location code + optional branch code format

    for (i = 6; i < length; i++) {
        char index_as_val = toupper((unsigned char)(*bic_ptr));
        if (index_as_val >= 'A' && index_as_val <= 'Z') {
            bic_ptr++;
            continue;
        } else if (index_as_val >= '0' && index_as_val <= '9') {
            bic_ptr++;
            continue;
        } else {
            return 0;
        }
    }

    return 1;
}

int iban_mod97(const char* iban) {
    if (!iban) { return -1; }

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

    // Modulus 97
    int remainder = 0;
    
    for (i = 0; i < iban_len; i++) {
        remainder = (remainder * 10 + iban_converted[i]) % 97;
    }

    return remainder;
}