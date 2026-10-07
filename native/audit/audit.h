#ifndef __AUDIT_H_
#define __AUDIT_H_

/*
 * Native Audit-signering.
 * Audit-loggen använder SHA-256 hashkedja och HMAC-SHA256
 * för att upptäcka manipulation av loggdata.
 */
#define AUDIT_NOTIFICATION_SENT "NOTIFICATION_SENT"
#define AUDIT_NOTIFICATION_FAILED "NOTIFICATION_FAILED"
#define AUDIT_NOTIFICATION_RETRY "NOTIFICATION_RETRY"

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

/*
 * Verifierar Audit-loggens integritet.
 * Returnerar -1 om loggen är giltig,
 * annars radnumret för första felaktiga posten.
 */
int audit_verify(
    const char *log_path,
    const char *secret_key);

#endif
