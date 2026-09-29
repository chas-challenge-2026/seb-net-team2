import Button from "../Button/Button";

import styles from "./CustomerTypeSelector.module.css";
import { useTranslation } from "react-i18next";

export type CustomerType = "private" | "company";

type CustomerTypeSelectorProps = {
    value: CustomerType;
    onChange: (customerType: CustomerType) => void;
};

export default function CustomerTypeSelector({
    value,
    onChange,
}: CustomerTypeSelectorProps) {

    const { t } = useTranslation();

    return (
        <div
            className={`${styles.selector} ${value === "company"
                ? styles.companySelected
                : ""
                }`}
            role="group"
            aria-label="Customer type"
        >
            <Button
                type="button"
                variant="ghost"
                size="small"
                className={styles.option}
                onClick={() => onChange("private")}
                aria-pressed={value === "private"}
            >
                {t("login.private")}
            </Button>

            <Button
                type="button"
                variant="ghost"
                size="small"
                className={styles.option}
                onClick={() => onChange("company")}
                aria-pressed={value === "company"}
            >
                {t("login.company")}
            </Button>
        </div>
    );
}