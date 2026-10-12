import { expect, jest, test } from '@jest/globals'
import { fetchAccounts, createPayment } from '../src/services/accountService'

test('US-70: hämtar konton från rätt adress och läser svaret', async () => {
  jest.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify([{
    id: 1, tenantId: 3, accountName: 'Företagskonto',
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
    tenantId: 3, fromAccountId: '9d21cccb-d39d-4cae-99aa-fda8a311cf66', toIban: 'SE4550000000058398257466',
    amount: 100, currency: 'SEK' as const, reference: 'Faktura 12',
  }
  jest.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({
    ...details, id: 'c6a91a61-a18a-41ca-a2f7-7937cd187425', status: 'pending_approval', createdAt: '2026-10-07',
  })))

  const result = await createPayment(details, 'test-key')

  const [url, options] = jest.mocked(fetch).mock.calls[0]
  expect(url).toBe('https://bank.test/api/Payment')
  expect(options?.method).toBe('POST')
  expect((options?.headers as Headers).get('Content-Type')).toBe('application/json')
  expect(JSON.parse(options?.body as string)).toEqual(details)
  expect(result.id).toBe('c6a91a61-a18a-41ca-a2f7-7937cd187425')
})
