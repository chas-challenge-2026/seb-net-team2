using SebPortal.Api.Dtos;

namespace SebPortal.Api.Services
{
    public interface INotificationService
    {
        Task SendNotificationMessageAsync(NotificationMessageDTO dto);
    }
}
