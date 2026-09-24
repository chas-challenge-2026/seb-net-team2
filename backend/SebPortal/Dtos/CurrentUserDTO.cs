namespace SebPortal.Api.Dtos
{
    public class CurrentUserDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public int TenantId { get; set; }
        public string TenantName { get; set; } = string.Empty;
        public int PendingApprovalsCount { get; set; }

    }
}
