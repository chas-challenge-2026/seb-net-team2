using System.ComponentModel.DataAnnotations;

namespace SebPortal.Api.Dtos
{
    public class CreateUserDTO
    {
        [Required]
        public int TenantId { get; set; }
        [Required]
        [StringLength(100)]
        public string Name{ get; set; } = "";
        [Required]
        [EmailAddress]
        [MaxLength(100)]
        public string Email { get; set; } = "";
        [Required]
        [MaxLength(60)]
        public string Password { get; set; } = "";
        [Required]
        public string Role { get; set; } = "";
    }
}
