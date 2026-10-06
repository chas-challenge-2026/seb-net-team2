using Microsoft.IdentityModel.Tokens;
using SebPortal.Api.Dtos;
using SebPortal.Api.Middleware;
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
        private readonly IAuditRepository _auditRepository;

        public UserService(IUserRepository userRepository, ITokenService tokenService, IRefreshTokenService refreshTokenService, IAuditRepository auditRepository)
        {
            _userRepository = userRepository;
            _tokenService = tokenService;
            _refreshTokenService = refreshTokenService;
            _auditRepository = auditRepository;
        }

        public async Task<ReadUserDTO> CreateUserAsync(CreateUserDTO dto, int actingUserId, int tenantId)
        {
            var existingEmailUser = await _userRepository.GetUserByEmailAsync(dto.Email, tenantId);
            if (existingEmailUser != null)
            {
                throw new Exception("Användare med denna e-postadress finns redan");
            }

            var user = new User
            {
                TenantId = tenantId,
                Name = dto.Name,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = dto.Role
            };

            await _userRepository.CreateUserAsync(user);

            await _auditRepository.AddEntryAsync(new AuditEntries
            {
                TenantId = user.TenantId,
                UserId = actingUserId,
                Action = AuditActions.CreateUser,
                EntityType = AuditEntityTypes.User,
                EntityId = user.Id,
                Description = $"Skapade användare {user.Name} ({user.Email}) med rollen {user.Role}",
                Details = AuditEntries.ToDetailsJson(new { user.Name, user.Email, user.Role })
            });

            return new ReadUserDTO
            {
                Id = user.Id,
                TenantId = user.TenantId,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role
            };
        }

        public async Task<bool> DeleteUserAsync(int userId, int actingUserId, int tenantId)
        {
            var user = await _userRepository.GetUserByIdAsync(userId, tenantId);
            if (user == null)
            {
                throw new Exception($"Användaren med id: {userId} hittades inte");
            }

            // The DELETE_USER entry below needs an existing actor
            if (user.Id == actingUserId)
            {
                throw new BusinessRuleException("Du kan inte ta bort ditt eget konto.");
            }

            // The audit log must never lose its actor, so users with history can't be hard-deleted
            if (await _auditRepository.HasEntriesForUserAsync(user.Id, tenantId))
            {
                throw new BusinessRuleException("Användaren har historik i granskningsloggen och kan inte tas bort.");
            }

            await _userRepository.DeleteUserAsync(user.Id, tenantId);

            await _auditRepository.AddEntryAsync(new AuditEntries
            {
                TenantId = user.TenantId,
                UserId = actingUserId,
                Action = AuditActions.DeleteUser,
                EntityType = AuditEntityTypes.User,
                EntityId = user.Id,
                Description = $"Tog bort användare {user.Name} ({user.Email})",
                Details = AuditEntries.ToDetailsJson(new { user.Name, user.Email, user.Role })
            });

            return true;
        }

        public async Task<ReadUserDTO?> GetUserByEmailAsync(string email, int tenantId)
        {
            var user = await _userRepository.GetUserByEmailAsync(email, tenantId);
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

        public async Task<ReadUserDTO?> GetUserByEmailLoginAsync(string email)
        {
            var user = await _userRepository.GetUserByEmailLoginAsync(email);
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

        public async Task<ReadUserDTO?> GetUserByIdAsync(int userId, int tenantId)
        {
            var user = await _userRepository.GetUserByIdAsync(userId, tenantId);
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

        public async Task<ReadUserDTO> UpdateUserAsync(int id, UpdateUserDTO dto, int actingUserId, int tenantId)
        {
            var existingUser = await _userRepository.GetUserByIdAsync(id, tenantId);
            if (existingUser == null)
            {
                throw new Exception($"Användaren med id: {id} hittades inte");
            }

            // Snapshot for the audit log, taken before any field is changed
            var before = new { existingUser.Name, existingUser.Email, existingUser.Role };

            // Update if updated
            if (dto.Name != null)
            {
                existingUser.Name = dto.Name;
            }

            //if email is changed, validate unique email
            if (dto.Email != null && existingUser.Email != dto.Email)
            {
                var existingEmailUser = await _userRepository.GetUserByEmailAsync(dto.Email, tenantId);
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

            // The password itself is never logged, only the fact that it was changed
            var passwordChanged = !string.IsNullOrEmpty(dto.Password);
            var after = new { existingUser.Name, existingUser.Email, existingUser.Role };
            var changedFields = new List<string>();
            if (before.Name != after.Name) changedFields.Add("name");
            if (before.Email != after.Email) changedFields.Add("email");
            if (before.Role != after.Role) changedFields.Add("role");
            if (passwordChanged) changedFields.Add("password");

            await _auditRepository.AddEntryAsync(new AuditEntries
            {
                TenantId = existingUser.TenantId,
                UserId = actingUserId,
                Action = AuditActions.UpdateUser,
                EntityType = AuditEntityTypes.User,
                EntityId = existingUser.Id,
                Description = changedFields.Count == 0
                    ? $"Uppdaterade användare {existingUser.Name} (inga ändringar)"
                    : $"Uppdaterade användare {existingUser.Name}: {string.Join(", ", changedFields)}",
                Details = AuditEntries.ToDetailsJson(new { changedFields, before, after, passwordChanged })
            });

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

            var user = await _userRepository.GetUserByEmailLoginAsync(dto.Email);
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

        public async Task<IEnumerable<ReadUserDTO>> GetAllUsersAsync(int tenantId)
        {
            var users = await _userRepository.GetAllUsersAsync(tenantId);
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
