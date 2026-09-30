using System.ComponentModel.DataAnnotations;

namespace SebPortal.Models
{
    public class Tenant
    {
        public int Id { get; set; }
        [Required]
        [StringLength(100)]
        public required string Name { get; set; }
    }
}