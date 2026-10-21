import { useQueries } from "@tanstack/react-query";

import { PRIMARY_CURRENCY } from "../constants/currency";
import { fetchExchangeRate } from "../services/exchangeRateService";

export function useExchangeRates(currencies: string[], primaryCurrency: string = PRIMARY_CURRENCY) {
    const foreignCurrencies = [...new Set(
        currencies.map((currency) => currency.trim().toUpperCase())
    )].filter((currency) => currency !== primaryCurrency && currency !== "");

    return useQueries({
        queries: foreignCurrencies.map((currency) => ({
            queryKey: ["exchangeRate", currency, primaryCurrency],
            queryFn: () => fetchExchangeRate(currency, primaryCurrency),
            staleTime: 60 * 60 * 1000,
            retry: 1,
        })),
    });
}
