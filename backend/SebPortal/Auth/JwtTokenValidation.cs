using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace SebPortal.Api.Auth
{
    public static class JwtTokenValidation
    {
        public static TokenValidationParameters Create(
            string secret,
            string issuer,
            string audience)
        {
            return new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = issuer,

                ValidateAudience = true,
                ValidAudience = audience,

                ValidateLifetime = true,

                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(secret)
                ),

                RoleClaimType = "Role",
                NameClaimType = "UserId",

                ClockSkew = TimeSpan.Zero
            };
        }
    }
}
