import type {
    HTMLAttributes,
} from "react";

import styles from "./Skeleton.module.css";

type SkeletonProps =
    HTMLAttributes<HTMLDivElement> & {
        width?: string;
        height?: string;
        radius?: string;
    };

export default function Skeleton({
    width = "100%",
    height = "16px",
    radius,
    className = "",
    style,
    ...rest
}: SkeletonProps) {
    return (
        <div
            {...rest}
            aria-hidden="true"
            className={`
                ${styles.skeleton}
                ${className}
            `}
            style={{
                width,
                height,
                borderRadius: radius,
                ...style,
            }}
        />
    );
}