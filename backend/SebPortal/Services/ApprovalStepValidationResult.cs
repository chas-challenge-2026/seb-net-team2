namespace SebPortal.Api.Services
{
    // Enum to represent the result of validating an approval step
    public enum ApprovalStepValidationResult
    {
        Valid,
        StepNotFound,
        InvalidDecision,
        StepDoesNotBelongToPayment,
        PaymentNotPendingApproval,
        StepAlreadyDecided,
        CannotApproveOwnPayment,
        NotAssignedAttestant
    }
}
