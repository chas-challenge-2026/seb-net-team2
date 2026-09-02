using Microsoft.IdentityModel.Tokens;
using SebPortal.Api.Auth;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SebPortal.Tests;

public class JwtTokenValidationTests
{
    private const string Secret =
        "FAKEJwtKeyOnlyUsedForTestingPurposes!";

    private const string Issuer = "SebPortal";
    private const string Audience = "SebPortal";

    [Fact]
    public void ValidateToken_ExpiredToken_ThrowsSecurityTokenExpiredException()
    {
        var token = CreateExpiredToken();

        var validationParameters =
            JwtTokenValidation.Create(
                Secret,
                Issuer,
                Audience
            );

        var tokenHandler = new JwtSecurityTokenHandler();

        Assert.Throws<SecurityTokenExpiredException>(() =>
        {
            tokenHandler.ValidateToken(
                token,
                validationParameters,
                out _
            );
        });
    }
    [Fact]
    public void ValidateToken_ValidToken_ReturnsClaimsPrincipal()
    {
        // Arrange
        var token = CreateValidToken();

        var validationParameters =
            JwtTokenValidation.Create(
                Secret,
                Issuer,
                Audience
            );

        var tokenHandler = new JwtSecurityTokenHandler();

        // Act
        var principal = tokenHandler.ValidateToken(
            token,
            validationParameters,
            out _
        );

        // Assert
        Assert.Equal("123", principal.FindFirst("UserId")?.Value);
        Assert.Equal("Admin", principal.FindFirst("Role")?.Value);
        Assert.Equal("456", principal.FindFirst("TenantId")?.Value);
    }
    private static string CreateExpiredToken()
    {
        var claims = new[]
        {
            new Claim("UserId", "123"),
            new Claim("Role", "Admin"),
            new Claim("TenantId", "456")
        };

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(Secret)
        );

        var credentials = new SigningCredentials(
            key,
            SecurityAlgorithms.HmacSha256
        );

        var token = new JwtSecurityToken(
            issuer: Issuer,
            audience: Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(-1),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string CreateValidToken()
    {
        var claims = new[]
        {
        new Claim("UserId", "123"),
        new Claim("Role", "Admin"),
        new Claim("TenantId", "456")
    };

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(Secret)
        );

        var credentials = new SigningCredentials(
            key,
            SecurityAlgorithms.HmacSha256
        );

        var token = new JwtSecurityToken(
            issuer: Issuer,
            audience: Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(30),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}