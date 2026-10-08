using SebPortal.Api.Dtos;


namespace SebPortal.Api.Services
{
    public class NotificationService : INotificationService
    {
        private readonly INotificationQueue _queue;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(INotificationQueue queue, ILogger<NotificationService> logger)
        {
            _queue = queue;
            _logger = logger;
        }

        public async Task SendNotificationMessageAsync(NotificationMessageDTO dto)
        {
            if (dto.Channel == NotificationChannel.Email)
            {
                _logger.LogInformation(
                    "Lägger till email-notifiering för {RecipientEmail} i kön.",
                    dto.RecipientEmail);
            }
            else
            {
                _logger.LogInformation(
                    "Lägger till in-app-notifiering för UserId {UserId} i kön.",
                    dto.UserId);
            }
            await _queue.EnqueueNotificationAsync(dto);
            
        }
    }
}
