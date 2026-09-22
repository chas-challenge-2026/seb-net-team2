using SebPortal.Api.Dtos;

namespace SebPortal.Api.Services
{
    public interface IRefreshTokenService
    {
        Task<string> CreateRefreshTokenAsync(int userId);
        Task<RefreshTokenResponseDTO?> RefreshAsync(string refreshToken);
        Task<bool> RevokeAsync(string refreshToken);
    }
}
