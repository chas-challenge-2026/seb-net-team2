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
                payment.ExecutedAt = DateTime.UtcNow;
                return false;
            }

            // if the payment amount is greater than or equal to the applicable limit, create approval steps
            payment.Status = "pending_approval";

            // the payment's creator can never be its own attestant, so they are excluded
            // from the pool before checking availability and assigning steps
            var attestants = (await _userRepository.GetAttestantsByTenantIdAsync(payment.TenantId))
                .Where(a => a.Id != payment.CreatedByUserId)
                .ToList();

            if (attestants.Count == 0)
            {
                throw new InvalidOperationException($"Ingen attestant hittades för tenant {payment.TenantId}.");
            }

            // there must be at least as many distinct attestants (excluding the payment's creator)
            // as required approvals, otherwise the same person could satisfy the multi-approval requirement alone
            if (attestants.Count < applicableLimit.RequiredApprovals)
            {
                throw new InvalidOperationException(
                    $"Endast {attestants.Count} attestant(er) tillgängliga (exklusive betalningens skapare) för tenant {payment.TenantId}, men {applicableLimit.RequiredApprovals} krävs för betalningar över {applicableLimit.MinAmount}.");
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

