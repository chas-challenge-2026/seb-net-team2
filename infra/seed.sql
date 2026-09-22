-- =========================================================
-- DEV SEED
-- Tömmer befintlig testdata men behåller schema/migrationer
-- =========================================================

TRUNCATE TABLE
    approval_steps,
    payments,
    audit_entries,
    idempotency_keys,
    "approvalLimit",
    accounts,
    users,
    tenants
RESTART IDENTITY CASCADE;


-- Tenant
INSERT INTO tenants (name)
VALUES ('Malmö Bygg AB');


-- password = "password123"
INSERT INTO users (tenant_id, name, email, password_hash, role) VALUES
(1, 'Lisa Persson', 'lisa@malmobygg.se',
 '$2a$11$rGnzXYtp.2j7JOzouSm8PeHltyBLU.ZdZ.DVC2F720NcY.PUAfuoe',
 'Initiator'),

(1, 'Johan Berg', 'johan@malmobygg.se',
 '$2a$11$bDhV5BHgvmwM08nBbUGugOB.3xUbDwqRxLrAPpli.utrvq8x54Wp.',
 'Attestant'),

(1, 'Sara Ek', 'sara@malmobygg.se',
 '$2a$11$1b6oJqXIBVbwb3gs3RVavOJZwf.DUwxdPX.t9NCLRKZCiXlsKWjMW',
 'Admin');


-- Accounts
INSERT INTO accounts
    (tenant_id, account_name, iban, balance, currency)
VALUES
(1, 'Driftkonto',   'SE4550000000058398257466', 2500000.00, 'SEK'),
(1, 'Lönekonto',    'SE4550000000058398257467',  890000.00, 'SEK'),
(1, 'Projektkonto', 'SE4550000000058398257468',  450000.00, 'SEK');


-- Existing payments
INSERT INTO payments
    (
        tenant_id,
        from_account_id,
        to_iban,
        amount,
        currency,
        reference,
        status,
        created_by,
        created_at,
        executed_at
    )
VALUES
(
    1,
    1,
    'SE8550000000054910000003',
    15000.00,
    'SEK',
    'Faktura #1042',
    'completed',
    1,
    NOW(),
    NOW()
),
(
    1,
    1,
    'SE8550000000054910000004',
    75000.00,
    'SEK',
    'Faktura #1043',
    'pending_approval',
    1,
    NOW(),
    NULL
);


-- Approval step for payment #2
INSERT INTO approval_steps
    (payment_id, attestant_id, step_number, status)
VALUES
    (2, 2, 1, 'pending');


-- Audit log
INSERT INTO audit_entries
    (user_id, action, entity_type, entity_id, description, created_at)
VALUES
(
    1,
    'CREATE_PAYMENT',
    'payment',
    1,
    'Skapade betalning 15000 SEK till SE8550000000054910000003',
    NOW()
),
(
    1,
    'CREATE_PAYMENT',
    'payment',
    2,
    'Skapade betalning 75000 SEK till SE8550000000054910000004',
    NOW()
);


-- Approval limits
INSERT INTO "approvalLimit"
    (
        tenant_id,
        "minAmount",
        "requiredApprovals",
        description,
        created_at,
        "lastModified_at",
        "lastModified_by"
    )
VALUES
(
    1,
    50000.00,
    1,
    'Kräver 1 attestant',
    NOW(),
    NOW(),
    'seed'
),
(
    1,
    200000.00,
    2,
    'Kräver 2 attestanter (dubbelattest)',
    NOW(),
    NOW(),
    'seed'
);