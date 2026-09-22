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
            _logger.LogInformation($"Lägger till notifiering för {dto.RecipientEmail} i kön.");
            await _queue.EnqueueNotificationAsync(dto);
            
        }
    }
}
