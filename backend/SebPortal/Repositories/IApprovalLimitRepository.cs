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
		Task<List<ApprovalLimit>> GetOrderedLimitsAsync(int tenantId);
		Task AddAsync(ApprovalLimit approvalLimit);
	}
}
