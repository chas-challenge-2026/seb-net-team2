using System;
using SebPortal.Api.Services;
using SebPortal.Models;

namespace SebPortal.Api.Repositories
{
	public interface IApprovalLimitRepository
	{
		/// <summary>
		/// Get all approval limits in rising order after MinAmount
		/// </summary>
		/// 
		Task<IEnumerable<ApprovalLimit>> GetOrderedLimitsAsync(int tenantId);
        Task<ApprovalLimit?> GetByIdAsync(int id, int tenantId); 
		Task<ApprovalLimit> CreateApprovalLimitAsync(ApprovalLimit approvalLimit);
        Task<ApprovalLimit> UpdateApprovalLimitAsync(ApprovalLimit approvalLimit);
		Task<bool> DeleteApprovalLimitAsync(ApprovalLimit approvalLimit);
	}
}