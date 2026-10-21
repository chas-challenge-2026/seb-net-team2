using SebPortal.Api.Dtos;

namespace SebPortal.Api.Services
{
    public interface INotificationProcessor
    {
        Task ProcessNotificationAsync(NotificationMessageDTO dto, CancellationToken cancellationToken);
    }
}
