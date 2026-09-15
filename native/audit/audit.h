#ifndef __AUDIT_H_
#define __AUDIT_H_

/*
    Audit-signering: kräver kryptografisk integritet. En HMAC-SHA256-kedja i
    C är lättare att granska och auditeras utan .NET runtime-beroenden.
*/

#define AUDIT_NOTIFICATION_SENT "NOTIFICATION_SENT"
#define AUDIT_NOTIFICATION_FAILED "NOTIFICATION_FAILED"
#define AUDIT_NOTIFICATION_RETRY "NOTIFICATION_RETRY"

int audit_append(
    const char *log_path,
    const char *secret_key,
    int user_id,
    const char *action,
    int entity_id,
    const char *description);

int audit_verify(
    const char *log_path,
    const char *secret_key);

#endif