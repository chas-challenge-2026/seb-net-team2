namespace SebPortal.Models
{
    public class NotificationLog
    {
        public int Id { get; set; }
        public int TenantId { get; set; }
        public Tenant Tenant { get; set; } = null!;
        public string RecipientEmail { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string ErrorMessage {  get; set; } = string.Empty;
        public int AttemptNumber { get; set; }
        public DateTime TimeStamp { get; set; } = DateTime.UtcNow;

    }
}
