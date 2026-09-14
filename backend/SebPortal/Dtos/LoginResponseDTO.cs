namespace SebPortal.Api.Dtos
{
    public class LoginResponseDTO
    {
        public string Token { get; set; } = string.Empty;
        public int UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public int TenantId { get; set; }

    }
}
