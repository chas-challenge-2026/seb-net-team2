import { useRef, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { CreditCard, FileUp } from "lucide-react";

import { MODE_IDS, type PaymentMode } from "./paymentModeIds";
import styles from "./NyBetalning.module.css";

const MODES: PaymentMode[] = ["single", "batch"];

type PaymentModeTabsProps = {
    activeMode: PaymentMode;
    onChange: (mode: PaymentMode) => void;
};

export function PaymentModeTabs({ activeMode, onChange }: PaymentModeTabsProps) {
    const { t } = useTranslation();
    const tabRefs = useRef<Record<PaymentMode, HTMLButtonElement | null>>({
        single: null,
        batch: null,
    });

    function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;

        event.preventDefault();
        const direction = event.key === "ArrowRight" ? 1 : -1;
        const next = MODES[(MODES.indexOf(activeMode) + direction + MODES.length) % MODES.length];

        onChange(next);
        tabRefs.current[next]?.focus();
    }

    return (
        <div className={styles.modeTabs} role="tablist" aria-label={t("payment.modes.label")}>
            {MODES.map((mode) => {
                const Icon = mode === "single" ? CreditCard : FileUp;

                return (
                    <button
                        key={mode}
                        ref={(element) => { tabRefs.current[mode] = element; }}
                        type="button"
                        role="tab"
                        id={MODE_IDS[mode].tab}
                        aria-selected={activeMode === mode}
                        aria-controls={MODE_IDS[mode].panel}
                        tabIndex={activeMode === mode ? 0 : -1}
                        className={`${styles.modeTab} ${activeMode === mode ? styles.modeTabActive : ""}`}
                        onClick={() => onChange(mode)}
                        onKeyDown={handleKeyDown}
                    >
                        <Icon size={17} aria-hidden="true" />
                        {t(`payment.modes.${mode}`)}
                    </button>
                );
            })}
        </div>
    );
}
