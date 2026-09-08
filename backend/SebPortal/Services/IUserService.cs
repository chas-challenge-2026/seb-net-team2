using SebPortal.Models;
using SebPortal.Api.Dtos;

namespace SebPortal.Api.Services
{
    public interface IUserService
    {
        Task<ReadUserDTO?> GetUserByIdAsync(int userId);
        Task<ReadUserDTO?> GetUserByEmailAsync(string email);
        Task<ReadUserDTO> CreateUserAsync(CreateUserDTO dto);
        Task<ReadUserDTO> UpdateUserAsync(int id, UpdateUserDTO dto);
        Task<bool> DeleteUserAsync(int userId);
    }
}
