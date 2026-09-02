using System;

public class ApprovalLimit
{
	public int Id {  get; set; }
	public int TenantId { get; set; }
    public decimal MinAmount { get; set; }
	public int RequiredApprovals { get; set; }
	public string Description { get; set; } = string.Empty;

	public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
	public DateTime LastModifiedAt { get; set; } = DateTime.UtcNow;
	public string LastModifiedBy { get; set; } = string.Empty;
}
