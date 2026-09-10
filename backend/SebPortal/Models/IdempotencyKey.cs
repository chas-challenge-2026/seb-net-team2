using System.ComponentModel.DataAnnotations;

namespace SebPortal.Models
{
    public class IdempotencyKey
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public required string Key { get; set; }

        [Required]
        [MaxLength(64)]
        public required string RequestHash { get; set; }

        public string? ResponseContent { get; set; }

        public int? StatusCode { get; set; }
        public string? ResponseLocation { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}