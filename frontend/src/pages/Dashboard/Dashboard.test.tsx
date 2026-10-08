import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/jest-globals";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { Dashboard } from "./Dashboard";
import { useAccounts } from "../../hooks/useAccounts";
import { usePayments } from "../../hooks/usePayments";
import { useAuth } from "../../hooks/useAuth";

jest.mock("@tanstack/react-router", () => ({
    Link: ({ children, to, ...props }: React.PropsWithChildren<{ to: string }>) => (
        <a href={to} {...props}>{children}</a>
    ),
}));

jest.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string, values?: Record<string, string>) => {
            const translations: Record<string, string> = {
                "common.loading": "Loading...",
                "dashboard.greeting": `Good morning, ${values?.user ?? "user"}`,
                "dashboard.user": "user",
                "dashboard.accounts": "Accounts",
                "dashboard.accountsEmpty": "No accounts are set up for this company yet.",
                "dashboard.errors.accounts": "Could not load company accounts. Try again later.",
                "dashboard.recentPayments": "Recent payments",
                "dashboard.table.date": "Date",
                "dashboard.table.fromAccount": "From account",
                "dashboard.table.recipientIban": "Recipient IBAN",
                "dashboard.table.reference": "Reference",
                "dashboard.table.amount": "Amount",
                "dashboard.table.status": "Status",
                "dashboard.status.completed": "Completed",
            };

            return translations[key] ?? key;
        },
        i18n: { resolvedLanguage: "en" },
    }),
}));

jest.mock("../../hooks/useAccounts", () => ({ useAccounts: jest.fn() }));
jest.mock("../../hooks/usePayments", () => ({ usePayments: jest.fn() }));
jest.mock("../../hooks/useAuth", () => ({ useAuth: jest.fn() }));

const mockedUseAccounts = jest.mocked(useAccounts);
const mockedUsePayments = jest.mocked(usePayments);
const mockedUseAuth = jest.mocked(useAuth);

const accounts = [
    {
        id: "12",
        name: "Operating account",
        balance: 1250000.5,
        currency: "SEK",
        iban: "SE4550000000058398257466",
    },
    {
        id: "13",
        name: "Payroll account",
        balance: 890000,
        currency: "SEK",
        iban: "SE4550000000058398257467",
    },
];

function setDefaultHookValues() {
    mockedUseAccounts.mockReturnValue({
        data: accounts,
        isLoading: false,
        isError: false,
    } as unknown as ReturnType<typeof useAccounts>);
    mockedUsePayments.mockReturnValue({
        data: [],
        isLoading: false,
    } as unknown as ReturnType<typeof usePayments>);
    mockedUseAuth.mockReturnValue({
        user: {
            name: "Lisa Persson",
            tenantName: "Malmö Bygg AB",
        },
    } as unknown as ReturnType<typeof useAuth>);
}

afterEach(() => cleanup());

describe("Dashboard account information", () => {
    beforeEach(() => {
        setDefaultHookValues();
    });

    it("shows each account name, formatted balance, currency and IBAN from the API", () => {
        render(<Dashboard />);

        expect(screen.getByText("Operating account")).toBeInTheDocument();
        expect(screen.getByText(`1,250,000.50 SEK`)).toBeInTheDocument();
        expect(screen.getByText("SE4550000000058398257466")).toBeInTheDocument();

        expect(screen.getByText("Payroll account")).toBeInTheDocument();
        expect(screen.getByText(`890,000.00 SEK`)).toBeInTheDocument();
        expect(screen.getByText("SE4550000000058398257467")).toBeInTheDocument();
    });

    it("shows a loading message while accounts are being fetched", () => {
        mockedUseAccounts.mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        } as unknown as ReturnType<typeof useAccounts>);

        render(<Dashboard />);

        expect(screen.getAllByText("Loading...").length).toBeGreaterThan(0);
    });

    it("shows an account-specific error when the API request fails", () => {
        mockedUseAccounts.mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
        } as unknown as ReturnType<typeof useAccounts>);

        render(<Dashboard />);

        expect(screen.getByRole("alert")).toHaveTextContent(
            "Could not load company accounts. Try again later."
        );
        expect(screen.getByText("Recent payments")).toBeInTheDocument();
    });

    it("shows an empty state when the API returns no accounts", () => {
        mockedUseAccounts.mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useAccounts>);

        render(<Dashboard />);

        expect(screen.getByText("No accounts are set up for this company yet.")).toBeInTheDocument();
    });

    it("shows the source account next to the payment date", () => {
        mockedUsePayments.mockReturnValue({
            data: [{
                id: "payment-1",
                date: "2026-10-06",
                fromAccountId: "13",
                toIban: "SE3550000000054910000003",
                reference: "Invoice 42",
                amount: 2500,
                currency: "SEK",
                status: "Completed",
            }],
            isLoading: false,
        } as unknown as ReturnType<typeof usePayments>);

        render(<Dashboard />);

        expect(screen.getByRole("columnheader", { name: "From account" })).toBeInTheDocument();
        const paymentRow = screen.getByText("Invoice 42").closest("tr");
        expect(paymentRow).not.toBeNull();
        expect(paymentRow).toHaveTextContent("2026-10-06");
        expect(paymentRow).toHaveTextContent("Payroll account");
    });

    it("does not show the Create payment shortcut in the header", () => {
        render(<Dashboard />);

        expect(screen.queryByRole("link", { name: "Create payment" })).not.toBeInTheDocument();
    });
});
