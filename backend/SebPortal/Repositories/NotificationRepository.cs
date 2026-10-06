using SebPortal.Data;
using SebPortal.Models;

namespace SebPortal.Api.Repositories
{
    public class NotificationRepository : INotificationRepository
    {
        private readonly SebDbContext _context;

        public NotificationRepository(SebDbContext context)
        {
            _context = context;
        }

        public async Task LogFailedNotificationAsync(NotificationLog log)
        {
            _context.NotificationLogs.Add(log);
            await _context.SaveChangesAsync();
        }
    }
}
