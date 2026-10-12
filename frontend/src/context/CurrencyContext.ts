import { createContext } from "react";

export const CurrencyContext = createContext<{
    primaryCurrency: string;
    setPrimaryCurrency: (currency: string) => void;
} | null>(null);
