#include "audit.h"
#include <stdio.h>
#include <stdlib.h>

int main()
{
    const char *secret_key = getenv("AUDIT_SIGNING_KEY");

    if (secret_key == NULL)
    {
        printf("AUDIT_SIGNING_KEY is not set\n");
        return 1;
    }

    audit_append(
        "audit.log",
        secret_key,
        1,
        "CREATE_PAYMENT",
        100,
        "Test payment created"
    );

    audit_append(
        "audit.log",
        secret_key,
        2,
        "APPROVE_PAYMENT",
        100,
        "Test payment approved"
    );

    int result = audit_verify(
        "audit.log",
        secret_key
    );

    printf("Verify result: %d\n", result);

    return 0;
}