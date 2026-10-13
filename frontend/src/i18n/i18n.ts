import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from './locales/en.json';
import sv from './locales/sv.json';

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: {
                translation: en
            },
            sv: {
                translation: sv
            },
        },
        lng: "en",
        fallbackLng: "en",
        interpolation: {
            escapeValue: false,
        },
    });

function updateDocumentLanguage(language: string) {
    document.documentElement.lang = language.startsWith("sv") ? "sv" : "en";
}
i18n.on("languageChanged", updateDocumentLanguage);
updateDocumentLanguage(i18n.resolvedLanguage ?? "en");

export default i18n;
