using SebPortal.Models;
using System;

namespace SebPortal.Api.Services
{
	public interface IApprovalEngineService
	{
		/// <summary>
		/// Evaluate payment and create neccesary ApprovalSteps.
		/// Returns 'true' if the payment needs attest (PendingApproval)
		/// or 'false' if it can be done imidietly (Executed).
		/// </summary>

		Task<bool> ProcessPaymentApprovalAsync(Payment payment);
	}
}


