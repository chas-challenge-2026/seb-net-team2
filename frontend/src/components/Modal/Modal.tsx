import { useEffect } from "react";
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
                className={styles.modal}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                onMouseDown={(event) =>
                    event.stopPropagation()
                }
            >
                <div className={styles.header}>
                    {title && (
                        <h2
                            id="modal-title"
                            className={styles.title}
                        >
                            {title}
                        </h2>
                    )}

                    <button
                        type="button"
                        className={styles.closeButton}
                        onClick={onClose}
                        aria-label="Close modal"
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