import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/jest-globals";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { NyBetalning } from "./NyBetalning";
import { useAccounts } from "../../hooks/useAccounts";
import { useAuth } from "../../hooks/useAuth";
import { createPayment } from "../../services/accountService";

jest.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const translations: Record<string, string> = {
                "common.loading": "Loading...",
                "payment.eyebrow": "PAYMENTS",
                "payment.title": "Create a new payment",
                "payment.description": "Send a secure payment from your company account.",
                "payment.steps.label": "Payment progress",
                "payment.steps.details": "Details",
                "payment.steps.review": "Review",
                "payment.steps.result": "Result",
                "payment.details.title": "Payment details",
                "payment.details.description": "Enter the recipient and payment amount.",
                "payment.fields.fromAccount": "From account",
                "payment.fields.recipient": "Recipient",
                "payment.fields.iban": "IBAN",
                "payment.fields.amount": "Amount",
                "payment.fields.reference": "Reference",
                "payment.fields.message": "Message",
                "payment.placeholders.recipient": "Company or person",
                "payment.placeholders.reference": "Invoice or OCR",
                "payment.placeholders.message": "Write a message to the recipient",
                "payment.optional": "Optional",
                "payment.iban.valid": "IBAN format is valid.",
                "payment.iban.invalid": "Enter a valid IBAN.",
                "payment.iban.accountNotChecked": "Account ownership is not checked.",
                "payment.errors.selectAccount": "Select an account.",
                "payment.errors.recipientRequired": "Enter a recipient.",
                "payment.errors.invalidIban": "Enter a valid IBAN.",
                "payment.errors.amountRequired": "Enter an amount.",
                "payment.errors.amountPositive": "Amount must be greater than zero.",
                "payment.errors.referenceTooLong": "Reference must be 100 characters or fewer.",
                "payment.errors.messageTooLong": "Message must be 500 characters or fewer.",
                "payment.errors.insufficientBalance": "The payment amount exceeds the account balance.",
                "payment.errors.reviewDetails": "Please review the payment details and try again.",
                "payment.errors.createFailed": "Could not create the payment. Please try again.",
                "payment.errors.loadAccounts": "Could not load accounts.",
                "payment.errors.noAccounts": "No accounts are available for payments.",
                "payment.summary.notSpecified": "Not specified",
                "payment.actions.clear": "Clear form",
                "payment.actions.continueToReview": "Continue to review",
                "payment.actions.goBack": "Go back",
                "payment.actions.creating": "Creating...",
                "payment.actions.confirm": "Confirm payment",
                "payment.actions.newPayment": "Start a new payment",
                "payment.review.eyebrow": "FINAL CHECK",
                "payment.review.title": "Review payment",
                "payment.review.description": "Check the details before creating this payment.",
                "payment.result.eyebrow": "PAYMENT STATUS",
                "payment.result.title": "Payment submitted",
                "payment.result.pendingTitle": "Approval required",
                "payment.result.pendingApproval": "The payment was created and is waiting for approval.",
                "payment.result.statusValues.pendingApproval": "Waiting for approval",
                "payment.result.sourceAccount": "From account",
                "payment.result.submittedAt": "Submitted",
                "payment.result.paymentId": "Payment ID",
            };

            return translations[key] ?? key;
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

const accounts = [
    {
        id: "12",
        name: "Operating account",
        balance: 1250000.5,
        currency: "SEK",
        iban: "SE4550000000058398257466",
    },
];

function setDefaultHookValues() {
    mockedUseAccounts.mockReturnValue({
        data: accounts,
        isLoading: false,
        isError: false,
    } as unknown as ReturnType<typeof useAccounts>);
    mockedUseAuth.mockReturnValue({
        user: { tenantId: 1, name: "Lisa Persson" },
    } as unknown as ReturnType<typeof useAuth>);
}

function enterValidPaymentDetails() {
    fireEvent.change(screen.getByPlaceholderText("Company or person"), {
        target: { value: "Northwind Supplies" },
    });
    fireEvent.change(screen.getByPlaceholderText("SE00 0000 0000 0000 0000 0000"), {
        target: { value: "SE3550000000054910000003" },
    });
    fireEvent.change(screen.getByPlaceholderText("0.00"), {
        target: { value: "2500" },
    });
    fireEvent.change(screen.getByPlaceholderText("Invoice or OCR"), {
        target: { value: "Invoice 42" },
    });
}

afterEach(() => cleanup());

describe("New payment flow", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        setDefaultHookValues();
    });

    it("renders the account returned by the accounts hook and payment fields", () => {
        render(<NyBetalning />);

        expect(screen.getByRole("combobox")).toHaveValue("12");
        expect(screen.getByRole("option", { name: /Operating account/ })).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Company or person")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("SE00 0000 0000 0000 0000 0000")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("0.00")).toBeInTheDocument();
    });

    it("shows live IBAN validity and prevents advancing with invalid details", () => {
        render(<NyBetalning />);

        fireEvent.change(screen.getByPlaceholderText("SE00 0000 0000 0000 0000 0000"), {
            target: { value: "SE00000000000000000000" },
        });
        expect(screen.getByRole("status")).toHaveTextContent("Enter a valid IBAN.");

        fireEvent.click(screen.getByRole("button", { name: /Continue to review/ }));
        expect(screen.getByText("Enter a recipient.")).toBeInTheDocument();
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("shows validation errors beside invalid fields and associates them accessibly", () => {
        render(<NyBetalning />);

        fireEvent.click(screen.getByRole("button", { name: /Continue to review/ }));

        const recipient = screen.getByPlaceholderText("Company or person");
        const iban = screen.getByPlaceholderText("SE00 0000 0000 0000 0000 0000");
        const amount = screen.getByPlaceholderText("0.00");

        expect(screen.getByText("Enter a recipient.")).toBeInTheDocument();
        expect(recipient).toHaveAttribute("aria-invalid", "true");
        expect(recipient).toHaveAttribute("aria-describedby", "recipient-error");

        expect(screen.getByText("Enter a valid IBAN.")).toBeInTheDocument();
        expect(iban).toHaveAttribute("aria-invalid", "true");
        expect(iban.getAttribute("aria-describedby")).toContain("iban-error");

        expect(screen.getByText("Enter an amount.")).toBeInTheDocument();
        expect(amount).toHaveAttribute("aria-invalid", "true");
        expect(amount).toHaveAttribute("aria-describedby", "amount-error");
    });

    it("associates insufficient-balance feedback with the amount field", () => {
        render(<NyBetalning />);
        enterValidPaymentDetails();
        fireEvent.change(screen.getByPlaceholderText("0.00"), {
            target: { value: "2000000" },
        });

        fireEvent.click(screen.getByRole("button", { name: /Continue to review/ }));

        const amount = screen.getByPlaceholderText("0.00");
        expect(screen.getByText("The payment amount exceeds the account balance.")).toBeInTheDocument();
        expect(amount).toHaveAttribute("aria-invalid", "true");
        expect(amount).toHaveAttribute("aria-describedby", "amount-error");
    });

    it("shows length errors beside reference and message fields", () => {
        render(<NyBetalning />);
        enterValidPaymentDetails();
        fireEvent.change(screen.getByPlaceholderText("Invoice or OCR"), {
            target: { value: "R".repeat(101) },
        });
        fireEvent.change(screen.getByPlaceholderText("Write a message to the recipient"), {
            target: { value: "M".repeat(501) },
        });

        fireEvent.click(screen.getByRole("button", { name: /Continue to review/ }));

        expect(screen.getByText("Reference must be 100 characters or fewer.")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Invoice or OCR")).toHaveAttribute("aria-describedby", "reference-error");
        expect(screen.getByText("Message must be 500 characters or fewer.")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Write a message to the recipient")).toHaveAttribute("aria-describedby", "message-error");
    });

    it("opens a review dialog with the entered details before creating the payment", () => {
        render(<NyBetalning />);
        enterValidPaymentDetails();

        expect(screen.getByRole("status")).toHaveTextContent("IBAN format is valid.");
        fireEvent.click(screen.getByRole("button", { name: /Continue to review/ }));

        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByText("Northwind Supplies")).toBeInTheDocument();
        expect(screen.getByText("Invoice 42")).toBeInTheDocument();
        expect(mockedCreatePayment).not.toHaveBeenCalled();
    });

    it("submits after confirmation and shows the API approval status", async () => {
        mockedCreatePayment.mockResolvedValue({
            id: 42,
            fromAccountId: 12,
            toIban: "SE3550000000054910000003",
            amount: 2500,
            currency: "SEK",
            reference: "Invoice 42",
            status: "pending_approval",
            createdAt: "2026-10-07T10:30:00Z",
        });

        render(<NyBetalning />);
        enterValidPaymentDetails();
        fireEvent.click(screen.getByRole("button", { name: /Continue to review/ }));
        fireEvent.click(screen.getByRole("button", { name: /Confirm payment/ }));

        await waitFor(() => {
            expect(mockedCreatePayment).toHaveBeenCalledWith(
                expect.objectContaining({
                    fromAccountId: 12,
                    toIban: "SE3550000000054910000003",
                    amount: 2500,
                    reference: "Invoice 42",
                }),
                expect.any(String)
            );
        });

        expect(await screen.findByRole("status")).toHaveTextContent(
            "The payment was created and is waiting for approval."
        );
        expect(screen.getByText("Approval required")).toBeInTheDocument();
        expect(screen.queryByText("Payment ID")).not.toBeInTheDocument();
    });
});
