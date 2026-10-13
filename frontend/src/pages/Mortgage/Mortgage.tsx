import { useTranslation } from "react-i18next";

export function Mortgage() {
    const { t } = useTranslation();
    return <h1>{t("a11y.mortgage")}</h1>
}
