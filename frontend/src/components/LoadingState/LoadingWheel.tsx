import styles from "./LoadingWheel.module.css";

type LoadingWheelProps = {
    className?: string;
    size?: "small" | "medium" | "large";
};

export default function LoadingWheel({
    size = "medium",
    className,
}: LoadingWheelProps) {
    return (
        <div
            className={`
                ${styles.loadingCircle}
                ${styles[size]}
                ${className ?? ""}
            `}
        />
    );
}