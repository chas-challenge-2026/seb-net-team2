namespace SebPortal.Api.Dtos
{
    public class ApprovalDecisionDTO
    {
        public int StepId { get; set; }
        public required string Decision { get; set; } // "approved" eller "rejected"
        public string? Comment { get; set; }
    }
}
