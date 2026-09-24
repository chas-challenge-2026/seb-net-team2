-- =========================================================
-- DEV SEED
-- Tömmer befintlig testdata men behåller schema/migrationer
-- =========================================================
--
-- Översikt (id:n är deterministiska tack vare RESTART IDENTITY)
--
--   Tenant 1  Malmö Bygg AB            users 1-5    accounts 1-3   payments 1-8
--   Tenant 2  Göteborg Frakt AB        users 6-9    accounts 4-5   payments 9-13
--   Tenant 3  Stockholm IT Konsult AB  users 10-13  accounts 6-7   payments 14-17
--   Tenant 4  Umeå Livs AB             users 14-16  account  8     payments 18-20
--
-- Alla användare har lösenordet "password123".
-- Alla IBAN:er har giltig MOD97-kontrollsumma (ISO 13616).
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


-- Tenants
INSERT INTO tenants (name) VALUES
('Malmö Bygg AB'),            -- 1
('Göteborg Frakt AB'),        -- 2
('Stockholm IT Konsult AB'),  -- 3
('Umeå Livs AB');             -- 4


-- Users (password = "password123")
INSERT INTO users (tenant_id, name, email, password_hash, role) VALUES
-- Tenant 1: Malmö Bygg AB
(1, 'Lisa Persson',    'lisa@malmobygg.se',     '$2a$11$rGnzXYtp.2j7JOzouSm8PeHltyBLU.ZdZ.DVC2F720NcY.PUAfuoe', 'Initiator'),  -- 1
(1, 'Rickard Larsson', 'rickard@malmobygg.se',  '$2a$11$Ye3lnkknAOvSnhlhXUrpWex6lILwnaUpkIFBEQ8bvszRT2PirxAni', 'Initiator'),  -- 2
(1, 'Hanna Andersson', 'hanna@malmobygg.se',    '$2a$11$tLcFZLfLlzFjTqp3I1uasehPkhnLo0iAGMkky0WnxB6aSGPtStwG2', 'Attestant'),  -- 3
(1, 'Johan Berg',      'johan@malmobygg.se',    '$2a$11$bDhV5BHgvmwM08nBbUGugOB.3xUbDwqRxLrAPpli.utrvq8x54Wp.', 'Attestant'),  -- 4
(1, 'Sara Ek',         'sara@malmobygg.se',     '$2a$11$1b6oJqXIBVbwb3gs3RVavOJZwf.DUwxdPX.t9NCLRKZCiXlsKWjMW', 'Admin'),      -- 5

-- Tenant 2: Göteborg Frakt AB
(2, 'Erik Nilsson',    'erik@gbgfrakt.se',      '$2a$11$S.RoBN2H.AIkFKzqQ0z3beMHDLpbaSfkIDz7TGMoEkgvRJwXJ7ZVa', 'Admin'),      -- 6
(2, 'Maria Lindqvist', 'maria@gbgfrakt.se',     '$2a$11$EFEdvGr.xaAOqbFq/9uNBui8VcVolLr336MZ2Fq6rkB/XD9NMOB4m', 'Initiator'),  -- 7
(2, 'Ahmed Hassan',    'ahmed@gbgfrakt.se',     '$2a$11$G6gwxq.6HcdOA.EI8Xv0W..0cDrH6NJe061TfPHWwoS9uQrOvpN5m', 'Attestant'),  -- 8
(2, 'Karin Sjöberg',   'karin@gbgfrakt.se',     '$2a$11$ZQ9eX4BW15eFX71xI8ZhhefrwiO1ImHS/1ITfb8dbN3naOdjnilUe', 'Attestant'),  -- 9

-- Tenant 3: Stockholm IT Konsult AB
(3, 'Anna Holm',       'anna@sthlmit.se',       '$2a$11$UE1mqTm1sNKCSd.y.NuF2uoswmyJsMuHsgAgs2Bm.HN8aQJ8Yzfgq', 'Admin'),      -- 10
(3, 'Oscar Wallin',    'oscar@sthlmit.se',      '$2a$11$ekw5G/U.qUInbooXQShpMeajeyTDQuiXi96iDrw..HJPtv86iiY8O', 'Initiator'),  -- 11
(3, 'Fatima Ali',      'fatima@sthlmit.se',     '$2a$11$49ws21.5DWwA9sRp42Fw9OrbUmjO9.P.Le2VPGg03b6NhGor04Cky', 'Attestant'),  -- 12
(3, 'Per Gustafsson',  'per@sthlmit.se',        '$2a$11$Uo15UxDTazH11w3F7kDPzuajOwJGgQjFAF6o8twElZozv/hf.dd.y', 'Attestant'),  -- 13

-- Tenant 4: Umeå Livs AB
(4, 'Emma Lund',       'emma@umealivs.se',      '$2a$11$sLEE2kzKMn6BQVoEIkiqwOOB0j.svZCRMos21.RaRDxSWySAFqjwa', 'Admin'),      -- 14
(4, 'Jonas Öberg',     'jonas@umealivs.se',     '$2a$11$hOqvHCMuYOxr63.Qpp7aNuPxtyuTC9YsYyI6toHHtknVqCD0ny2Ym', 'Initiator'),  -- 15
(4, 'Sofia Karlsson',  'sofia@umealivs.se',     '$2a$11$kRo6tkP8ZqqDdZIGjQlT3uqWbW/uIO6riIo7AjvC.CqiIhjdTApCO', 'Attestant');  -- 16


-- Accounts
INSERT INTO accounts
    (tenant_id, account_name, iban, balance, currency)
VALUES
(1, 'Driftkonto',      'SE4550000000058398257466', 2500000.00, 'SEK'),  -- 1
(1, 'Lönekonto',       'SE1850000000058398257467',  890000.00, 'SEK'),  -- 2
(1, 'Projektkonto',    'SE8850000000058398257468',  450000.00, 'SEK'),  -- 3
(2, 'Driftkonto',      'SE5880000000012345670001', 1200000.00, 'SEK'),  -- 4
(2, 'Bränslekonto',    'SE3180000000012345670002',  340000.00, 'SEK'),  -- 5
(3, 'Driftkonto',      'SE7760000000098765430001', 3100000.00, 'SEK'),  -- 6
(3, 'Konsultarvoden',  'SE5060000000098765430002',  780000.00, 'SEK'),  -- 7
(4, 'Driftkonto',      'SE9895000000044455560001',  610000.00, 'SEK');  -- 8


-- Payments
-- Status: completed (executed_at satt), pending_approval, rejected
-- Betalningar under tenantens lägsta attestgräns har inga approval steps.
INSERT INTO payments
    (tenant_id, from_account_id, to_iban, amount, currency, reference, status, created_by, created_at, executed_at)
VALUES
-- Tenant 1: Malmö Bygg AB (gränser: 50 000 = 1 attest, 200 000 = 2 attester)
(1, 1, 'SE3550000000054910000003',  15000.00, 'SEK', 'Faktura #1042',            'completed',        1, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),  -- 1
(1, 1, 'SE0850000000054910000004',  75000.00, 'SEK', 'Faktura #1043',            'pending_approval', 1, NOW() - INTERVAL '2 days',  NULL),                        -- 2
(1, 2, 'SE8730000000011122230001',  32000.00, 'SEK', 'Konsultarvode mars',       'completed',        2, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),  -- 3
(1, 1, 'SE6030000000011122230002', 250000.00, 'SEK', 'Betongleverans Q3',        'pending_approval', 1, NOW() - INTERVAL '3 days',  NULL),                        -- 4
(1, 3, 'SE3330000000011122230003', 120000.00, 'SEK', 'Byggställning uthyrning',  'completed',        2, NOW() - INTERVAL '14 days', NOW() - INTERVAL '13 days'),  -- 5
(1, 3, 'SE0630000000011122230004',  60000.00, 'SEK', 'Maskinhyra augusti',       'rejected',         1, NOW() - INTERVAL '10 days', NULL),                        -- 6
(1, 1, 'SE7630000000011122230005', 300000.00, 'SEK', 'Takentreprenad etapp 2',   'rejected',         2, NOW() - INTERVAL '7 days',  NULL),                        -- 7
(1, 2, 'SE8730000000011122230001',  55000.00, 'SEK', 'Faktura #1051',            'pending_approval', 2, NOW() - INTERVAL '1 day',   NULL),                        -- 8

-- Tenant 2: Göteborg Frakt AB (gränser: 25 000 = 1 attest, 100 000 = 2 attester)
(2, 4, 'SE5412000000077788890001',  12000.00, 'SEK', 'Däckbyte lastbil 4',       'completed',        7, NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),  -- 9
(2, 5, 'SE2712000000077788890002',  40000.00, 'SEK', 'Diesel september',         'pending_approval', 7, NOW() - INTERVAL '2 days',  NULL),                        -- 10
(2, 4, 'SE9712000000077788890003', 150000.00, 'SEK', 'Leasing släpvagnar Q4',    'pending_approval', 7, NOW() - INTERVAL '4 days',  NULL),                        -- 11
(2, 4, 'SE7012000000077788890004',  80000.00, 'SEK', 'Lagerhyra Hisingen',       'completed',        7, NOW() - INTERVAL '18 days', NOW() - INTERVAL '17 days'),  -- 12
(2, 5, 'SE4312000000077788890005',  30000.00, 'SEK', 'Faktura #G-2208',          'rejected',         7, NOW() - INTERVAL '9 days',  NULL),                        -- 13

-- Tenant 3: Stockholm IT Konsult AB (gränser: 100 000 = 1 attest, 500 000 = 2 attester)
(3, 7, 'SE8730000000011122230001',  45000.00, 'SEK', 'Underkonsult juli',        'completed',       11, NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days'),  -- 14
(3, 6, 'SE6030000000011122230002',  95000.00, 'SEK', 'Licenser Microsoft 365',   'completed',       11, NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),  -- 15
(3, 6, 'SE3330000000011122230003', 180000.00, 'SEK', 'Serverhall kvartal 4',     'pending_approval',11, NOW() - INTERVAL '1 day',   NULL),                        -- 16
(3, 7, 'SE0630000000011122230004', 750000.00, 'SEK', 'Underkonsulter projekt X', 'pending_approval',11, NOW() - INTERVAL '5 days',  NULL),                        -- 17

-- Tenant 4: Umeå Livs AB (gräns: 20 000 = 1 attest)
(4, 8, 'SE5412000000077788890001',   8500.00, 'SEK', 'Förpackningar',            'completed',       15, NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days'),  -- 18
(4, 8, 'SE2712000000077788890002',  35000.00, 'SEK', 'Råvaror vecka 38',         'pending_approval',15, NOW() - INTERVAL '2 days',  NULL),                        -- 19
(4, 8, 'SE9712000000077788890003',  22000.00, 'SEK', 'Kylservice',               'completed',       15, NOW() - INTERVAL '12 days', NOW() - INTERVAL '11 days');  -- 20


-- Approval steps
INSERT INTO approval_steps
    (payment_id, attestant_id, step_number, status, decided_at, comment)
VALUES
-- Tenant 1
(2,  4,  1, 'pending',  NULL,                        NULL),
(4,  3,  1, 'approved', NOW() - INTERVAL '2 days',   'Stämmer med offert'),
(4,  4,  2, 'pending',  NULL,                        NULL),
(5,  4,  1, 'approved', NOW() - INTERVAL '13 days',  NULL),
(6,  3,  1, 'rejected', NOW() - INTERVAL '9 days',   'Fel mottagare, kontrollera IBAN'),
-- Betalning 7: steg 1 avslaget, steg 2 ligger kvar som pending.
-- Återskapar buggen där ett pending-steg finns kvar på en avslagen betalning.
-- Ska INTE synas i Hannas pending-lista eller i PendingApprovalsCount.
(7,  4,  1, 'rejected', NOW() - INTERVAL '6 days',   'Ej budgeterat i år'),
(7,  3,  2, 'pending',  NULL,                        NULL),
(8,  3,  1, 'pending',  NULL,                        NULL),

-- Tenant 2
(10, 8,  1, 'pending',  NULL,                        NULL),
(11, 9,  1, 'pending',  NULL,                        NULL),
(11, 8,  2, 'pending',  NULL,                        NULL),
(12, 9,  1, 'approved', NOW() - INTERVAL '17 days',  NULL),
(13, 8,  1, 'rejected', NOW() - INTERVAL '8 days',   'Dubbelfakturerad'),

-- Tenant 3
(16, 12, 1, 'pending',  NULL,                        NULL),
(17, 13, 1, 'approved', NOW() - INTERVAL '4 days',   NULL),
(17, 12, 2, 'pending',  NULL,                        NULL),

-- Tenant 4
(19, 16, 1, 'pending',  NULL,                        NULL),
(20, 16, 1, 'approved', NOW() - INTERVAL '11 days',  NULL);


-- Audit log
INSERT INTO audit_entries
    (user_id, tenant_id, action, entity_type, entity_id, description, created_at)
VALUES
-- Tenant 1
(1, 1,  'CREATE_PAYMENT', 'payment', 1,  'Skapade betalning 15000 SEK till SE3550000000054910000003',  NOW() - INTERVAL '30 days'),
(1, 1,  'CREATE_PAYMENT', 'payment', 2,  'Skapade betalning 75000 SEK till SE0850000000054910000004',  NOW() - INTERVAL '2 days'),
(2, 1,  'CREATE_PAYMENT', 'payment', 3,  'Skapade betalning 32000 SEK till SE8730000000011122230001',  NOW() - INTERVAL '20 days'),
(1, 1,  'CREATE_PAYMENT', 'payment', 4,  'Skapade betalning 250000 SEK till SE6030000000011122230002', NOW() - INTERVAL '3 days'),
(3, 1,  'APPROVE_STEP',   'payment', 4,  'Steg 1 för betalning 4 godkändes',                           NOW() - INTERVAL '2 days'),
(2, 1,  'CREATE_PAYMENT', 'payment', 5,  'Skapade betalning 120000 SEK till SE3330000000011122230003', NOW() - INTERVAL '14 days'),
(4, 1,  'APPROVE_STEP',   'payment', 5,  'Steg 1 för betalning 5 godkändes',                           NOW() - INTERVAL '13 days'),
(1, 1,  'CREATE_PAYMENT', 'payment', 6,  'Skapade betalning 60000 SEK till SE0630000000011122230004',  NOW() - INTERVAL '10 days'),
(3, 1,  'REJECT_STEP',    'payment', 6,  'Steg 1 för betalning 6 avslogs',                             NOW() - INTERVAL '9 days'),
(2, 1,  'CREATE_PAYMENT', 'payment', 7,  'Skapade betalning 300000 SEK till SE7630000000011122230005', NOW() - INTERVAL '7 days'),
(4, 1,  'REJECT_STEP',    'payment', 7,  'Steg 1 för betalning 7 avslogs',                             NOW() - INTERVAL '6 days'),
(2, 1,  'CREATE_PAYMENT', 'payment', 8,  'Skapade betalning 55000 SEK till SE8730000000011122230001',  NOW() - INTERVAL '1 day'),

-- Tenant 2
(7, 2,  'CREATE_PAYMENT', 'payment', 9,  'Skapade betalning 12000 SEK till SE5412000000077788890001',  NOW() - INTERVAL '25 days'),
(7, 2,  'CREATE_PAYMENT', 'payment', 10, 'Skapade betalning 40000 SEK till SE2712000000077788890002',  NOW() - INTERVAL '2 days'),
(7, 2,  'CREATE_PAYMENT', 'payment', 11, 'Skapade betalning 150000 SEK till SE9712000000077788890003', NOW() - INTERVAL '4 days'),
(7, 2,  'CREATE_PAYMENT', 'payment', 12, 'Skapade betalning 80000 SEK till SE7012000000077788890004',  NOW() - INTERVAL '18 days'),
(9, 2,  'APPROVE_STEP',   'payment', 12, 'Steg 1 för betalning 12 godkändes',                          NOW() - INTERVAL '17 days'),
(7, 2,  'CREATE_PAYMENT', 'payment', 13, 'Skapade betalning 30000 SEK till SE4312000000077788890005',  NOW() - INTERVAL '9 days'),
(8, 2,  'REJECT_STEP',    'payment', 13, 'Steg 1 för betalning 13 avslogs',                            NOW() - INTERVAL '8 days'),

-- Tenant 3
(11, 3, 'CREATE_PAYMENT', 'payment', 14, 'Skapade betalning 45000 SEK till SE8730000000011122230001',  NOW() - INTERVAL '28 days'),
(11, 3, 'CREATE_PAYMENT', 'payment', 15, 'Skapade betalning 95000 SEK till SE6030000000011122230002',  NOW() - INTERVAL '15 days'),
(11, 3, 'CREATE_PAYMENT', 'payment', 16, 'Skapade betalning 180000 SEK till SE3330000000011122230003', NOW() - INTERVAL '1 day'),
(11, 3, 'CREATE_PAYMENT', 'payment', 17, 'Skapade betalning 750000 SEK till SE0630000000011122230004', NOW() - INTERVAL '5 days'),
(13, 3, 'APPROVE_STEP',   'payment', 17, 'Steg 1 för betalning 17 godkändes',                          NOW() - INTERVAL '4 days'),

-- Tenant 4
(15, 4, 'CREATE_PAYMENT', 'payment', 18, 'Skapade betalning 8500 SEK till SE5412000000077788890001',   NOW() - INTERVAL '22 days'),
(15, 4, 'CREATE_PAYMENT', 'payment', 19, 'Skapade betalning 35000 SEK till SE2712000000077788890002',  NOW() - INTERVAL '2 days'),
(15, 4, 'CREATE_PAYMENT', 'payment', 20, 'Skapade betalning 22000 SEK till SE9712000000077788890003',  NOW() - INTERVAL '12 days'),
(16, 4, 'APPROVE_STEP',   'payment', 20, 'Steg 1 för betalning 20 godkändes',                          NOW() - INTERVAL '11 days');


-- Approval limits
INSERT INTO "approvalLimit"
    (tenant_id, "minAmount", "requiredApprovals", description, created_at, "lastModified_at", "lastModified_by")
VALUES
(1,  50000.00, 1, 'Kräver 1 attestant',                  NOW(), NOW(), 'seed'),
(1, 200000.00, 2, 'Kräver 2 attestanter (dubbelattest)', NOW(), NOW(), 'seed'),
(2,  25000.00, 1, 'Kräver 1 attestant',                  NOW(), NOW(), 'seed'),
(2, 100000.00, 2, 'Kräver 2 attestanter (dubbelattest)', NOW(), NOW(), 'seed'),
(3, 100000.00, 1, 'Kräver 1 attestant',                  NOW(), NOW(), 'seed'),
(3, 500000.00, 2, 'Kräver 2 attestanter (dubbelattest)', NOW(), NOW(), 'seed'),
(4,  20000.00, 1, 'Kräver 1 attestant',                  NOW(), NOW(), 'seed');
