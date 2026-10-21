namespace SebPortal.Api.Dtos
{
    public class InAppNotificationDTO
    {
        public int Id { get; set; }

        public int ApprovalStepId { get; set; }

        public int PaymentId { get; set; }

        public string Message { get; set; } = string.Empty;

        public bool IsRead { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}