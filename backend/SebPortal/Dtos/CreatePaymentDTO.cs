using SebPortal.Models;
using System.ComponentModel.DataAnnotations;

namespace SebPortal.Api.Dtos
{
    public class CreatePaymentDTO
    {
        [Range(1, int.MaxValue)] // TenantId should be a positive int
        public int TenantId { get; set; }
        [Range(1, int.MaxValue)] // FromAccountId should be a positive int
        public int FromAccountId { get; set; }
        [Required]
        [StringLength(34, MinimumLength = 15)]
        public string ToIban { get; set; } = ""; // IBAN can be between 15 and 34 characters
        [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than 0")]
        public decimal Amount { get; set; }
        [StringLength(3, MinimumLength = 3)]
        public string Currency { get; set; } = "SEK";
        [StringLength(100)]
        public string Reference { get; set; } = "";
    }
}
