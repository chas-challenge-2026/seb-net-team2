#include "audit.h"
#include <stdio.h>

int main()
{
    audit_append(
        "audit.log",
        "my_secret_key",
        1,
        "CREATE_PAYMENT",
        100,
        "Test payment created"
    );

    audit_append(
        "audit.log",
        "my_secret_key",
        2,
        "APPROVE_PAYMENT",
        100,
        "Test payment approved"
    );

        int result = audit_verify(
        "audit.log",
        "my_secret_key"
    );

    printf("Verify result: %d\n", result);

    return 0;
}