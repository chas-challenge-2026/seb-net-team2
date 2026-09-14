using System.ComponentModel.DataAnnotations;

namespace SebPortal.Api.Dtos
{
    public class CreateAccountDTO
    {
        [Required]
        public int TenantId { get; set; }

        [Required]
        [MaxLength(100)]
        public required string AccountName { get; set; }

        [Required]
        [MaxLength(3)]
        public string Currency { get; set; } = "SEK";
    }
}
