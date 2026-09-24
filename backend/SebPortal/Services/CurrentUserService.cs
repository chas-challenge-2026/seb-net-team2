using Microsoft.EntityFrameworkCore;
using SebPortal.Api.Dtos;
using SebPortal.Data;

namespace SebPortal.Api.Services
{
    public class CurrentUserService : ICurrentUserService
    {
        private readonly SebDbContext _context;

        public CurrentUserService(SebDbContext context)
        {
            _context = context;
        }

        public async Task<CurrentUserDTO?> GetCurrentUserAsync(int userId)
        {
            var user = await _context.Users
                .AsNoTracking()
                .Where(u => u.Id == userId)
                .Select(u => new CurrentUserDTO
                {
                    Id = u.Id,
                    Name = u.Name,
                    Email = u.Email,
                    Role = u.Role,
                    TenantId = u.TenantId,
                    TenantName = u.Tenant.Name,

                    PendingApprovalsCount = _context.ApprovalSteps.Count(s => s.AttestantId == u.Id && s.Status == "pending" && s.Payment.Status == "pending_approval")
                })
                .FirstOrDefaultAsync();

            return user;
        }
    }
}
