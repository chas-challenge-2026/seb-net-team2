using System.ComponentModel.DataAnnotations;

namespace SebPortal.Models
{
    public class Tenant
    {
        public int Id { get; set; }
        [Required]
        [StringLength(100)]
        public string Name { get; set; }
    }
}