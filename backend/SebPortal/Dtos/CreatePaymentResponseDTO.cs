using SebPortal.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SebPortal.Api.Dtos
{
    public class CreatePaymentResponseDTO
    {

        public int Id { get; set; }
        public int FromAccountId { get; set; }
        public string ToIban { get; set; } = ""; // IBAN can be between 15 and 34 characters
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "SEK";
        public string Reference { get; set; } = "";
        public string Status { get; set; } = "pending_approval"; // default status is pending_approval
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow; // default to current UTC time

    }
}
