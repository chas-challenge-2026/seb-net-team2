import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/jest-globals";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { Batch } from "./Batch";
import { useAccounts } from "../../hooks/useAccounts";
import { useAuth } from "../../hooks/useAuth";
import { createPayment } from "../../services/accountService";
import type { CreatedPayment } from "../../schemas/paymentSchema";

jest.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string, options?: Record<string, unknown>) => {
            const translations: Record<string, string> = {
                "batch.actions.upload": "Upload and process",
                "batch.result.processed": "{{succeeded}} of {{total}} payments created.",
                "batch.result.failed": "{{count}} rows failed — see below.",
                "batch.table.success": "Created",
                "batch.errors.unknownAccount": "Unknown from_account_id '{{id}}'",
                "batch.errors.createFailed": "Could not create the payment: {{message}}",
            };

            return (translations[key] ?? key).replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(options?.[name] ?? ""));
        },
        i18n: { resolvedLanguage: "en" },
    }),
}));

jest.mock("../../hooks/useAccounts", () => ({ useAccounts: jest.fn() }));
jest.mock("../../hooks/useAuth", () => ({ useAuth: jest.fn() }));
jest.mock("../../services/accountService", () => ({
    createPayment: jest.fn(),
}));

const mockedUseAccounts = jest.mocked(useAccounts);
const mockedUseAuth = jest.mocked(useAuth);
const mockedCreatePayment = jest.mocked(createPayment);

const accountId = "9d21cccb-d39d-4cae-99aa-fda8a311cf66";

const accounts = [
    {
        id: accountId,
        name: "Operating account",
        balance: 1250000.5,
        currency: "SEK",
        iban: "SE4550000000058398257466",
    },
];

const validCsv = [
    "from_account_id,to_iban,amount,reference",
    `${accountId},SE8550000000054910000003,5000.00,Faktura #2001`,
    `${accountId},SE8550000000054910000005,12500.00,Faktura #2002`,
].join("\n");

function csvFile(content: string): File {
    const file = new File([content], "batch.csv", { type: "text/csv" });
    Object.defineProperty(file, "text", { value: () => Promise.resolve(content) });
    return file;
}

function uploadCsv(content: string) {
    fireEvent.change(screen.getByLabelText("batch.file.label"), {
        target: { files: [csvFile(content)] },
    });
    fireEvent.click(screen.getByRole("button", { name: /Upload and process/ }));
}

afterEach(() => cleanup());

describe("Batch upload", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedUseAccounts.mockReturnValue({
            data: accounts,
            isLoading: false,
            isError: false,
        } as unknown as ReturnType<typeof useAccounts>);
        mockedUseAuth.mockReturnValue({
            user: { tenantId: 1, name: "Lisa Persson" },
        } as unknown as ReturnType<typeof useAuth>);
        mockedCreatePayment.mockResolvedValue({} as CreatedPayment);
    });

    it("builds the example from the user's own account and lists the account IDs", () => {
        render(<Batch />);

        expect(screen.getByText(/from_account_id,to_iban,amount,reference/)).toHaveTextContent(
            `${accountId},SE8550000000054910000003`
        );
        expect(screen.getByText("Operating account")).toBeInTheDocument();
        expect(screen.queryByText("batch.mockMode")).not.toBeInTheDocument();
    });

    it("creates one payment per row through the payment API", async () => {
        render(<Batch />);
        uploadCsv(validCsv);

        expect(await screen.findByText("2 of 2 payments created.")).toBeInTheDocument();
        expect(mockedCreatePayment).toHaveBeenCalledTimes(2);
        expect(mockedCreatePayment).toHaveBeenNthCalledWith(
            1,
            {
                tenantId: 1,
                fromAccountId: accountId,
                toIban: "SE8550000000054910000003",
                amount: 5000,
                currency: "SEK",
                reference: "Faktura #2001",
            },
            expect.any(String)
        );

        const [firstKey, secondKey] = mockedCreatePayment.mock.calls.map((call) => call[1]);
        expect(firstKey).not.toBe(secondKey);
    });

    it("does not create any payment when a row fails validation", async () => {
        render(<Batch />);
        uploadCsv(validCsv.replace(`${accountId},SE8550000000054910000005`, "1,SE8550000000054910000005"));

        expect(await screen.findByText("Unknown from_account_id '1'")).toBeInTheDocument();
        expect(mockedCreatePayment).not.toHaveBeenCalled();
    });

    it("shows the API error per row and reuses idempotency keys when the file is retried", async () => {
        mockedCreatePayment
            .mockResolvedValueOnce({} as CreatedPayment)
            .mockRejectedValueOnce(new Error("Insufficient funds"));

        render(<Batch />);
        uploadCsv(validCsv);

        expect(await screen.findByText("Could not create the payment: Insufficient funds")).toBeInTheDocument();
        expect(screen.getByText(/1 of 2 payments created\./)).toBeInTheDocument();

        const firstAttemptKeys = mockedCreatePayment.mock.calls.map((call) => call[1]);
        fireEvent.click(screen.getByRole("button", { name: /Upload and process/ }));

        await waitFor(() => expect(mockedCreatePayment).toHaveBeenCalledTimes(4));
        const retryKeys = mockedCreatePayment.mock.calls.slice(2).map((call) => call[1]);
        expect(retryKeys).toEqual(firstAttemptKeys);
    });
});
