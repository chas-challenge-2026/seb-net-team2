import { useEffect, useId, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useModalFocus } from "../../hooks/useModalFocus";
import type { ReactNode } from "react";

import styles from "./Modal.module.css";

type ModalProps = {
    isOpen: boolean;
    title?: string;
    children: ReactNode;
    footer?: ReactNode;
    onClose: () => void;
};

export default function Modal({
    isOpen,
    title,
    children,
    footer,
    onClose,
}: ModalProps) {
    const { t } = useTranslation();
    const titleId = useId();
    const modalRef = useRef<HTMLDivElement>(null);
    useModalFocus(isOpen, modalRef);
    useEffect(() => {
        if (!isOpen) return;

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                onClose();
            }
        }

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    return (
        <div
            className={styles.backdrop}
            onMouseDown={onClose}
        >
            <div
                ref={modalRef}
                tabIndex={-1}
                className={styles.modal}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                aria-label={title ? undefined : t("a11y.dialog")}
                onMouseDown={(event) =>
                    event.stopPropagation()
                }
            >
                <div className={styles.header}>
                    {title && (
                        <h2
                            id={titleId}
                            className={styles.title}
                        >
                            {title}
                        </h2>
                    )}

                    <button
                        type="button"
                        className={styles.closeButton}
                        onClick={onClose}
                        aria-label={t("common.close")}
                    >
                        ×
                    </button>
                </div>

                <div className={styles.content}>
                    {children}
                </div>

                {footer && (
                    <div className={styles.footer}>
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
