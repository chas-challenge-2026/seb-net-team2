namespace SebPortal.Models
{
    public class InAppNotification
    {
        public int Id { get; set; }

        public int UserId { get; set; }
        public User User { get; set; } = null!;

        public int ApprovalStepId { get; set; }
        public ApprovalStep ApprovalStep { get; set; } = null!;

        public string Message { get; set; } = string.Empty;

        public bool IsRead { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}