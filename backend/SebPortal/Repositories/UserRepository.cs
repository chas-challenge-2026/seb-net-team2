using SebPortal.Data;
using SebPortal.Models;
using SebPortal.Api.Dtos;
using Microsoft.EntityFrameworkCore;

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


        public Task<bool> DeleteUserAsync(int userId)
        {
            throw new NotImplementedException();
        }

        public Task<User?> GetUserByEmailAsync(string email)
        {
            throw new NotImplementedException();
        }

        public async Task<User?> GetUserByIdAsync(int userId)
        {
            return await _context.Users.FindAsync(userId);
        }

        public Task<User> UpdateUserAsync(User user)
        {
            throw new NotImplementedException();
        }

        public async Task<IEnumerable<User>> GetAttestantsByTenantIdAsync(int tenantId)
        {
            return await _context.Users
                .Where(u => u.TenantId == tenantId && u.Role == "attestant")
                .OrderBy(u => u.Id)
                .ToListAsync();
        }
    }
}
