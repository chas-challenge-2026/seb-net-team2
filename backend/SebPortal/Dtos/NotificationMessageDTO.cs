namespace SebPortal.Api.Dtos
{
    public class NotificationMessageDTO
    {
        public string RecipientEmail { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public int AttemptCount { get; set; } = 0;
    }
}
