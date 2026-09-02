using System;

public interface IApprovalLimitRepository
{
	/// <summary>
	/// Get all approval limits in rising order after MinAmount
	/// </summary>
	/// 
	Task<List<ApprovalLimit>> GetOrderedLimitsAsync(int tenantId);
	Task AddAsync(ApprovalLimit approvalLimit);
}
