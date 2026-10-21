namespace SebPortal.Api.Dtos
{
    public class ApprovalDecisionDTO
    {
        public Guid StepId { get; set; }
        public required string Decision { get; set; } // "approved" eller "rejected"
        public string? Comment { get; set; }
    }
}
