using System;
using SebPortal.Api.Services;
using SebPortal.Models;

namespace SebPortal.Api.Repositories
{
	public interface IApprovalLimitRepository
	{
		Task<List<ApprovalLimit>> GetOrderedLimitsAsync(int tenantId);
		Task AddAsync(ApprovalLimit approvalLimit);
	}
}
