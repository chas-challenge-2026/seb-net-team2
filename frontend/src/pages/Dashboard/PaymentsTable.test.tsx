import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/jest-globals";
import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { PaymentsTable } from "./PaymentsTable";
import type { Account, Payment } from "../../services/accountService";

jest.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string, values?: Record<string, string>) => {
            const translations: Record<string, string> = {
                "dashboard.recentPayments": "Recent payments",
                "dashboard.filters.label": "Filter by status",
                "dashboard.filters.all": "All",
                "dashboard.status.completed": "Completed",
                "dashboard.status.pending": "Pending",
                "dashboard.status.rejected": "Rejected",
                "dashboard.statusDescription.completed": "The payment has been completed.",
                "dashboard.statusDescription.pending": "The payment is waiting for approval.",
                "dashboard.statusDescription.rejected": "The payment was rejected.",
                "dashboard.table.empty": "No payments to show.",
                "dashboard.table.toggleDetails": `Details for ${values?.date} of ${values?.amount}`,
                "dashboard.table.paymentId": "Payment ID",
            };

            return translations[key] ?? key;
        },
    }),
}));

const accounts: Account[] = [
    { id: "1", name: "Operating account", balance: 1000, currency: "SEK", iban: "SE4550000000058398257466" },
];

const payments: Payment[] = [
    { id: "p1", date: "2026-10-03", fromAccountId: "1", toIban: "SE3550000000054910000003", reference: "Invoice 1", amount: 100, currency: "SEK", status: "Completed" },
    { id: "p2", date: "2026-10-02", fromAccountId: "1", toIban: "SE3550000000054910000003", reference: "Invoice 2", amount: 200, currency: "SEK", status: "Pending approval" },
    { id: "p3", date: "2026-10-01", fromAccountId: "1", toIban: "SE3550000000054910000003", reference: "", amount: 300, currency: "SEK", status: "Rejected" },
    { id: "p4", date: "2026-09-30", fromAccountId: "1", toIban: "SE3550000000054910000003", reference: "Invoice 4", amount: 400, currency: "SEK", status: "Completed" },
];

function renderTable(data: Payment[] = payments) {
    return render(<PaymentsTable payments={data} accounts={accounts} locale="en-GB" />);
}

afterEach(() => cleanup());

describe("PaymentsTable", () => {
    it("shows a status label for each payment and a count on every filter", () => {
        renderTable();

        const filters = screen.getByRole("group", { name: "Filter by status" });
        expect(within(filters).getByRole("button", { name: /^All\s*4$/ })).toBeInTheDocument();
        expect(within(filters).getByRole("button", { name: /^Completed\s*2$/ })).toBeInTheDocument();
        expect(within(filters).getByRole("button", { name: /^Pending\s*1$/ })).toBeInTheDocument();
        expect(within(filters).getByRole("button", { name: /^Rejected\s*1$/ })).toBeInTheDocument();

        const rejectedRow = screen.getByText("2026-10-01").closest("tr");
        expect(rejectedRow).toHaveTextContent("Rejected");
    });

    it("filters the table by status and shows everything again with All", () => {
        renderTable();

        fireEvent.click(screen.getByRole("button", { name: /^Completed/ }));

        expect(screen.getByRole("button", { name: /^Completed/ })).toHaveAttribute("aria-pressed", "true");
        expect(screen.getByText("Invoice 1")).toBeInTheDocument();
        expect(screen.getByText("Invoice 4")).toBeInTheDocument();
        expect(screen.queryByText("Invoice 2")).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /^All/ }));

        expect(screen.getByText("Invoice 2")).toBeInTheDocument();
    });

    it("shows a message when no payment matches the filter", () => {
        renderTable(payments.filter((payment) => payment.status !== "Rejected"));

        fireEvent.click(screen.getByRole("button", { name: /^Rejected/ }));

        expect(screen.getByText("No payments to show.")).toBeInTheDocument();
        expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });

    it("opens the details of a payment when its row is clicked and closes them on a second click", () => {
        renderTable();

        const row = screen.getByText("Invoice 2").closest("tr") as HTMLElement;
        const toggle = within(row).getByRole("button", { name: "Details for 2026-10-02 of 200.00 SEK" });
        expect(toggle).toHaveAttribute("aria-expanded", "false");

        fireEvent.click(row);

        expect(toggle).toHaveAttribute("aria-expanded", "true");
        expect(screen.getByText("The payment is waiting for approval.")).toBeInTheDocument();
        expect(screen.getByText("Payment ID")).toBeInTheDocument();
        expect(screen.getByText("p2")).toBeInTheDocument();

        fireEvent.click(row);

        expect(toggle).toHaveAttribute("aria-expanded", "false");
        expect(screen.queryByText("The payment is waiting for approval.")).not.toBeInTheDocument();
    });

    it("opens details with the toggle button and keeps only one payment open at a time", () => {
        renderTable();

        fireEvent.click(screen.getByRole("button", { name: "Details for 2026-10-03 of 100.00 SEK" }));
        expect(screen.getByText("The payment has been completed.")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Details for 2026-10-01 of 300.00 SEK" }));

        expect(screen.getByText("The payment was rejected.")).toBeInTheDocument();
        expect(screen.queryByText("The payment has been completed.")).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Details for 2026-10-03 of 100.00 SEK" })).toHaveAttribute("aria-expanded", "false");
    });
});
