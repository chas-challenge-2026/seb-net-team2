#ifndef __AUDIT_H_
#define __AUDIT_H_

#include <stddef.h>

/*
 * Native Audit-signering.
 * Audit-loggen använder SHA-256 hashkedja och HMAC-SHA256
 * för att upptäcka manipulation av loggdata.
 */
#define AUDIT_NOTIFICATION_SENT "NOTIFICATION_SENT"
#define AUDIT_NOTIFICATION_FAILED "NOTIFICATION_FAILED"
#define AUDIT_NOTIFICATION_RETRY "NOTIFICATION_RETRY"

/*
 * Initierar en ny audit-loggkedja.
 * Får endast användas för avsiktlig initiering av en ny logg.
 * Returnerar 0 vid lyckad initiering, annars -1.
 */
int audit_initialize(
    const char *log_path,
    const char *secret_key,
    int user_id,
    const char *action,
    int entity_id,
    const char *description);
/*
 * Lägger till en post i Audit-loggen.
 * Returnerar 0 vid lyckad skrivning, annars -1.
 */
int audit_append(
    const char *log_path,
    const char *secret_key,
    int user_id,
    const char *action,
    int entity_id,
    const char *description);

int audit_append_with_hash(
    const char *log_path,
    const char *secret_key,
    int user_id,
    const char *action,
    int entity_id,
    const char *description,
    char *out_hash,
    size_t out_hash_size);

/*
 * Verifierar Audit-loggens integritet.
 * Returnerar -1 om loggen är giltig,
 * -2 vid filöppnings- eller läsfel,
 * annars radnumret för första felaktiga posten.
 */
int audit_verify(
    const char *log_path,
    const char *secret_key);

#endif
