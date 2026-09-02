

using System.ComponentModel.DataAnnotations;

namespace SebPortal.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }
        public int TenantId { get; set; }
        public Tenant Tenant { get; set; } // Navigation property to Tenants
        [Required]
        [StringLength(100)]
        public string Name { get; set; }
        [Required]
        [EmailAddress]
        [MaxLength(100)]
        public string Email { get; set; }
        [Required]
        [MaxLength(60)]
        public string PasswordHash { get; set; }
        [Required]
        [MaxLength(20)]
        public string Role { get; set; }
    }
}