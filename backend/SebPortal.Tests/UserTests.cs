using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using SebPortal.Api.Dtos;
using SebPortal.Api.Repositories;
using SebPortal.Api.Services;
using SebPortal.Data;
using SebPortal.Models;


namespace SebPortal.Tests
{
    public class UserTests
    {
        private readonly Mock<IUserRepository> _userRepositoryMock;
        private readonly Mock<ITokenService> _tokenServiceMock;
        private readonly Mock<IRefreshTokenService> _refreshTokenServiceMock;
        private readonly UserService _userService;

        public UserTests()
        {
            _userRepositoryMock = new Mock<IUserRepository>();
            _tokenServiceMock = new Mock<ITokenService>();

            _tokenServiceMock.Setup(x => x.GenerateAccessToken(It.IsAny<User>())).Returns("my_super_secret_key_which_is_long_enough_12345");

            _refreshTokenServiceMock = new Mock<IRefreshTokenService>();

            _refreshTokenServiceMock.Setup(x => x.CreateRefreshTokenAsync(It.IsAny<int>())).ReturnsAsync("fake_refresh_token");
            
            _userService = new UserService(_userRepositoryMock.Object, _tokenServiceMock.Object, _refreshTokenServiceMock.Object);

        }

        [Fact]
        public async Task CreateUserAsync_ShouldReturnReadUserDTO_WhenEmailIsUnique()
        {
            //Arrange
            var dto = new CreateUserDTO
            {
                TenantId = 1,
                Name = "Test",
                Email = "test@example.com",
                Password = "Password567",
                Role = "User"
            };

            _userRepositoryMock.Setup(r => r.GetUserByEmailAsync(dto.Email))
                .ReturnsAsync((User?)null);

            _userRepositoryMock.Setup(r => r.CreateUserAsync(It.IsAny<User>()))
                .Callback<User>(u=>u.Id =10)
                .ReturnsAsync((User u) =>u);

            //Act
            var result = await _userService.CreateUserAsync(dto);

            //Assert
            Assert.NotNull(result);
            Assert.Equal(10, result.Id);
            Assert.Equal("Test", result.Name);
            Assert.Equal("test@example.com", result.Email);
        }

        [Fact]
        public async Task CreateUserAsync_ShouldThrowException_WhenEmailAlreadyExists()
        {
            // Arrange
            var dto = new CreateUserDTO
            {
                Email = "existing@example.com",
                Password = "Password567"
            };

            var existingUser = new User 
            {   Id = 1, 
                Email = dto.Email,
                Name = "Test",
                PasswordHash = "dummy_hash",
                Role = "User"
            };

            _userRepositoryMock.Setup(r => r.GetUserByEmailAsync(dto.Email))
                .ReturnsAsync(existingUser);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<Exception>(async () =>
            {
                await _userService.CreateUserAsync(dto);
            });

            Assert.Equal("Användare med denna e-postadress finns redan", exception.Message);
        }

        [Fact]
        public async Task LoginAsync_ShouldReturnLoginResponseDTO_WhenCredentialsAreValid()
        {
            //arrange
            var loginDto = new LoginRequestDTO
            {
                Email = "test@example.com",
                Password = "CorrectPassword123"
            };

            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(loginDto.Password);

            var existingUser = new User
            {
                Id = 1,
                Email = loginDto.Email,
                Name = "Test",
                PasswordHash = hashedPassword,
                Role = "Admin"
            };

            _userRepositoryMock.Setup(r => r.GetUserByEmailAsync(loginDto.Email))
                .ReturnsAsync(existingUser);

            //act 
            var result = await _userService.LoginAsync(loginDto);

            //assert
            Assert.NotNull(result);
            Assert.Equal(existingUser.Id, result.UserId);
            Assert.Equal(existingUser.Email, result.Email);
            Assert.Equal(existingUser.Role, result.Role);
            Assert.NotNull(result.Token);
            Assert.Equal("my_super_secret_key_which_is_long_enough_12345", result.Token);
            Assert.Equal("fake_refresh_token", result.RefreshToken);
        }
        [Fact]
        public async Task RefreshAsync_ValidToken_RotatesToken()
        {
            await using var connection = new SqliteConnection("Data Source=:memory:");

            await connection.OpenAsync();

            var options = new DbContextOptionsBuilder<SebDbContext>().UseSqlite(connection).Options;

            await using var context = new SebDbContext(options);

            await context.Database.EnsureCreatedAsync();
            var tenant = new Tenant
            {
                Id = 1,
                Name = "Test Tenant"
            };

            context.Tenants.Add(tenant);

            var user = new User
            {
                Id = 1,
                Name = "Test User",
                Email = "test@test.se",
                PasswordHash = "hash",
                Role = "User", //Change to new User roles
                TenantId = 1
            };

            context.Users.Add(user);

            var tokenServiceMock = new Mock<ITokenService>();

            tokenServiceMock
                .Setup(x => x.HashRefreshToken("old_refresh_token"))
                .Returns("OLD_HASH");

            tokenServiceMock
                .Setup(x => x.GenerateRefreshToken())
                .Returns("new_refresh_token");

            tokenServiceMock
                .Setup(x => x.HashRefreshToken("new_refresh_token"))
                .Returns("NEW_HASH");

            tokenServiceMock
                .Setup(x => x.GenerateAccessToken(It.IsAny<User>()))
                .Returns("new_access_token");

            context.RefreshTokens.Add(new RefreshToken
            {
                UserId = 1,
                TokenHash = "OLD_HASH",
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            });

            await context.SaveChangesAsync();

            var service = new RefreshTokenService(
                context,
                tokenServiceMock.Object);

            var result =
                await service.RefreshAsync("old_refresh_token");

            Assert.NotNull(result);

            Assert.Equal("new_access_token",result.Token);

            Assert.Equal("new_refresh_token",result.RefreshToken);
            // Old token should now be revoked and replaced
            var oldToken = await context.RefreshTokens
                .AsNoTracking()
                .FirstAsync(x => x.TokenHash == "OLD_HASH");

            Assert.NotNull(oldToken.RevokedAt);
            Assert.NotNull(oldToken.ReplacedByTokenId);

            // A new refresh token should exist
            var newToken = await context.RefreshTokens
                .AsNoTracking()
                .FirstAsync(x => x.TokenHash == "NEW_HASH");

            Assert.Null(newToken.RevokedAt);

            // Old refresh token cannot be reused
            var reusedResult =
                await service.RefreshAsync("old_refresh_token");

            Assert.Null(reusedResult);
        }
        [Fact]
        public async Task RefreshAsync_RevokedToken_ReturnsNull()
        {
            await using var connection =
                new SqliteConnection("Data Source=:memory:");

            await connection.OpenAsync();

            var options = new DbContextOptionsBuilder<SebDbContext>()
                .UseSqlite(connection)
                .Options;

            await using var context = new SebDbContext(options);

            await context.Database.EnsureCreatedAsync();

            context.Tenants.Add(new Tenant
            {
                Id = 1,
                Name = "Test Tenant"
            });

            context.Users.Add(new User
            {
                Id = 1,
                Name = "Test User",
                Email = "test@test.se",
                PasswordHash = "hash",
                Role = "User", //Change to new User roles
                TenantId = 1
            });

            context.RefreshTokens.Add(new RefreshToken
            {
                UserId = 1,
                TokenHash = "REVOKED_HASH",
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                RevokedAt = DateTime.UtcNow.AddMinutes(-1)
            });

            await context.SaveChangesAsync();

            var tokenServiceMock = new Mock<ITokenService>();

            tokenServiceMock
                .Setup(x => x.HashRefreshToken("revoked_refresh_token"))
                .Returns("REVOKED_HASH");

            var service = new RefreshTokenService(
                context,
                tokenServiceMock.Object);

            var result =
                await service.RefreshAsync("revoked_refresh_token");

            Assert.Null(result);
        }
        [Fact]
        public async Task RefreshAsync_ExpiredToken_ReturnsNull()
        {
            await using var connection =
                new SqliteConnection("Data Source=:memory:");

            await connection.OpenAsync();

            var options = new DbContextOptionsBuilder<SebDbContext>()
                .UseSqlite(connection)
                .Options;

            await using var context = new SebDbContext(options);

            await context.Database.EnsureCreatedAsync();

            var tenant = new Tenant
            {
                Id = 1,
                Name = "Test Tenant"
            };

            var user = new User
            {
                Id = 1,
                Name = "Test User",
                Email = "test@test.se",
                PasswordHash = "hash",
                Role = "User",
                TenantId = 1
            };

            context.Tenants.Add(tenant);
            context.Users.Add(user);

            context.RefreshTokens.Add(new RefreshToken
            {
                UserId = 1,
                TokenHash = "EXPIRED_HASH",
                CreatedAt = DateTime.UtcNow.AddDays(-8),
                ExpiresAt = DateTime.UtcNow.AddMinutes(-1)
            });

            await context.SaveChangesAsync();

            var tokenServiceMock = new Mock<ITokenService>();

            tokenServiceMock
                .Setup(x => x.HashRefreshToken("expired_refresh_token"))
                .Returns("EXPIRED_HASH");

            var service = new RefreshTokenService(
                context,
                tokenServiceMock.Object);

            var result = await service.RefreshAsync("expired_refresh_token");

            Assert.Null(result);
        }
        [Fact]
        public async Task LoginAsync_ShouldThrowException_WhenCredentialsNotValid()
        {
            //arrange
            var loginDto = new LoginRequestDTO
            {
                Email = "test@example.com",
                Password = "WrongPassword123"
            };

            var hashedPassword = BCrypt.Net.BCrypt.HashPassword("CorrectPassword123");

            var existingUser = new User
            {
                Id = 1,
                Email = loginDto.Email,
                Name = "Test",
                PasswordHash = hashedPassword,
                Role = "Admin",
                TenantId = 1
            };

            _userRepositoryMock.Setup(r => r.GetUserByEmailAsync(loginDto.Email))
                .ReturnsAsync(existingUser);


            //act & assert
            var exception = await Assert.ThrowsAsync<Exception>(async () =>
            {
                await _userService.LoginAsync(loginDto);
            });

            Assert.Equal("Ogiltig e-postadress eller lösenord.", exception.Message);
        }

        [Fact]
        public async Task UpdateUserAsync_ShouldReturnReadUserDTO_WhenUserExists()
        {
            //Arrange
            int userId = 1;
            
            var existingUser = new User
            {
                Id = userId,
                TenantId = 1,
                Name = "Old Name",
                Email = "test@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password567"),
                Role = "User"
            };

            var updateDto = new UpdateUserDTO
            {
                Name = "New Name"
            };

            _userRepositoryMock.Setup(r => r.GetUserByIdAsync(userId))
                .ReturnsAsync(existingUser);

            _userRepositoryMock.Setup(r => r.UpdateUserAsync(It.IsAny<User>()))
                .ReturnsAsync((User u) => u);

            //Act
            var result = await _userService.UpdateUserAsync(userId, updateDto);

            //Assert
            Assert.NotNull(result);
            Assert.Equal("New Name", result.Name);
            Assert.Equal("test@example.com", result.Email);
        }

        [Fact]
        public async Task UpdateUserAsync_ShouldThrowException_WhenUserNotFound()
        {
            //Arrange
            int id = 100;

            var updateDto = new UpdateUserDTO
            {
                Name = "New Name"
            };

            _userRepositoryMock.Setup(r => r.GetUserByIdAsync(id))
                .ReturnsAsync((User?)null);

            //act & assert
            var exception = await Assert.ThrowsAsync<Exception>(async () =>
            {
                await _userService.UpdateUserAsync(id, updateDto);
            });

            Assert.Equal($"Användaren med id: {id} hittades inte", exception.Message);
        }


        [Fact]
        public async Task UpdateUserAsync_ShouldThrowException_WhenEmailIsAlreadyTaken()
        {
            //Arrange
            int id = 1;

            var existingUser = new User
            {
                Id = id,
                Name = "Test",
                Email = "old@example.com",
                PasswordHash = "dummy_hash",
                Role = "User",
                TenantId = 1
            };

            var updateDto = new UpdateUserDTO
            {
                Email = "taken@example.com"
            };


            _userRepositoryMock.Setup(r => r.GetUserByIdAsync(id))
                .ReturnsAsync(existingUser);

            var anotherUser = new User
            {
                Id = 2,
                Name = "Test2",
                Email = "taken@example.com",
                PasswordHash = "dummy_hash",
                Role = "User",
                TenantId = 1
            };

            _userRepositoryMock.Setup(r => r.GetUserByEmailAsync(updateDto.Email))
                .ReturnsAsync(anotherUser);

            //act & assert
            var exception = await Assert.ThrowsAsync<Exception>(async () =>
            {
                await _userService.UpdateUserAsync(id, updateDto);
            });

            Assert.Equal($"En användare med denna e-postadress finns redan", exception.Message);
        }

        [Fact]
        public async Task DeleteUserAsync_ShouldReturnTrue_WhenUserExists()
        {
            int id = 1;
            var existingUser = new User
            {
                Id = id,
                Name = "Test",
                Email = "test@example.com",
                PasswordHash = "dummy_hash",
                Role = "User",
                TenantId = 1
            };

            _userRepositoryMock.Setup(r=> r.GetUserByIdAsync(id))
                .ReturnsAsync(existingUser);

            _userRepositoryMock.Setup(r => r.DeleteUserAsync(id))
                .ReturnsAsync(true);

            var result = await _userService.DeleteUserAsync(id);
            Assert.True(result);
            _userRepositoryMock.Verify(r=> r.DeleteUserAsync(id) , Times.Once);
        }

        [Fact]
        public async Task DeleteUserAsync_ShouldThrowException_WhenUserNotExists()
        {
            //arrange
            int id = 10;

            _userRepositoryMock.Setup(r => r.GetUserByIdAsync(id))
                .ReturnsAsync((User?)null);

            //act & assert
            var exception = await Assert.ThrowsAsync<Exception>(async () =>
            {
                await _userService.DeleteUserAsync(id);
            });

            Assert.Equal($"Användaren med id: {id} hittades inte", exception.Message);

            _userRepositoryMock.Verify(r => r.DeleteUserAsync(It.IsAny<int>()), Times.Never);
        }

        [Fact]
        public async Task GetAllUsersAsync_ShouldReturnMappedReadUserDTOs_WhenUsersExist()
        {
            // Arrange
            var users = new List<User>
    {
                new User
                {
                    Id = 1,
                    TenantId = 1,
                    Name = "Test",
                    Email = "test@example.com",
                    PasswordHash = "hash1",
                    Role = "Admin"
                },
                new User
                {
                    Id = 2,
                    TenantId = 1,
                    Name = "Test2",
                    Email = "test2@example.com",
                    PasswordHash = "hash2",
                    Role = "User"
                }
            };

            _userRepositoryMock.Setup(r => r.GetAllUsersAsync())
                .ReturnsAsync(users);

            // Act
            var result = await _userService.GetAllUsersAsync();

            // Assert
            Assert.NotNull(result);
            var userList = result.ToList();
            Assert.Equal(2, userList.Count); 
            Assert.Equal(1, userList[0].Id);

                //user 1
            Assert.Equal("Test", userList[0].Name);
            Assert.Equal("test@example.com", userList[0].Email);
            Assert.Equal("Admin", userList[0].Role);

                //user 2
            Assert.Equal(2, userList[1].Id);
            Assert.Equal("Test2", userList[1].Name);
            Assert.Equal("test2@example.com", userList[1].Email);
        }
    }
}

