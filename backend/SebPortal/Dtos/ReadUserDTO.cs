using System.ComponentModel.DataAnnotations;

namespace SebPortal.Api.Dtos
{
    public class ReadUserDTO
    {
        public int Id { get; set; }
        public int TenantId { get; set; }
        public string Name { get; set; } = "";
        public string Email { get; set; } = "";
        public string Role { get; set; } = "";
    }
}
