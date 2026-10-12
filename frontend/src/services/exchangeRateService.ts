import { PRIMARY_CURRENCY } from "../constants/currency";
import { AppError } from "../errors/AppError";
import { exchangeRateSchema, type ExchangeRate } from "../schemas/exchangeRateSchema";

export async function fetchExchangeRate(currency: string, primaryCurrency: string = PRIMARY_CURRENCY): Promise<ExchangeRate> {
    const base = currency.trim().toUpperCase();
    const url = `https://api.frankfurter.dev/v2/rate/${encodeURIComponent(base)}/${encodeURIComponent(primaryCurrency)}`;

    let response: Response;

    try {
        response = await fetch(url);
    } catch {
        throw new AppError("Unable to connect to the exchange rate service.");
    }

    if (!response.ok) {
        throw new AppError("Unable to fetch the exchange rate.", response.status);
    }

    const data: unknown = await response.json();
    const exchangeRate = exchangeRateSchema.parse(data);

    if (exchangeRate.base !== base || exchangeRate.quote !== primaryCurrency) {
        throw new AppError("The exchange rate does not match the requested currencies.");
    }

    return exchangeRate;
}
