using System.ComponentModel.DataAnnotations;

namespace SebPortal.Api.Dtos
{
    public class RefreshTokenRequestDTO
    {
        [Required]
        public string RefreshToken { get; set; } = string.Empty;
    }
}