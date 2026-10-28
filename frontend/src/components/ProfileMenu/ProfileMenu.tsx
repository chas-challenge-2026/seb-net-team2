import { Link } from "@tanstack/react-router";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { AuthUser } from "../../schemas/userSchema";
import styles from "./ProfileMenu.module.css";

type ProfileMenuProps = {
    user?: Pick<AuthUser, "name" | "role">;
    compact?: boolean;
    above?: boolean;
    onNavigate?: () => void;
    onLogout?: () => void;
};

export function ProfileMenu({ user, compact = false, above = false, onNavigate, onLogout }: ProfileMenuProps) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuId = useId();

    useEffect(() => {
        if (!open) return;

        function handleOutside(event: PointerEvent) {
            if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
        }

        function handleEscape(event: KeyboardEvent) {
            if (event.key !== "Escape") return;
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
            buttonRef.current?.focus();
        }

        document.addEventListener("pointerdown", handleOutside);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("pointerdown", handleOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [open]);

    function close() {
        setOpen(false);
        onNavigate?.();
    }

    return (
        <div
            ref={containerRef}
            className={`${styles.container} ${above ? styles.above : ""} ${compact ? styles.compact : ""}`}
            onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
            }}
        >
            <button
                ref={buttonRef}
                type="button"
                className={styles.trigger}
                aria-label={t("profilePage.title")}
                aria-expanded={open}
                aria-controls={menuId}
                onClick={() => setOpen((current) => !current)}
            >
                <UserRound size={20} aria-hidden="true" />
                <span className={styles.userText}>
                    <strong>{user?.name || t("profilePage.title")}</strong>
                    {user && <span>{t(`users.roles.${user.role}`)}</span>}
                </span>
                <ChevronDown data-disclosure-chevron size={16} aria-hidden="true" />
            </button>

            {open && (
                <nav id={menuId} className={styles.dropdown} aria-label={t("profilePage.title")}>
                    <Link to="/profil" className={styles.item} onClick={close}>
                        <UserRound size={18} aria-hidden="true" />
                        {t("profilePage.title")}
                    </Link>
                    {onLogout ? (
                        <button type="button" className={styles.item} onClick={() => { close(); onLogout(); }}>
                            <LogOut size={18} aria-hidden="true" />
                            {t("sidebar.logout")}
                        </button>
                    ) : (
                        <Link to="/logout" className={styles.item} onClick={close}>
                            <LogOut size={18} aria-hidden="true" />
                            {t("sidebar.logout")}
                        </Link>
                    )}
                </nav>
            )}
        </div>
    );
}
