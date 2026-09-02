using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SebPortal.Models
{
    public class Payment
    {
        public int Id { get; set; }
        public int TenantId { get; set; }
        public Tenant Tenant { get; set; } = null!; // Navigation property to Tenants
        public int FromAccountId { get; set; }
        public Account FromAccount { get; set; } = null!; // Navigation property to Accounts
        [Required]
        [MaxLength(34)] // IBAN can be up to 34 characters
        public required string ToIban { get; set; }
        [Required]
        [Column(TypeName = "decimal(15, 2)")]
        public Decimal Amount { get; set; }
        [Required]
        [MaxLength(3)]
        public string Currency { get; set; } = "SEK"; // default currency is SEK
        [Required]
        [MaxLength(100)]
        public required string Reference { get; set; } // Payment reference
        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = "pending_approval"; // default status is pending_approval
        public int CreatedByUserId { get; set; }
        public User CreatedByUser { get; set; } = null!; // Navigation property to Users
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow; // default to current UTC time
        public DateTime? ExecutedAt { get; set; } // null until the payment is executed


    }
}