-- Seed: tenant Malmö Bygg AB
INSERT INTO tenants (name) VALUES ('Malmö Bygg AB');

-- password = "password123" MD5 = 482c811da5d5b4bc6d497ffa98491e38
INSERT INTO users (tenant_id, name, email, password_md5, role) VALUES
(1, 'Lisa Persson',  'lisa@malmobygg.se',  '482c811da5d5b4bc6d497ffa98491e38', 'initiator'),
(1, 'Johan Berg',   'johan@malmobygg.se', '482c811da5d5b4bc6d497ffa98491e38', 'attestant'),
(1, 'Sara Ek',      'sara@malmobygg.se',  '482c811da5d5b4bc6d497ffa98491e38', 'admin');

INSERT INTO accounts (tenant_id, account_name, iban, balance, currency) VALUES
(1, 'Driftkonto',   'SE4550000000058398257466', 2500000.00, 'SEK'),
(1, 'Lönekonto',    'SE4550000000058398257467',  890000.00, 'SEK'),
(1, 'Projektkonto', 'SE4550000000058398257468',  450000.00, 'SEK');

-- Some pre-existing payments
INSERT INTO payments (tenant_id, from_account_id, to_iban, amount, reference, status, created_by, executed_at) VALUES
(1, 1, 'SE8550000000054910000003', 15000.00, 'Faktura #1042', 'completed',        1, NOW()),
(1, 1, 'SE8550000000054910000004', 75000.00, 'Faktura #1043', 'pending_approval', 1, NULL);

INSERT INTO approval_steps (payment_id, attestant_id, step_number, status) VALUES
(2, 2, 1, 'pending');

INSERT INTO audit_entries (user_id, action, entity_type, entity_id, description) VALUES
(1, 'CREATE_PAYMENT', 'payment', 1, 'Skapade betalning 15000 SEK till SE8550000000054910000003'),
(1, 'CREATE_PAYMENT', 'payment', 2, 'Skapade betalning 75000 SEK till SE8550000000054910000004');

INSERT INTO "ApprovalLimits" ("MinAmount", "RequiredApprovals", "Description") VALUES
(50000.00, 1, 'Kräver 1 attestant'),
(200000.00, 2, 'Kräver 2 attestanter (dubbelattest)');