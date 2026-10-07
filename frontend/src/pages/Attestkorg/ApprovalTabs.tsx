import { useRef, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";

import { TAB_IDS, type ApprovalTab } from "./approvalTabIds";
import styles from "./Attestkorg.module.css";

const TABS: ApprovalTab[] = ["pending", "handled"];

type ApprovalTabsProps = {
    activeTab: ApprovalTab;
    onChange: (tab: ApprovalTab) => void;
    pendingCount: number;
};

// "Att hantera (3)" / "Hanterade". Follows the ARIA tabs pattern:
// only the active tab is in the Tab order, and the arrow keys move between tabs.
export function ApprovalTabs({ activeTab, onChange, pendingCount }: ApprovalTabsProps) {
    const { t } = useTranslation();
    const tabRefs = useRef<Record<ApprovalTab, HTMLButtonElement | null>>({
        pending: null,
        handled: null,
    });

    function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;

        event.preventDefault();
        const direction = event.key === "ArrowRight" ? 1 : -1;
        const next = TABS[(TABS.indexOf(activeTab) + direction + TABS.length) % TABS.length];

        onChange(next);
        tabRefs.current[next]?.focus();
    }

    return (
        <div className={styles.tabs} role="tablist" aria-label={t("approvalInbox.tabs.label")}>
            {TABS.map((tab) => (
                <button
                    key={tab}
                    ref={(element) => { tabRefs.current[tab] = element; }}
                    type="button"
                    role="tab"
                    id={TAB_IDS[tab].tab}
                    aria-selected={activeTab === tab}
                    aria-controls={TAB_IDS[tab].panel}
                    tabIndex={activeTab === tab ? 0 : -1}
                    className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
                    onClick={() => onChange(tab)}
                    onKeyDown={handleKeyDown}
                >
                    {tab === "pending"
                        ? t("approvalInbox.tabs.pending", { count: pendingCount })
                        : t("approvalInbox.tabs.handled")}
                </button>
            ))}
        </div>
    );
}
