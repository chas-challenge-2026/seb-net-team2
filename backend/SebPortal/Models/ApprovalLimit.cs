using System;
using System.ComponentModel.DataAnnotations;

namespace SebPortal.Models; 

public class ApprovalLimit
{
    [Key]
	public int Id {  get; set; }
	public int TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!; // Navigation property to Tenants
    public decimal MinAmount { get; set; }
	public int RequiredApprovals { get; set; }
	public string Description { get; set; } = string.Empty;

	public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
	public DateTime LastModifiedAt { get; set; } = DateTime.UtcNow;
	public string LastModifiedBy { get; set; } = string.Empty;
}
