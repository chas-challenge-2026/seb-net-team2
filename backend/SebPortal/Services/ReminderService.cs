using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SebPortal.Api.Dtos;
using SebPortal.Api.Models;
using SebPortal.Data;

namespace SebPortal.Api.Services
{
    public class ReminderService : IReminderService
    {
        private readonly SebDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly ReminderOptions _options;

        public ReminderService(SebDbContext context, INotificationService notificationService, IOptions<ReminderOptions> options)
        {
            _context = context;
            _notificationService = notificationService;
            _options = options.Value;
        }

        public async Task ProcessRemindersAsync(CancellationToken cancellationToken = default)
        {
            var pendingSteps = await _context.ApprovalSteps
                .Include(s => s.Payment)
                .Where(s =>
                    s.Status == "pending" &&
                    s.DecidedAt == null &&
                    s.Payment.Status == "pending_approval" &&
                    s.ReminderCount < 2)
                .ToListAsync(cancellationToken);

            var now = DateTime.UtcNow;
            var delay = TimeSpan.FromMinutes(_options.DelayMinutes);

            foreach (var step in pendingSteps)
            {
                var lastRelevantTime = step.ReminderCount == 0 ? step.Payment.CreatedAt : step.LastReminderSentAt;

                if (lastRelevantTime == null)
                {
                    continue;
                }

                if (now - lastRelevantTime < delay)
                {
                    continue;
                }

                var notification = new NotificationMessageDTO
                {
                    TenantId = step.Payment.TenantId,
                    Channel = NotificationChannel.InApp,
                    UserId = step.AttestantId,
                    ApprovalStepId = step.Id,
                    Subject = "Påminnelse om attest",
                    Message = "Du har en betalning att attestera."
                };

                await _notificationService.SendNotificationMessageAsync(notification);
                step.ReminderCount++;
                step.LastReminderSentAt = now;

                await _context.SaveChangesAsync(cancellationToken);
            }
        }
    }
}