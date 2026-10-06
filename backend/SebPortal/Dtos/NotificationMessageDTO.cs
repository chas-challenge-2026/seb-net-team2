namespace SebPortal.Api.Dtos
{
    public class NotificationMessageDTO
    {
        public int Id { get; set; }
        public int TenantId { get; set; }
        public string RecipientEmail { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public int AttemptCount { get; set; } = 0;
    }
}
