import type { HTMLAttributes, ReactNode } from "react";
import styles from "./Card.module.css";

type CardProps = HTMLAttributes<HTMLDivElement> & {
    title?: string;
    size?: "sm" | "md" | "lg" | "xl";
    variant?:
    | "default"
    | "primary"
    | "secondary"
    | "danger"
    | "ghost"
    | "image"
    | "defaultOnHover"
    | "square"
    | "vertical-lines"
    | "horizontal-lines"
    | "vertical-lines-sm"
    | "horizontal-lines-sm";
    children?: ReactNode;
};

export default function Card({
    title,
    size,
    variant = "default",
    className = "",
    children,
    ...rest
}: CardProps) {
    return (
        <div
            className={`
                ${styles.card}
                ${size ? styles[`card--${size}`] : ""}
                ${styles[`card--${variant}`]}
                ${className}
            `.trim()}
            {...rest}
        >
            {title && <h2 className={styles.card__title}>{title}</h2>}

            {children}
        </div>
    );
}