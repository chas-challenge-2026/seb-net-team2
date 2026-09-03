using System.ComponentModel.DataAnnotations;

namespace SebPortal.Models
{
    public class AuditEntries
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; } = null!; // Navigation property to Users
        [Required]
        [MaxLength(100)]
        public required string Action {  get; set; }
        [Required]
        [MaxLength(50)]
        public required string EntityType { get; set; }
        public int EntityId { get; set; }
        [Required]
        public required string Description { get; set; }
        public DateTime DateTime { get; set; } = DateTime.Now;
    }
}