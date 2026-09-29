using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SebPortal.Api.Dtos
{
    public class AccountResponseDTO
    {
        public int Id { get; set; }
        public int TenantId { get; set; }
        public required string AccountName { get; set; }
        public required string Iban { get; set; }
        public decimal Balance { get; set; } 
        public string Currency { get; set; } = "SEK"; // default currency is SEK
    }
}
