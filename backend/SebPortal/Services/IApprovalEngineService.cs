using SebPortal.Models;
using System;

namespace SebPortal.Api.Services
{
	public interface IApprovalEngineService
	{
		Task<bool> ProcessPaymentApprovalAsync(Payment payment);
	}
}


