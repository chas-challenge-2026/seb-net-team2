import { expect, test } from '@jest/globals'
import { accountResponseSchema } from '../src/schemas/accountSchema'
import { createdPaymentSchema } from '../src/schemas/paymentSchema'
import { readUserSchema } from '../src/schemas/userSchema'
import { pendingApprovalStepSchema } from '../src/schemas/pendingApprovalSchema'
import { approvalDecisionSchema } from '../src/schemas/approvalDecisionSchema'
import { approvalLimitSchema } from '../src/schemas/approvalLimitsSchema'
import { auditEntrySchema } from '../src/schemas/auditSchema'

const id = '00000000-0000-4000-8000-000000000001'

test('API identifiers remain UUID strings while numeric fields remain numbers', () => {
  const fixtures = [
    [accountResponseSchema, { id, tenantId: 1, accountName: 'Account', iban: 'SE3550000000054910000003', balance: 100, currency: 'SEK' }],
    [createdPaymentSchema, { id, fromAccountId: id, toIban: 'SE3550000000054910000003', amount: 100, currency: 'SEK', reference: '', status: 'pending_approval', createdAt: '2026-10-12T10:00:00Z' }],
    [readUserSchema, { id, tenantId: 1, name: 'User', email: 'user@example.com', role: 'Initiator' }],
    [pendingApprovalStepSchema, { stepId: id, stepNumber: 1, paymentId: id, amount: 100, currency: 'SEK', toIban: 'SE3550000000054910000003', reference: '', createdByUserId: id, createdByUserName: 'User', paymentCreatedAt: '2026-10-12T10:00:00Z' }],
    [approvalDecisionSchema, { stepId: id, decision: 'approved' }],
    [approvalLimitSchema, { id, tenantId: 1, minAmount: 100, requiredApprovals: 1, description: '', lastModifiedAt: '2026-10-12T10:00:00Z', lastModifiedBy: 'Admin' }],
  ] as const

  for (const [schema, fixture] of fixtures) {
    expect(schema.parse(fixture)).toEqual(fixture)
  }
  expect(accountResponseSchema.safeParse({ ...fixtures[0][1], id: 1 }).success).toBe(false)
  expect(approvalDecisionSchema.safeParse({ stepId: 'invalid', decision: 'approved' }).success).toBe(false)
})

test('audit API still uses numeric identifiers', () => {
  const entry = { id: 1, userId: 2, entityId: 3, timeStamp: '2026-10-12T10:00:00Z', userName: 'User', action: 'CREATE_PAYMENT', entityType: 'payment', description: '', details: null }
  expect(auditEntrySchema.parse(entry)).toEqual(entry)
})
