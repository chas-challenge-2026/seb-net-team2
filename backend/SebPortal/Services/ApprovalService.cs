using SebPortal.Models;
using SebPortal.Api.Dtos;
using SebPortal.Api.Repositories;
using SebPortal.Data;
using Microsoft.EntityFrameworkCore;
using SebPortal.Api.Authorization;

namespace SebPortal.Api.Services
{
    public class ApprovalService : IApprovalService
    {
        private static readonly string[] ValidDecisions = { "approved", "rejected" };

        private readonly IApprovalRepository _approvalRepository;
        private readonly IPaymentRepository _paymentRepository;
        private readonly IAccountRepository _accountRepository;
        private readonly IAuditRepository _auditRepository;
        private readonly SebDbContext _context;
        private readonly INotificationService _notificationService;

        public ApprovalService(
            IApprovalRepository approvalRepository,
            IPaymentRepository paymentRepository,
            IAccountRepository accountRepository,
            IAuditRepository auditRepository,
            SebDbContext context,
            INotificationService notificationService)
        {
            _approvalRepository = approvalRepository;
            _paymentRepository = paymentRepository;
            _accountRepository = accountRepository;
            _auditRepository = auditRepository;
            _context = context;
            _notificationService = notificationService;
        }

        // This method handles the decision-making process for an approval step.
        public async Task<ApprovalStepValidationResult> DecideAsync(ApprovalDecisionDTO dto, int currentUserId, bool isAdmin, int tenantId)
        {
            // Validate the decision provided in the DTO
            if (!ValidDecisions.Contains(dto.Decision))
                return ApprovalStepValidationResult.InvalidDecision;

            // Retrieve the approval step from the repository using the provided StepId
            var approvalStep = await _approvalRepository.GetApprovalStepByIdAsync(dto.StepId, tenantId);
            if (approvalStep == null)
                return ApprovalStepValidationResult.StepNotFound;

            // Retrieve the associated payment for the approval step
            var validation = ValidateApprovalStep(approvalStep.Payment, approvalStep, currentUserId, isAdmin);
            if (validation != ApprovalStepValidationResult.Valid)
                return validation;

            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                approvalStep.Status = dto.Decision;
                approvalStep.DecidedAt = DateTime.UtcNow;
                approvalStep.Comment = dto.Comment;

                // Update the approval step in the repository and check if it was saved successfully
                var saved = await _approvalRepository.UpdateApprovalStepAsync(approvalStep, tenantId);
                if (!saved)
                {
                    await transaction.RollbackAsync();
                    return ApprovalStepValidationResult.StepAlreadyDecided;
                }

                var payment = approvalStep.Payment;
                var steps = await _approvalRepository.GetApprovalStepsByPaymentIdAsync(approvalStep.PaymentId, tenantId);

                await _auditRepository.AddEntryAsync(new AuditEntries
                {
                    TenantId = payment.TenantId,
                    UserId = currentUserId,
                    Action = dto.Decision == "approved" ? AuditActions.ApproveStep : AuditActions.RejectStep,
                    EntityType = AuditEntityTypes.Payment,
                    EntityId = approvalStep.PaymentId,
                    Description = $"Steg {approvalStep.StepNumber} för betalning {approvalStep.PaymentId} {(dto.Decision == "approved" ? "godkändes" : "avslogs")}",
                    Details = AuditEntries.ToDetailsJson(new
                    {
                        stepId = approvalStep.Id,
                        approvalStep.StepNumber,
                        totalSteps = steps.Count(),
                        decision = dto.Decision,
                        dto.Comment,
                        payment.Amount,
                        payment.Currency
                    })
                });

                if (dto.Decision == "approved")
                {
                    var stillPending = steps.Any(s => s.Status == "pending");

                    if (!stillPending)
                    {
                        await _paymentRepository.CompletePaymentAsync(approvalStep.PaymentId, payment.TenantId );

                        await _auditRepository.AddEntryAsync(new AuditEntries
                        {
                            TenantId = payment.TenantId,
                            UserId = currentUserId,
                            Action = AuditActions.ExecutePayment,
                            EntityType = AuditEntityTypes.Payment,
                            EntityId = approvalStep.PaymentId,
                            Description = $"Betalning {approvalStep.PaymentId} genomfördes: {payment.Amount} {payment.Currency} till {payment.ToIban}",
                            Details = AuditEntries.ToDetailsJson(new
                            {
                                payment.Amount,
                                payment.Currency,
                                payment.FromAccountId,
                                payment.ToIban,
                                payment.Reference,
                                status = "completed",
                                automatic = false
                            })
                        });
                    }
                }
                else
                {
                    await _paymentRepository.RejectPaymentAsync(approvalStep.PaymentId, payment.TenantId);

                    await _accountRepository.RefundAsync(payment.FromAccountId, payment.Amount, payment.TenantId);

                    await _auditRepository.AddEntryAsync(new AuditEntries
                    {
                        TenantId = payment.TenantId,
                        UserId = currentUserId,
                        Action = AuditActions.RejectPayment,
                        EntityType = AuditEntityTypes.Payment,
                        EntityId = approvalStep.PaymentId,
                        Description = $"Betalning {approvalStep.PaymentId} avslogs och {payment.Amount} {payment.Currency} återfördes till konto {payment.FromAccountId}",
                        Details = AuditEntries.ToDetailsJson(new
                        {
                            payment.Amount,
                            payment.Currency,
                            payment.FromAccountId,
                            refundedAmount = payment.Amount,
                            status = "rejected",
                            rejectedAtStep = approvalStep.StepNumber
                        })
                    });

                    ////if payment is rejected, notify initiator
                    var notificationDTO = new NotificationMessageDTO
                    {
                        TenantId = payment.TenantId,
                        RecipientEmail = payment.CreatedByUser.Email,
                        Subject = "Betalning avslagen",
                        Message = $"Betalningen med referens '{payment.Reference}' har avslagits."
                    };

                    await _notificationService.SendNotificationMessageAsync(notificationDTO);
                }

                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }

            return ApprovalStepValidationResult.Valid;
        }

        // This method validates the approval step against the payment and the current user.
        public ApprovalStepValidationResult ValidateApprovalStep(Payment payment, ApprovalStep approvalStep, int currentUserId, bool isAdmin)
        {
            // Validate that the approval step belongs to the payment
            if (approvalStep.PaymentId != payment.Id)
                return ApprovalStepValidationResult.StepDoesNotBelongToPayment;
            // Validate that the payment is pending approval
            if (payment.Status != "pending_approval")
                return ApprovalStepValidationResult.PaymentNotPendingApproval;
            // Validate that the approval step is pending and not already decided
            if (approvalStep.Status != "pending" || approvalStep.DecidedAt != null)
                return ApprovalStepValidationResult.StepAlreadyDecided;
            // Validate that the current user is not the one who created the payment
            if (payment.CreatedByUserId == currentUserId)
                return ApprovalStepValidationResult.CannotApproveOwnPayment;
            // Validate that the current user is the assigned attestant for the approval step
            if (approvalStep.AttestantId != currentUserId && !isAdmin)
                return ApprovalStepValidationResult.NotAssignedAttestant;

            return ApprovalStepValidationResult.Valid;
        }

        public Task<ApprovalStep?> GetApprovalStepByIdAsync(int id, int tenantId)
        {
            return _approvalRepository.GetApprovalStepByIdAsync(id, tenantId);
        }

        public Task<IEnumerable<ApprovalStep>> GetApprovalStepsByPaymentIdAsync(int paymentId, int tenantId)
        {
            return _approvalRepository.GetApprovalStepsByPaymentIdAsync(paymentId, tenantId);
        }

        public Task<bool> UpdateApprovalStepAsync(ApprovalStep approvalStep, int tenantId)
        {
            return _approvalRepository.UpdateApprovalStepAsync(approvalStep, tenantId);
        }

        public Task<IEnumerable<ApprovalStep>> GetPendingStepsForAttestantAsync(int paymentId, int attestantId, int tenantId)
        {
            return _approvalRepository.GetPendingStepsForAttestantAsync(paymentId, attestantId, tenantId);
        }

        public async Task<IEnumerable<PendingApprovalStepDTO>> GetPendingStepsForAttestantAsync(int attestantId, int tenantId)
        {
            var steps = await _approvalRepository.GetPendingStepsForAttestantAsync(attestantId, tenantId);

            return steps.Select(step => new PendingApprovalStepDTO
            {
                StepId = step.Id,
                StepNumber = step.StepNumber,
                PaymentId = step.PaymentId,
                Amount = step.Payment.Amount,
                Currency = step.Payment.Currency,
                ToIban = step.Payment.ToIban,
                Reference = step.Payment.Reference,
                CreatedByUserId = step.Payment.CreatedByUserId,
                CreatedByUserName = step.Payment.CreatedByUser.Name,
                PaymentCreatedAt = step.Payment.CreatedAt
            });
        }

        public async Task<IEnumerable<PendingApprovalStepDTO>> GetPendingStepsForTenantAsync(int tenantId)
        {
            var allTenantsteps = await _approvalRepository.GetPendingStepsForTenantAsync(tenantId);
            return allTenantsteps.Select(step => new PendingApprovalStepDTO
            {
                StepId = step.Id,
                StepNumber = step.StepNumber,
                PaymentId = step.PaymentId,
                Amount = step.Payment.Amount,
                Currency = step.Payment.Currency,
                ToIban = step.Payment.ToIban,
                Reference = step.Payment.Reference,
                CreatedByUserId = step.Payment.CreatedByUserId,
                CreatedByUserName = step.Payment.CreatedByUser.Name,
                PaymentCreatedAt = step.Payment.CreatedAt
            });
        }
    }
}
