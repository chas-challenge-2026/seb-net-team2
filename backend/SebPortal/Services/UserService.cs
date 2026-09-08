using SebPortal.Api.Dtos;
using SebPortal.Api.Repositories;
using SebPortal.Models;

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
            var existingEmailUser = await _userRepository.GetUserByEmailAsync(dto.Email);
            if (existingEmailUser != null)
            {
                throw new Exception("Användare med denna e-postadress finns redan");
            }

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

        public async Task<bool> DeleteUserAsync(int userId)
        {
            var user = await _userRepository.GetUserByIdAsync(userId);
            if (user == null) return false;

            await _userRepository.DeleteUserAsync(user.Id);
            return true;
        }

        public async Task<ReadUserDTO?> GetUserByEmailAsync(string email)
        {
            var user = await _userRepository.GetUserByEmailAsync(email);
            if (user == null) return null;

            return new ReadUserDTO
            {
                Id = user.Id,
                TenantId = user.TenantId,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role
            };
        }

        public async Task<ReadUserDTO?> GetUserByIdAsync(int userId)
        {
            var user = await _userRepository.GetUserByIdAsync(userId);
            if (user == null)
            {
                return null;
            }

            return new ReadUserDTO
            {
                Id = user.Id,
                TenantId = user.TenantId,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role
            };
        }

        public async Task<ReadUserDTO> UpdateUserAsync(int id, UpdateUserDTO dto)
        {
            var existingUser = await _userRepository.GetUserByIdAsync(id);
            if (existingUser == null)
            {
                throw new Exception("Användaren hittades inte");
            }

            //if email is changed, validate unique email
            if (existingUser.Email != dto.Email)
            {
                var existingEmailUser = await _userRepository.GetUserByEmailAsync(dto.Email);
                if (existingEmailUser != null)
                {
                    throw new Exception("En användare med denna e-postadress finns redan");
                }
            }

            //update user properties
            existingUser.Name = dto.Name;
            existingUser.Email = dto.Email;
            existingUser.Role = dto.Role;
            existingUser.TenantId = dto.TenantId;

            //if password is provided, hash it and update the password hash
            if (!string.IsNullOrEmpty(dto.Password))
            {
                existingUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
            }

            await _userRepository.UpdateUserAsync(existingUser);

            return new ReadUserDTO
            {
                Id = existingUser.Id,
                TenantId = existingUser.TenantId,
                Name = existingUser.Name,
                Email = existingUser.Email,
                Role = existingUser.Role
            };
        }
    }
}
