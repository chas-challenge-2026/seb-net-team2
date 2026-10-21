namespace SebPortal.Api.Dtos
{
    public class RecentApprovalStepDTO
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
