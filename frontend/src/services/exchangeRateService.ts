import i18n from "../i18n/i18n";
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
        throw new AppError(i18n.t("errors.exchangeConnection"));
    }

    if (!response.ok) {
        throw new AppError(i18n.t("errors.exchangeFetch"), response.status);
    }

    const data: unknown = await response.json();
    const exchangeRate = exchangeRateSchema.parse(data);

    if (exchangeRate.base !== base || exchangeRate.quote !== primaryCurrency) {
        throw new AppError(i18n.t("errors.exchangeMismatch"));
    }

    return exchangeRate;
}
