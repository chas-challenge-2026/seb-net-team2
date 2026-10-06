using SebPortal.Models;

namespace SebPortal.Api.Repositories
{
    public interface IUserRepository
    {
        Task<User?> GetUserByIdAsync(int userId, int tenantId);
        Task<User?> GetUserByEmailAsync(string email, int tenantId);
        Task<User?> GetUserByEmailLoginAsync(string email);

        Task<User> CreateUserAsync(User user);
        Task<User> UpdateUserAsync(User user);
        Task<bool> DeleteUserAsync(int userId, int tenantId);
        Task<IEnumerable<User>> GetAttestantsByTenantIdAsync(int tenantId);
        Task<IEnumerable<User>> GetAllUsersAsync(int tenantId);
    }
}
