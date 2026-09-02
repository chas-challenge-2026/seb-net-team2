using System.ComponentModel.DataAnnotations;

namespace SebPortal.Models
{
    public class AuditEntries
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; } // Navigation property to Users
        [MaxLength(100)]
        public string Action {  get; set; }
        [MaxLength(50)]
        public string EntityType { get; set; }
        public int EntityId { get; set; }
        public string Description { get; set; }
        public DateTime DateTime { get; set; } = DateTime.Now;
    }
}