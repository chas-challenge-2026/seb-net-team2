import type { HTMLAttributes, ReactNode } from "react";
import styles from './Card.module.css';

type CardProps = HTMLAttributes<HTMLDivElement> & {
    title?: string;
    className?: string;
    children?: ReactNode;
    variant?: "default" | "primary" | "image";
};

export default function Card({
    title,
    className = "",
    children,
    variant = "default",
    ...rest
}: CardProps) {
    return (
        <div
            className={`${styles.card} ${styles[`card--${variant}`]} ${className}`.trim()}
            {...rest}
        >
            {title && (
                <h2 className={styles.card__title}>
                    {title}
                </h2>
            )}

            {children}
        </div>
    );
}