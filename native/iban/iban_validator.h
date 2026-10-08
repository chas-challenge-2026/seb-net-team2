#ifndef __IBAN_VALIDATOR_H_
#define __IBAN_VALIDATOR_H_

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

/*
    IBAN-validator: implementerar ISO 13616 MOD97-algoritmen. 
    En C-implementation är trivial att formellt verifiera och enkelt att 
    porta till mobilklienter (iOS/Android via FFI).
*/

// Returnerar 1 om IBAN är giltig (format + MOD97), annars 0
// error_out: om 0 returneras, sätts till felkod
//   1 = för kort/lång
//   2 = ogiltigt landskod
//   3 = felaktigt tecken
//   4 = MOD97-fel (fel kontrollsiffror)
int validate_iban(const char* iban, int* error_out);

// Returnerar 1 om BIC är giltig (ISO 9362), annars 0
int validate_bic(const char* bic);

// MOD97-kontrollsiffra — returnerar beräknad checksumma (0-97)
int iban_mod97(const char* iban);


#endif