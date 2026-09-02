namespace SebPortal.Api.Services
{
    public class ApprovalEngineService : IApprovalEngineService
    {
        private readonly IApprovalLimitRepository _limitRepository;

        public ApprovalEngineService(IApprovalLimitRepository limitRepository)
        {
            _limitRepository = limitRepository;
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
                payment.Status = "Executed";
                return false;
            }

            // if the payment amount is greater than or equal to the applicable limit, create approval steps
            payment.Status = "PendingApproval";

            for (int sequence = 1; sequence <= applicableLimit.RequiredApprovals; sequence++)
            {
                payment.ApprovalSteps.Add(new ApprovalStep
                {
                    PaymentId = payment.Id,
                    SequenceOrder = sequence,
                    Status = "Pending",
                    CreatedAt = DateTime.UtcNow
                });
            }

            return true;

        }
    }
}

