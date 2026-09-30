using Microsoft.IdentityModel.Tokens;
using SebPortal.Api.Dtos;
using SebPortal.Api.Repositories;
using SebPortal.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SebPortal.Api.Services
{
    public class UserService : IUserService
    {

        private readonly IUserRepository _userRepository;
        private readonly ITokenService _tokenService;
        private readonly IRefreshTokenService _refreshTokenService;

        public UserService(IUserRepository userRepository, ITokenService tokenService, IRefreshTokenService refreshTokenService)
        {
            _userRepository = userRepository;
            _tokenService = tokenService;
            _refreshTokenService = refreshTokenService;
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
            if (user == null)
            {
                throw new Exception($"Användaren med id: {userId} hittades inte");
            }

            await _userRepository.DeleteUserAsync(user.Id);
            return true;
        }

        public async Task<ReadUserDTO?> GetUserByEmailAsync(string email)
        {
            var user = await _userRepository.GetUserByEmailAsync(email);
            if (user == null)
            {
                throw new Exception($"Användaren med e-post: {email} hittades inte");
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

        public async Task<ReadUserDTO?> GetUserByIdAsync(int userId)
        {
            var user = await _userRepository.GetUserByIdAsync(userId);
            if (user == null)
            {
                throw new Exception($"Användaren med id: {userId} hittades inte");
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
                throw new Exception($"Användaren med id: {id} hittades inte");
            }

            // Update if updated
            if (dto.Name != null)
            {
                existingUser.Name = dto.Name;
            }

            //if email is changed, validate unique email
            if (dto.Email != null && existingUser.Email != dto.Email)
            {
                var existingEmailUser = await _userRepository.GetUserByEmailAsync(dto.Email);
                if (existingEmailUser != null)
                {
                    throw new Exception("En användare med denna e-postadress finns redan");
                }
                existingUser.Email = dto.Email;
            }

            //Update if updated
            if (dto.Role != null)
            {
                existingUser.Role = dto.Role;
            }

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

        public async Task<LoginResponseDTO> LoginAsync(LoginRequestDTO dto)
        {
            var user = await _userRepository.GetUserByEmailAsync(dto.Email);
            if (user == null)
            {
                throw new Exception("Ogiltig e-postadress eller lösenord.");
            }

            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
            if (!isPasswordValid)
            {
                throw new Exception("Ogiltig e-postadress eller lösenord.");
            }

            var accessToken = _tokenService.GenerateAccessToken(user);
            var refreshToken = await _refreshTokenService.CreateRefreshTokenAsync(user.Id);
            return new LoginResponseDTO
            {
                Token = accessToken,
                RefreshToken = refreshToken,
                UserId = user.Id,
                Email = user.Email,
                Role = user.Role,
                TenantId = user.TenantId
            };
        }

        public async Task<IEnumerable<ReadUserDTO>> GetAllUsersAsync()
        {
            var users = await _userRepository.GetAllUsersAsync();
            return users.Select(user => new ReadUserDTO
            {
                Id = user.Id,
                TenantId = user.TenantId,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role
            });
        }
    }
}
