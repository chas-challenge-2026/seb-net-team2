export type ApprovalTab = "pending" | "handled";

// ids that connect each tab to its panel (aria-controls / aria-labelledby).
export const TAB_IDS = {
    pending: { tab: "approval-tab-pending", panel: "approval-panel-pending" },
    handled: { tab: "approval-tab-handled", panel: "approval-panel-handled" },
} as const;
