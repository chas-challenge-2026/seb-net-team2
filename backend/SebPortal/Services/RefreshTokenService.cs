using Microsoft.EntityFrameworkCore;
using SebPortal.Api.Dtos;
using SebPortal.Data;
using SebPortal.Models;

namespace SebPortal.Api.Services
{
    public class RefreshTokenService : IRefreshTokenService
    {
        private readonly SebDbContext _context;
        private readonly ITokenService _tokenService;

        public RefreshTokenService(
            SebDbContext context,
            ITokenService tokenService)
        {
            _context = context;
            _tokenService = tokenService;
        }

        public async Task<string> CreateRefreshTokenAsync(int userId)
        {
            // This is the token the frontend will receive
            var refreshToken = _tokenService.GenerateRefreshToken();

            // Only the hash is stored in the database
            var tokenHash = _tokenService.HashRefreshToken(refreshToken);

            var refreshTokenEntity = new RefreshToken
            {
                UserId = userId,
                TokenHash = tokenHash,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            };

            _context.RefreshTokens.Add(refreshTokenEntity);

            await _context.SaveChangesAsync();

            return refreshToken;
        }
        public async Task<RefreshTokenResponseDTO?> RefreshAsync(string refreshToken)
        {
            var tokenHash = _tokenService.HashRefreshToken(refreshToken);
            var now = DateTime.UtcNow;

            await using var transaction = await _context.Database.BeginTransactionAsync();

            var storedToken = await _context.RefreshTokens
                .AsNoTracking()
                .Include(x => x.User)
                .FirstOrDefaultAsync(x => x.TokenHash == tokenHash);

            if (storedToken == null ||
                storedToken.User == null ||
                storedToken.RevokedAt != null ||
                storedToken.ExpiresAt <= now)
            {
                return null;
            }

            // Atomically claim/revoke the old token.
            var affectedRows = await _context.RefreshTokens
                .Where(x =>
                    x.Id == storedToken.Id &&
                    x.RevokedAt == null &&
                    x.ExpiresAt > now)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(x => x.RevokedAt, now));

            if (affectedRows == 0)
            {
                // Another request already used/revoked this token.
                return null;
            }

            var newRefreshToken = _tokenService.GenerateRefreshToken();

            var newTokenEntity = new RefreshToken
            {
                UserId = storedToken.UserId,
                TokenHash = _tokenService.HashRefreshToken(newRefreshToken),
                CreatedAt = now,
                ExpiresAt = now.AddDays(7)
            };

            _context.RefreshTokens.Add(newTokenEntity);

            // Gives newTokenEntity its database Id
            await _context.SaveChangesAsync();

            await _context.RefreshTokens
                .Where(x => x.Id == storedToken.Id)
                .ExecuteUpdateAsync(setters => setters
                .SetProperty(
                    x => x.ReplacedByTokenId,
                    newTokenEntity.Id));

            await transaction.CommitAsync();

            var newAccessToken = _tokenService.GenerateAccessToken(storedToken.User);

            return new RefreshTokenResponseDTO
            {
                Token = newAccessToken,
                RefreshToken = newRefreshToken
            };
        }
        public async Task<bool> RevokeAsync(string refreshToken)
        {
            var tokenHash = _tokenService.HashRefreshToken(refreshToken);

            var storedToken = await _context.RefreshTokens.FirstOrDefaultAsync(x => x.TokenHash == tokenHash);

            if (storedToken == null || storedToken.RevokedAt != null || storedToken.ExpiresAt <= DateTime.UtcNow)
            {
                return false;
            }

            storedToken.RevokedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return true;
        }
    }
}