using System.ComponentModel.DataAnnotations;

namespace SebPortal.Api.Dtos
{
    public class UpdateUserDTO
    {
        [StringLength(100)]
        public string? Name { get; set; }
        [EmailAddress]
        [MaxLength(100)]
        public string? Email { get; set; }
        [MaxLength(60)]
        public string? Password { get; set; }
        public string? Role { get; set; }
        
    }
}
