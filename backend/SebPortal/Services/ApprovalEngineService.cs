using SebPortal.Models;
using SebPortal.Data;
using SebPortal.Api.Repositories;

namespace SebPortal.Api.Services
{
    public class ApprovalEngineService : IApprovalEngineService
    {
        private readonly IApprovalLimitRepository _limitRepository;
        private readonly IUserRepository _userRepository;
        private readonly SebDbContext _context;

        public ApprovalEngineService(IApprovalLimitRepository limitRepository, IUserRepository userRepository, SebDbContext context)
        {
            _limitRepository = limitRepository;
            _userRepository = userRepository;
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

            var attestants = (await _userRepository.GetAttestantsByTenantIdAsync(payment.TenantId)).ToList();
            if (attestants.Count == 0)
            {
                throw new InvalidOperationException($"Ingen attestant hittades för tenant {payment.TenantId}.");
            }

            for (int stepNumber = 1; stepNumber <= applicableLimit.RequiredApprovals; stepNumber++)
            {
                var attestant = attestants[(stepNumber - 1) % attestants.Count];
                var step = new ApprovalStep
                {

                    Payment = payment,
                    StepNumber = stepNumber,
                    Status = "pending",
                    AttestantId = attestant.Id,
                };
                _context.ApprovalSteps.Add(step);
            }
            return true;

        }
    }
}

