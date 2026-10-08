using Microsoft.EntityFrameworkCore;
using SebPortal.Api.Dtos;
using SebPortal.Data;
using SebPortal.Models;

namespace SebPortal.Api.Services
{
    public class InAppNotificationService : IInAppNotificationService
    {
        private readonly SebDbContext _context;

        public InAppNotificationService(SebDbContext context)
        {
            _context = context;
        }

        public async Task CreateAsync(int userId, int approvalStepId, string message, CancellationToken cancellationToken = default)
        {
            var notification = new InAppNotification
            {
                UserId = userId,
                ApprovalStepId = approvalStepId,
                Message = message
            };

            _context.InAppNotifications.Add(notification);

            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task<List<InAppNotificationDTO>> GetForUserAsync(int userId, CancellationToken cancellationToken = default)
        {
            return await _context.InAppNotifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new InAppNotificationDTO
                    {
                    Id = n.Id,
                    ApprovalStepId = n.ApprovalStepId,
                    PaymentId = n.ApprovalStep.PaymentId,
                    Message = n.Message,
                    IsRead = n.IsRead,
                    CreatedAt = n.CreatedAt
                    })
                .ToListAsync(cancellationToken);
        }

        public async Task<bool> MarkAsReadAsync(int notificationId, int userId,CancellationToken cancellationToken = default)
        {
            var notification = await _context.InAppNotifications
                .FirstOrDefaultAsync(
                    n => n.Id == notificationId && n.UserId == userId, cancellationToken);

            if (notification == null)
            {
                return false;
            }

            notification.IsRead = true;

            await _context.SaveChangesAsync(cancellationToken);

            return true;
        }
    }
}