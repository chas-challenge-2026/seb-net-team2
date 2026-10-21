using SebPortal.Api.Dtos;

namespace SebPortal.Api.Services
{
    public interface INotificationQueue
    {
        ValueTask EnqueueNotificationAsync(NotificationMessageDTO notification);
        ValueTask<NotificationMessageDTO> ReadAsync(CancellationToken cancellationToken);
    }
}
