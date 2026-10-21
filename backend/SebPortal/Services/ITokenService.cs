using SebPortal.Models;

namespace SebPortal.Api.Services
{
    public interface ITokenService
    {
        string GenerateAccessToken(User user);
        string GenerateRefreshToken();
        string HashRefreshToken(string refreshToken);
    }
}