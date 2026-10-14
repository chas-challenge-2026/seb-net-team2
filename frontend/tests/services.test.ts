import { expect, jest, test } from '@jest/globals'
import { fetchAccounts, createPayment } from '../src/services/accountService'
import { fetchNotifications } from '../src/services/notificationService'

test('US-70: hämtar konton från rätt adress och läser svaret', async () => {
  jest.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify([{
    id: '00000000-0000-4000-8000-000000000001', tenantId: 3, accountName: 'Företagskonto',
    balance: 1000, currency: 'SEK', iban: 'SE4550000000058398257466',
  }])))

  const accounts = await fetchAccounts()

  const [url, options] = jest.mocked(fetch).mock.calls[0]
  expect(url).toBe('https://bank.test/api/Accounts')
  expect(options?.method ?? 'GET').toBe('GET') // GET is fetch's default.
  expect(accounts[0].name).toBe('Företagskonto')
  expect(accounts[0].balance).toBe(1000)
})

test('US-70: skickar betalningsdata som JSON till rätt adress', async () => {
  const details = {
    tenantId: 3, fromAccountId: '00000000-0000-4000-8000-000000000001', toIban: 'SE4550000000058398257466',
    amount: 100, currency: 'SEK' as const, reference: 'Faktura 12',
  }
  jest.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({
    ...details, id: '00000000-0000-4000-8000-000000000042', status: 'pending_approval', createdAt: '2026-10-07',
  })))

  const result = await createPayment(details, 'test-key')

  const [url, options] = jest.mocked(fetch).mock.calls[0]
  expect(url).toBe('https://bank.test/api/Payment')
  expect(options?.method).toBe('POST')
  expect((options?.headers as Headers).get('Content-Type')).toBe('application/json')
  expect(JSON.parse(options?.body as string)).toEqual(details)
  expect(result.id).toBe('00000000-0000-4000-8000-000000000042')
})

test('initiators only receive payment decision notifications', async () => {
  jest.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify([
    { id: 1, paymentId: 10, message: 'Du har en betalning att attestera.', isRead: false, createdAt: '2026-10-14T10:00:00Z' },
    { id: 2, paymentId: 11, message: "Din betalning med referens 'Faktura 12' har godkänts.", isRead: false, createdAt: '2026-10-14T10:05:00Z' },
    { id: 3, paymentId: 12, message: "Din betalning med referens 'Faktura 13' har avslagits.", isRead: false, createdAt: '2026-10-14T10:10:00Z' },
  ])))

  const notifications = await fetchNotifications('Initiator')

  expect(notifications).toHaveLength(2)
  expect(notifications.map((notification) => notification.type)).toEqual(['payment', 'payment'])
  expect(notifications.map((notification) => notification.href)).toEqual(['/dashboard', '/dashboard'])
})

test('attestants still receive approval reminders', async () => {
  jest.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify([
    { id: 1, paymentId: 10, message: 'Du har en betalning att attestera.', isRead: false, createdAt: '2026-10-14T10:00:00Z' },
  ])))

  const notifications = await fetchNotifications('Attestant')

  expect(notifications).toHaveLength(1)
  expect(notifications[0].type).toBe('approval')
  expect(notifications[0].href).toBe('/attestkorg')
})
