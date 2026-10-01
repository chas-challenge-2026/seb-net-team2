using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace SebPortal.Models
{
    public class AuditEntries
    {
        private static readonly JsonSerializerOptions DetailsJsonOptions = new(JsonSerializerDefaults.Web);

        public int Id { get; set; }
        public int TenantId { get; set; }
        public Tenant Tenant { get; set; } = null!; // Navigation property to Tenants
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
        // Snapshot (JSON) of the relevant values at the time of the event, e.g. amount, account, IBAN.
        // Stored as a snapshot so the history stays correct even if the referenced rows change later.
        public string? Details { get; set; }
        public DateTime DateTime { get; set; } = DateTime.UtcNow;

        // Serializes a details object to camelCase JSON for the Details column.
        public static string ToDetailsJson(object details) => JsonSerializer.Serialize(details, DetailsJsonOptions);
    }
}
