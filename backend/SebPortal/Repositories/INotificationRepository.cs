using SebPortal.Models;

namespace SebPortal.Api.Repositories
{
    public interface INotificationRepository
    {
        Task LogFailedNotificationAsync(NotificationLog log);
    }


}
