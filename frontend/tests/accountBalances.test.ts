import { expect, test } from "@jest/globals";
import { calculateAccountBalances } from "../src/utils/accountBalances";
import type { Account } from "../src/services/accountService";

const account = (currency: string, balance: number): Account => ({
    id: currency,
    name: `${currency} account`,
    iban: "SE3550000000054910000003",
    currency,
    balance,
});

test("converts foreign balances, keeps SEK unchanged and preserves original accounts", () => {
    const accounts = [account("SEK", 50000), account("EUR", 1000), account("EUR", -100)];
    const original = accounts.map((item) => ({ ...item }));
    const result = calculateAccountBalances(accounts, [
        { base: "EUR", quote: "SEK", rate: 11, date: "2026-10-12" },
    ]);

    expect(result.accounts.map((item) => item.primaryBalance)).toEqual([50000, 11000, -1100]);
    expect(result.totalBalance).toBe(59900);
    expect(result.accounts[1].rateDate).toBe("2026-10-12");
    expect(result.missingCurrencies).toEqual([]);
    expect(accounts).toEqual(original);
});

test("does not report a complete total when a currency has no rate to SEK", () => {
    const result = calculateAccountBalances([account("SEK", 100), account("USD", 10)], [
        { base: "USD", quote: "EUR", rate: 0.9, date: "2026-10-12" },
    ]);

    expect(result.accounts[1].primaryBalance).toBeNull();
    expect(result.totalBalance).toBeNull();
    expect(result.convertedSubtotal).toBe(100);
    expect(result.missingCurrencies).toEqual(["USD"]);
});

test("an empty account list has a zero total", () => {
    expect(calculateAccountBalances([], []).totalBalance).toBe(0);
});

test("uses the selected currency and ignores rates for the previous selection", () => {
    const accounts = [account("SEK", 1000), account("EUR", 50)];
    const rates = [
        { base: "SEK", quote: "EUR", rate: 0.1, date: "2026-10-12" },
        { base: "EUR", quote: "SEK", rate: 10, date: "2026-10-12" },
    ];
    const result = calculateAccountBalances(accounts, rates, "EUR");
    expect(result.primaryCurrency).toBe("EUR");
    expect(result.accounts.map((item) => item.primaryBalance)).toEqual([100, 50]);
    expect(result.totalBalance).toBe(150);
    expect(calculateAccountBalances(accounts, rates, "USD").totalBalance).toBeNull();
});
