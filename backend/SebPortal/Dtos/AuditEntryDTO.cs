using System.Text.Json;

namespace SebPortal.Api.Dtos
{
    public class AuditEntryDTO
    {
        public int Id { get; set; }
        public DateTime TimeStamp { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string EntityType { get; set; } = string.Empty;
        public int EntityId { get; set; }
        public string Description { get; set; } = string.Empty;
        public JsonElement? Details { get; set; }
    }
}
