import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/jest-globals";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Attestkorg } from "./Attestkorg";
import { useApprovals } from "../../hooks/useApprovals";
import { useApprovalHistory } from "../../hooks/useApprovalHistory";
import { useSessionDecisions } from "../../hooks/useSessionDecisions";
import { useAuth } from "../../hooks/useAuth";
import { usePaymentSourceAccount } from "../../hooks/usePaymentSourceAccount";
import type { PendingApprovalStep } from "../../schemas/pendingApprovalSchema";
import type { DecidedApproval } from "../../schemas/approvalHistorySchema";

jest.mock("../../hooks/useApprovals", () => ({
    APPROVALS_QUERY_KEY: ["approvals"],
    useApprovals: jest.fn(),
}));
jest.mock("../../hooks/useApprovalHistory", () => ({
    ...jest.requireActual<typeof import("../../hooks/useApprovalHistory")>("../../hooks/useApprovalHistory"),
    useApprovalHistory: jest.fn(),
}));
jest.mock("../../hooks/useSessionDecisions", () => ({
    addSessionDecision: jest.fn(),
    useSessionDecisions: jest.fn(),
}));
jest.mock("../../hooks/useAuth", () => ({ useAuth: jest.fn() }));
jest.mock("../../hooks/usePaymentSourceAccount", () => ({ usePaymentSourceAccount: jest.fn() }));
jest.mock("../../services/approvalService", () => ({ decideApproval: jest.fn() }));

const mockedUseApprovals = jest.mocked(useApprovals);
const mockedUseApprovalHistory = jest.mocked(useApprovalHistory);
const mockedUseSessionDecisions = jest.mocked(useSessionDecisions);
const mockedUseAuth = jest.mocked(useAuth);
const mockedUsePaymentSourceAccount = jest.mocked(usePaymentSourceAccount);

const pendingPayment: PendingApprovalStep = {
    stepId: "8f14e45f-ceea-4a7b-9c3e-2a1b5c6d7e8f",
    stepNumber: 1,
    paymentId: "3f2a9c1e-7b4d-4e8a-9c21-5d6f0a1b2c3d",
    amount: 75000,
    currency: "SEK",
    toIban: "SE0850000000054910000004",
    reference: "Faktura #1043",
    createdByUserId: "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
    createdByUserName: "Lisa Persson",
    paymentCreatedAt: new Date().toISOString(),
};

const handledPayment: DecidedApproval = {
    stepId: "3",
    stepNumber: 1,
    paymentId: "4",
    reference: "Betongleverans Q3",
    amount: 250000,
    currency: "SEK",
    toIban: "SE6030000000011122230002",
    createdByUserName: "Lisa Persson",
    paymentCreatedAt: "2026-10-04T17:08:08Z",
};

function setHooks({ pending = [pendingPayment], handled = [handledPayment] } = {}) {
    mockedUseApprovals.mockReturnValue({
        data: pending, isPending: false, isError: false, error: null,
    } as unknown as ReturnType<typeof useApprovals>);
    mockedUseApprovalHistory.mockReturnValue({
        data: handled, isPending: false, isError: false, error: null,
    } as unknown as ReturnType<typeof useApprovalHistory>);
    mockedUseSessionDecisions.mockReturnValue([]);
    mockedUseAuth.mockReturnValue({
        user: { id: "johan", name: "Johan Berg", role: "Attestant" },
    } as unknown as ReturnType<typeof useAuth>);
    mockedUsePaymentSourceAccount.mockReturnValue({
        account: undefined, fromAccountId: undefined, isPending: false, isError: true,
    } as unknown as ReturnType<typeof usePaymentSourceAccount>);
}

function renderInbox() {
    return render(
        <QueryClientProvider client={new QueryClient()}>
            <Attestkorg />
        </QueryClientProvider>
    );
}

beforeEach(() => setHooks());
afterEach(() => cleanup());

describe("Approval inbox with keyboard and screen reader", () => {
    it("names the approve and reject buttons by reference and amount instead of an id", () => {
        renderInbox();

        expect(screen.getByRole("button", { name: /^Godkänn betalning Faktura #1043, 75\s000,00 SEK$/ }))
            .toBeInTheDocument();
        expect(screen.getByRole("button", { name: /^Avvisa betalning Faktura #1043, 75\s000,00 SEK$/ }))
            .toBeInTheDocument();
        expect(screen.queryByRole("button", { name: new RegExp(pendingPayment.paymentId) }))
            .not.toBeInTheDocument();
    });

    it("warns when the recipient is the same account the money is taken from", () => {
        mockedUsePaymentSourceAccount.mockReturnValue({
            account: { id: "12", name: "Lönekonto", iban: "SE08 5000 0000 0549 1000 0004", balance: 0, currency: "SEK" },
            fromAccountId: "12",
            isPending: false,
            isError: false,
        } as unknown as ReturnType<typeof usePaymentSourceAccount>);

        renderInbox();

        expect(screen.getByText(/Mottagaren är samma konto som pengarna dras från/)).toBeInTheDocument();
    });

    it("moves between the tabs with the arrow keys", () => {
        renderInbox();

        const pendingTab = screen.getByRole("tab", { name: "Att hantera (1)" });
        fireEvent.keyDown(pendingTab, { key: "ArrowRight" });

        const handledTab = screen.getByRole("tab", { name: /Hanterade/ });
        expect(handledTab).toHaveAttribute("aria-selected", "true");
        expect(handledTab).toHaveFocus();
        expect(screen.getByText("Betongleverans Q3")).toBeInTheDocument();
        // The date is a real <time> element, so assistive technology knows it is a date.
        const created = document.querySelector(`time[datetime="${handledPayment.paymentCreatedAt}"]`);
        expect(created?.parentElement).toHaveTextContent(/^Betalning skapad .+ · Steg 1$/);

        fireEvent.keyDown(handledTab, { key: "ArrowLeft" });
        expect(screen.getByRole("tab", { name: "Att hantera (1)" })).toHaveFocus();
    });

    it("closes the confirmation dialog on Escape and returns focus to the button that opened it", () => {
        renderInbox();

        const approveButton = screen.getByRole("button", { name: /^Godkänn betalning/ });
        approveButton.focus();
        fireEvent.click(approveButton);

        const dialog = screen.getByRole("dialog", { name: "Godkänn betalning?" });
        expect(dialog).toBeInTheDocument();

        fireEvent.keyDown(dialog, { key: "Escape" });

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(approveButton).toHaveFocus();
    });

    it("keeps focus in the Handled tab when the filters are cleared", () => {
        // Search and filters only appear with more than five handled payments.
        const handled = Array.from({ length: 6 }, (_, index) => ({
            ...handledPayment,
            stepId: String(index + 1),
            reference: `Faktura #${index + 1}`,
        }));
        setHooks({ handled });
        renderInbox();

        fireEvent.click(screen.getByRole("tab", { name: /Hanterade/ }));
        fireEvent.change(screen.getByLabelText("Sök"), { target: { value: "#1" } });
        expect(screen.getByText("Visar 1 av 6")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Rensa filter" }));

        expect(screen.queryByRole("button", { name: "Rensa filter" })).not.toBeInTheDocument();
        expect(screen.getByLabelText("Sök")).toHaveFocus();
    });

    it("moves focus to the Handled tab from the empty inbox link", async () => {
        setHooks({ pending: [] });
        renderInbox();

        fireEvent.click(screen.getByRole("button", { name: "Visa hanterade betalningar" }));

        await waitFor(() => expect(screen.getByRole("tab", { name: /Hanterade/ })).toHaveFocus());
    });
});
