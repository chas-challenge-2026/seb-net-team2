import Button from "../Button/Button";

import styles from "./CustomerTypeSelector.module.css";

export type CustomerType = "private" | "company";

type CustomerTypeSelectorProps = {
    value: CustomerType;
    onChange: (customerType: CustomerType) => void;
};

export default function CustomerTypeSelector({
    value,
    onChange,
}: CustomerTypeSelectorProps) {
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
                Private
            </Button>

            <Button
                type="button"
                variant="ghost"
                size="small"
                className={styles.option}
                onClick={() => onChange("company")}
                aria-pressed={value === "company"}
            >
                Company
            </Button>
        </div>
    );
}