import { useState, type ReactNode } from "react";
import { PRIMARY_CURRENCY } from "../constants/currency";
import { CurrencyContext } from "./CurrencyContext";

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const [primaryCurrency, setPrimaryCurrency] = useState<string>(PRIMARY_CURRENCY);

    return (
        <CurrencyContext.Provider value={{ primaryCurrency, setPrimaryCurrency }}>
            {children}
        </CurrencyContext.Provider>
    );
}
