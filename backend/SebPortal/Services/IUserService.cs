using SebPortal.Models;
using SebPortal.Api.Dtos;

namespace SebPortal.Api.Services
{
    public interface IUserService
    {
        Task<ReadUserDTO?> GetUserByIdAsync(int userId);
        Task<ReadUserDTO?> GetUserByEmailAsync(string email);
        Task<ReadUserDTO> CreateUserAsync(CreateUserDTO dto, int actingUserId);
        Task<ReadUserDTO> UpdateUserAsync(int id, UpdateUserDTO dto, int actingUserId);
        Task<bool> DeleteUserAsync(int userId, int actingUserId);
        Task<LoginResponseDTO> LoginAsync (LoginRequestDTO dto);
        Task<IEnumerable<ReadUserDTO>> GetAllUsersAsync();
    }
}
