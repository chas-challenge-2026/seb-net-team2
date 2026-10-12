using SebPortal.Models;
using SebPortal.Api.Dtos;

namespace SebPortal.Api.Services
{
    public interface IUserService
    {
        Task<ReadUserDTO?> GetUserByIdAsync(Guid userId, int tenantId);
        Task<ReadUserDTO?> GetUserByEmailAsync(string email, int tenantId);
        Task<ReadUserDTO?> GetUserByEmailLoginAsync(string email);

        Task<ReadUserDTO> CreateUserAsync(CreateUserDTO dto, int actingUserId, int tenantId);
        Task<ReadUserDTO> UpdateUserAsync(Guid id, UpdateUserDTO dto, int actingUserId, int tenantId);
        Task<bool> DeleteUserAsync(Guid userId, int actingUserId, int tenantId);
        Task<LoginResponseDTO> LoginAsync (LoginRequestDTO dto);
        Task<IEnumerable<ReadUserDTO>> GetAllUsersAsync(int tenantId);
    }
}
