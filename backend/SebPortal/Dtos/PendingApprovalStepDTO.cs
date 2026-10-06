namespace SebPortal.Api.Dtos
{
    // Represents one of the current user's pending approval steps, together with
    // the payment details needed to decide on it, without requiring the caller
    // to already know the PaymentId.
    public class PendingApprovalStepDTO
    {
        public int StepId { get; set; }
        public int StepNumber { get; set; }
        public int PaymentId { get; set; }
        public decimal Amount { get; set; }
        public required string Currency { get; set; }
        public required string ToIban { get; set; }
        public required string Reference { get; set; }
        public int CreatedByUserId { get; set; }
        public required string CreatedByUserName { get; set; }
        public DateTime PaymentCreatedAt { get; set; }
    }
}
