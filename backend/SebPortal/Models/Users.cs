

using System.ComponentModel.DataAnnotations;

namespace SebPortal.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }
        public int TenantId { get; set; }
        public Tenant Tenant { get; set; } = null!; // Navigation property to Tenants
        [Required]
        [StringLength(100)]
        public required string Name { get; set; }
        [Required]
        [EmailAddress]
        [MaxLength(100)]
        public required string Email { get; set; }
        [Required]
        [MaxLength(60)]
        public required string PasswordHash { get; set; }
        [Required]
        [MaxLength(20)]
        public required string Role { get; set; }
    }
}