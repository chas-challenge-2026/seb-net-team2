using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SebPortal.Models
{
    public class Account
    {
        public int Id { get; set; }
        public int TenantId { get; set; }
        public Tenant Tenant { get; set; } // Navigation property to Tenants
        [Required]
        [MaxLength(100)]
        public string AccountName { get; set; }
        [Required]
        [MaxLength(34)]
        public string Iban { get; set; }
        [Column(TypeName = "decimal(15,2)")]
        public decimal Balance { get; set; } = 0;
        [Required]
        [MaxLength(3)]
        public string Currency { get; set; } = "SEK"; // default currency is SEK
    }
}
