using Microsoft.EntityFrameworkCore;
using SebPortal.Api.Authorization;
using SebPortal.Api.Dtos;
using SebPortal.Data;
using SebPortal.Models;

namespace SebPortal.Api.Repositories
{
    public class UserRepository : IUserRepository
    {

        private readonly SebDbContext _context;

        public UserRepository(SebDbContext context)
        {
            _context = context;
        }

        public async Task<User> CreateUserAsync(User user)
        {
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task<User> UpdateUserAsync(User user)
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task<bool> DeleteUserAsync(int userId, int tenantId)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId && u.TenantId == tenantId);
            if (user == null) return false;

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<User?> GetUserByEmailAsync(string email, int tenantId)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower() && u.TenantId == tenantId);
        }

        public async Task<User?> GetUserByEmailLoginAsync(string email)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
        }

        public async Task<User?> GetUserByIdAsync(int userId, int tenantId)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Id == userId && u.TenantId == tenantId);
        }

        public async Task<IEnumerable<User>> GetAllUsersAsync(int tenantId)
        {
            return await _context.Users
                .Where(u => u.TenantId == tenantId).ToListAsync();
        }

        public async Task<IEnumerable<User>> GetAttestantsByTenantIdAsync(int tenantId)
        {
            return await _context.Users
                .Where(u => u.TenantId == tenantId && u.Role == UserRoles.Attestant)
                .OrderBy(u => u.Id)
                .ToListAsync();
        }

        public Task<User?> GetByPublicIdAsync(Guid publicId, int tenantId)
        {
            return _context.Users.FirstOrDefaultAsync(u => u.PublicId == publicId && u.TenantId == tenantId);
        }
    }
}
