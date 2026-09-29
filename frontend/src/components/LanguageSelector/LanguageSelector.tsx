import { useState } from "react";
import { useTranslation } from "react-i18next";

import styles from "./LanguageSelector.module.css";

type Language = "en" | "sv";

const languages = [
    { code: "en", label: "English", flagClass: "fi fi-gb" },
    { code: "sv", label: "Svenska", flagClass: "fi fi-se" },
] as const;

export default function LanguageSelector() {
    const [isOpen, setIsOpen] = useState(false);
    const { i18n } = useTranslation();

    const currentLanguage =
        languages.find(
            (language) => language.code === i18n.resolvedLanguage
        ) ?? languages[0];

    function changeLanguage(language: Language) {
        i18n.changeLanguage(language);
        localStorage.setItem("language", language);
        setIsOpen(false);
    }

    return (
        <div className={styles.wrapper}>
            <button
                type="button"
                className={styles.trigger}
                onClick={() => setIsOpen((previous) => !previous)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span
                    className={`${currentLanguage.flagClass} ${styles.flag}`}
                    aria-hidden="true"
                />

                <span>{currentLanguage.label}</span>

                <svg
                    className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""
                        }`}
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                >
                    <path
                        d="M5 7.5L10 12.5L15 7.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>

            {isOpen && (
                <div className={styles.menu} role="listbox">
                    {languages.map((language) => {
                        const isSelected =
                            currentLanguage.code === language.code;

                        return (
                            <button
                                key={language.code}
                                type="button"
                                className={styles.option}
                                onClick={() =>
                                    changeLanguage(language.code)
                                }
                                role="option"
                                aria-selected={isSelected}
                            >
                                <span
                                    className={`${language.flagClass} ${styles.flag}`}
                                    aria-hidden="true"
                                />

                                <span>{language.label}</span>

                                {isSelected && (
                                    <span className={styles.check}>
                                        ✓
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}