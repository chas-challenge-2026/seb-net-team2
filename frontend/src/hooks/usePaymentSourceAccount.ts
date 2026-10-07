import { useQuery } from "@tanstack/react-query";

import { fetchPaymentById } from "../services/approvalService";
import { useAccounts } from "./useAccounts";

// Which of the company's accounts a payment is taken from.
// Combines the payment (fromAccountId) with the account list (name and IBAN).
// Replace with a field in /api/Approval/pending when the backend adds it, to avoid one request per payment.
export function usePaymentSourceAccount(paymentId: number) {
    const payment = useQuery({
        queryKey: ["payment", paymentId],
        queryFn: () => fetchPaymentById(paymentId),
    });

    const accounts = useAccounts();

    const fromAccountId = payment.data ? String(payment.data.fromAccountId) : null;
    const account = accounts.data?.find((item) => item.id === fromAccountId) ?? null;

    return {
        account,
        fromAccountId,
        isPending: payment.isPending || accounts.isPending,
        isError: payment.isError || accounts.isError,
    };
}
