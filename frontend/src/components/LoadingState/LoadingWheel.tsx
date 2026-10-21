import styles from "./LoadingWheel.module.css";
import { useTranslation } from "react-i18next";

type LoadingWheelProps = {
    announce?: boolean;
    className?: string;
    size?: "small" | "medium" | "large";
};

export default function LoadingWheel({
    announce = false,
    size = "medium",
    className,
}: LoadingWheelProps) {
    const { t } = useTranslation();
    return (
        <div
            role={announce ? "status" : undefined}
            aria-label={announce ? t("common.loading") : undefined}
            aria-hidden={announce ? undefined : true}
            className={`
                ${styles.loadingCircle}
                ${styles[size]}
                ${className ?? ""}
            `}
        />
    );
}
