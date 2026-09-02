using System;

public class ApprovalLimit
{
	public int id {  get; set; }
	public Tenant id { get; set; }
    public decimal MinAmount { get; set; }
	public int RequiredApprovals { get; set; }
	public string Description { get; set; } = string.Empty;
}
