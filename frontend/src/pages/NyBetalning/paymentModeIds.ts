export type PaymentMode = "single" | "batch";

export const MODE_IDS = {
    single: { tab: "payment-mode-tab-single", panel: "payment-mode-panel-single" },
    batch: { tab: "payment-mode-tab-batch", panel: "payment-mode-panel-batch" },
} as const;
