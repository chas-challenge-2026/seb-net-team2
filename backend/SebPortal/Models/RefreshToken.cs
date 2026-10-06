namespace SebPortal.Models
{
    public class RefreshToken
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        public required string TokenHash { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime ExpiresAt { get; set; }

        public DateTime? RevokedAt { get; set; }

        public int? ReplacedByTokenId { get; set; }

        public User? User { get; set; }
    }
}