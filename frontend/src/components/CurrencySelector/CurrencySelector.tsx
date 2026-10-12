import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Coins, Check, ChevronDown } from "lucide-react";
import { DISPLAY_CURRENCIES } from "../../constants/currency";
import { useCurrency } from "../../hooks/useCurrency";
import styles from "./CurrencySelector.module.css";
import dropdown from "../Dropdown/Dropdown.module.css";

const currencyLabel = (currency: string) => currency === "EUR" ? "\u20AC EUR" : currency === "USD" ? "$ USD" : currency;

export function CurrencySelector() {
    const { t } = useTranslation();
    const { primaryCurrency, setPrimaryCurrency } = useCurrency();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={dropdown.wrapper}
            onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false);
            }}
            onKeyDown={(event) => {
                if (event.key === "Escape") {
                    setIsOpen(false);
                    event.currentTarget.querySelector("button")?.focus();
                }
            }}>
            <button type="button" className={`${dropdown.trigger} ${styles.trigger}`}
                aria-label={t("dashboard.currency.select")}
                aria-expanded={isOpen}
                onClick={() => setIsOpen(previous => !previous)}>
                <Coins size={18} className={styles.coin} aria-hidden="true" />
                <span>{currencyLabel(primaryCurrency)}</span>
                <ChevronDown size={16} className={`${dropdown.chevron} ${styles.chevron}`} aria-hidden="true" />
            </button>
            {isOpen && (
                <div className={dropdown.menu}>
                    {DISPLAY_CURRENCIES.map(currency => (
                        <button key={currency} type="button" className={dropdown.option}
                            aria-pressed={currency === primaryCurrency}
                            onClick={() => {
                                setPrimaryCurrency(currency);
                                setIsOpen(false);
                            }}>
                            <span>{currencyLabel(currency)}</span>
                            {currency === primaryCurrency && <Check size={16} className={dropdown.check} aria-hidden="true" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
