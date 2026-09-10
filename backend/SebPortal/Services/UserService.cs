using SebPortal.Models;
using SebPortal.Api.Dtos;
using SebPortal.Api.Repositories;
using Microsoft.AspNetCore.Http.HttpResults;

namespace SebPortal.Api.Services
{
    public class UserService : IUserService
    {

        private readonly IUserRepository _userRepository;

        public UserService(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public async Task<ReadUserDTO> CreateUserAsync(CreateUserDTO dto)
        {
            var user = new User
            {
                TenantId = dto.TenantId,
                Name = dto.Name,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = dto.Role
            };

            await _userRepository.CreateUserAsync(user);

            return new ReadUserDTO
            {
                Id = user.Id,
                TenantId = user.TenantId,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role
            };
        }

        public Task<bool> DeleteUserAsync(int userId)
        {
            throw new NotImplementedException();
        }

        public Task<User?> GetUserByEmailAsync(string email)
        {
            throw new NotImplementedException();
        }

        public Task<User?> GetUserByIdAsync(int userId)
        {
            var user = _userRepository.GetUserByIdAsync(userId);
            return user;
        }

        public Task<User> UpdateUserAsync(User user)
        {
            throw new NotImplementedException();
        }
    }
}
