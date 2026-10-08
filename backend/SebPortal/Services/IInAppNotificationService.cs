using SebPortal.Api.Dtos;

namespace SebPortal.Api.Services
{
    public interface IInAppNotificationService
    {
        Task CreateAsync(int userId, int approvalStepId, string message, CancellationToken cancellationToken = default);

        Task<List<InAppNotificationDTO>> GetForUserAsync(int userId, CancellationToken cancellationToken = default);

        Task<bool> MarkAsReadAsync(int notificationId, int userId, CancellationToken cancellationToken = default);
    }
}