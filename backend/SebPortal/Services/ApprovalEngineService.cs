using SebPortal.Models;
using SebPortal.Data;
using SebPortal.Api.Repositories;

namespace SebPortal.Api.Services
{
    public class ApprovalEngineService : IApprovalEngineService
    {
        private readonly IApprovalLimitRepository _limitRepository;
        private readonly SebDbContext _context;

        public ApprovalEngineService(IApprovalLimitRepository limitRepository, SebDbContext context)
        {
            _limitRepository = limitRepository;
            _context = context;
        }

        public async Task<bool> ProcessPaymentApprovalAsync(Payment payment)
        {
            // get all approval limits for the tenant and order them by MinAmount
            var approvalLimit = await _limitRepository.GetOrderedLimitsAsync(payment.TenantId);

            // find the highest approval limit that is less than or equal to the payment amount
            var applicableLimit = approvalLimit
                .Where(limit => payment.Amount >= limit.MinAmount)
                .OrderByDescending(limit => limit.MinAmount)
                .FirstOrDefault();

            // if no applicable limit is found, execute the payment immediately
            if (applicableLimit == null || applicableLimit.RequiredApprovals == 0)
            {
                payment.Status = "completed";
                return false;
            }

            // if the payment amount is greater than or equal to the applicable limit, create approval steps
            payment.Status = "pending_approval";

            for (int stepNumber = 1; stepNumber <= applicableLimit.RequiredApprovals; stepNumber++)
            {
                var step = new ApprovalStep
                {
                    PaymentId = payment.Id,
                    StepNumber = stepNumber,
                    Status = "pending",
                };
                _context.ApprovalSteps.Add(step);
            }
            
            await _context.SaveChangesAsync();
            return true;

        }
    }
}

