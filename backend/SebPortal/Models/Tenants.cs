using System.ComponentModel.DataAnnotations;

namespace SebPortal.Models
{
    public class Tenants
    {
        public int Id { get; set; }
        [Required]
        [StringLength(100)]
        public string Name { get; set; }
    }
}