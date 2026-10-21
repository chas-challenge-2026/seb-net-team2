import { PRIMARY_CURRENCY } from "../constants/currency";
import type { ExchangeRate } from "../schemas/exchangeRateSchema";
import type { Account } from "../services/accountService";

export function calculateAccountBalances(accounts: Account[], rates: ExchangeRate[], primaryCurrency: string = PRIMARY_CURRENCY) {
    const convertedAccounts = accounts.map((account) => {
        const currency = account.currency.trim().toUpperCase();
        const exchangeRate = rates.find((rate) =>
            rate.base === currency && rate.quote === primaryCurrency
        );

        const rate = currency === primaryCurrency ? 1 : exchangeRate?.rate;

        return {
            ...account,
            primaryBalance: rate === undefined ? null : account.balance * rate,
            rateDate: currency === primaryCurrency ? null : exchangeRate?.date ?? null,
        };
    });

    const missingCurrencies = [...new Set(
        convertedAccounts
            .filter((account) => account.primaryBalance === null)
            .map((account) => account.currency.trim().toUpperCase())
    )];

    const convertedSubtotal = convertedAccounts.reduce(
        (sum, account) => sum + (account.primaryBalance ?? 0),
        0
    );

    return {
        accounts: convertedAccounts,
        primaryCurrency,
        convertedSubtotal,
        totalBalance: missingCurrencies.length === 0 ? convertedSubtotal : null,
        missingCurrencies,
    };
}
