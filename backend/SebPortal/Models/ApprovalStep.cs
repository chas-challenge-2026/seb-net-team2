using System.ComponentModel.DataAnnotations;

namespace SebPortal.Models
    {
    public class ApprovalStep
    {
        public int Id { get; set; }
        public int PaymentId { get; set; }
        public Payment Payment { get; set; } = null!; // Navigation property to Payments
        public int AttestantId { get; set; }
        public User Attestant { get; set; } = null!; // Navigation property to Users
        public int StepNumber { get; set; } = 1; // default set to 1
        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "pending"; // Default pending
        public DateTime? DecidedAt { get; set; } // null until the attestant has decided
        [MaxLength(255)]
        public string? Comment { get; set; }
    }
}