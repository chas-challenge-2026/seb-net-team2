import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown } from "lucide-react";
import styles from "../Dropdown/Dropdown.module.css";

const languages = [
    { code: "en", label: "English", flagClass: "fi fi-gb" },
    { code: "sv", label: "Svenska", flagClass: "fi fi-se" },
] as const;

export default function LanguageSelector() {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const { t, i18n } = useTranslation();
    const currentLanguage = languages.find(language => i18n.resolvedLanguage?.startsWith(language.code)) ?? languages[0];

    return (
        <div className={styles.wrapper}
            onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false);
            }}
            onKeyDown={(event) => {
                if (event.key === "Escape") {
                    setIsOpen(false);
                    event.currentTarget.querySelector("button")?.focus();
                }
            }}>
            <button ref={triggerRef} type="button" className={styles.trigger}
                aria-label={`${t("a11y.language")}: ${currentLanguage.label}`}
                aria-expanded={isOpen}
                onClick={() => setIsOpen(previous => !previous)}>
                <span className={currentLanguage.flagClass} aria-hidden="true" />
                <span>{currentLanguage.label}</span>
                <ChevronDown className={styles.chevron} size={16} aria-hidden="true" />
            </button>
            {isOpen && (
                <div className={styles.menu}>
                    {languages.map(language => (
                        <button key={language.code} type="button" className={styles.option}
                            aria-pressed={currentLanguage.code === language.code}
                            onClick={() => {
                                void i18n.changeLanguage(language.code);
                                localStorage.setItem("language", language.code);
                                setIsOpen(false);
                                triggerRef.current?.focus();
                            }}>
                            <span className={language.flagClass} aria-hidden="true" />
                            <span>{language.label}</span>
                            {currentLanguage.code === language.code && <Check className={styles.check} size={16} aria-hidden="true" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
