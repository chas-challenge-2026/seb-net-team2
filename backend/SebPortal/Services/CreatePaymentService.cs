using Microsoft.EntityFrameworkCore;
using SebPortal.Api.Dtos;
using SebPortal.Api.Repositories;
using SebPortal.Data;
using SebPortal.Models;
using SebPortal.Api.Middleware;
using System.Diagnostics;

namespace SebPortal.Api.Services
{
    public class CreatePaymentService : ICreatePaymentService
    {
        private readonly IUserRepository _userRepository;
        private readonly IPaymentRepository _paymentRepository;
        private readonly IApprovalEngineService _approvalEngineService;
        private readonly INotificationService _notificationService;
        private readonly IAuditRepository _auditRepository;
        private readonly SebDbContext _context;

        public CreatePaymentService(IUserRepository userRepository, IPaymentRepository paymentRepository, IApprovalEngineService approvalEngineService, INotificationService notificationService, IAuditRepository auditRepository, SebDbContext context)
        {
            _userRepository = userRepository;
            _paymentRepository = paymentRepository;
            _approvalEngineService = approvalEngineService;
            _notificationService = notificationService;
            _auditRepository = auditRepository;
            _context = context;
        }

        public async Task<Payment> CreatePaymentAsync(CreatePaymentDTO createPaymentDTO, int userId, int tenantId)
        {
            //Starts transaction
            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var user = await _userRepository.GetUserByIdAsync(userId, tenantId);

                if (user == null)
                {
                    throw new UnauthorizedAccessException("User not found or unauthorized.");
                }

                if (createPaymentDTO.Amount <= 0)
                {
                    throw new ArgumentException("Amount must be greater than zero.");
                }

                var fromAccount = await _context.Accounts
                    .FirstOrDefaultAsync(a => a.PublicId == createPaymentDTO.FromAccountId && a.TenantId == user.TenantId);

                if (fromAccount == null)
                {
                    throw new InvalidOperationException("Account not found or insufficient balance.");
                }

                // Check if the account exists and has sufficient balance, and update the balance atomically
                var affectedRows = await _context.Accounts
                    .Where(a =>
                        a.Id == fromAccount.Id &&
                        a.TenantId == user.TenantId &&
                        a.Balance >= createPaymentDTO.Amount)
                    .ExecuteUpdateAsync(setters => setters
                        .SetProperty(
                            a => a.Balance,
                            a => a.Balance - createPaymentDTO.Amount));

                if (affectedRows == 0)
                {
                    throw new InvalidOperationException("Account not found or insufficient balance.");
                }

                var payment = new Payment
                {
                    TenantId = user.TenantId,
                    FromAccountId = fromAccount.Id,
                    FromAccount = fromAccount,
                    ToIban = createPaymentDTO.ToIban,
                    Amount = createPaymentDTO.Amount,
                    Currency = createPaymentDTO.Currency,
                    Reference = createPaymentDTO.Reference,
                    Status = "pending_approval",
                    CreatedByUserId = userId,
                    CreatedAt = DateTime.UtcNow
                };

                await _approvalEngineService.ProcessPaymentApprovalAsync(payment);

                _context.Payments.Add(payment);

                await _context.SaveChangesAsync();

                await LogPaymentCreatedAsync(payment, userId);

                await transaction.CommitAsync();

                var notificationDTO = new NotificationMessageDTO
                {
                    TenantId = user.TenantId,
                    RecipientEmail = "attestant@seb.se", //change later
                    Subject = "Attest krävs",
                    Message = "En ny betalning har skapats och väntar på din attestering."
                };

                await _notificationService.SendNotificationMessageAsync(notificationDTO);

                return payment;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // Writes CREATE_PAYMENT (and EXECUTE_PAYMENT if no approval was required) inside the caller's transaction.
        private async Task LogPaymentCreatedAsync(Payment payment, int userId)
        {
            var account = await _context.Accounts
                .AsNoTracking()
                .Where(a => a.Id == payment.FromAccountId)
                .Select(a => new { a.AccountName, a.Iban, a.Balance })
                .SingleAsync();

            var attestants = await _context.ApprovalSteps
                .AsNoTracking()
                .Where(s => s.PaymentId == payment.Id)
                .OrderBy(s => s.StepNumber)
                .Select(s => new { s.StepNumber, s.AttestantId, attestantName = s.Attestant.Name })
                .ToListAsync();

            await _auditRepository.AddEntryAsync(new AuditEntries
            {
                TenantId = payment.TenantId,
                UserId = userId,
                Action = AuditActions.CreatePayment,
                EntityType = AuditEntityTypes.Payment,
                EntityId = payment.Id,
                Description = $"Skapade betalning {payment.Amount} {payment.Currency} till {payment.ToIban}",
                Details = AuditEntries.ToDetailsJson(new
                {
                    payment.Amount,
                    payment.Currency,
                    payment.FromAccountId,
                    fromAccountName = account.AccountName,
                    fromIban = account.Iban,
                    balanceAfter = account.Balance,
                    payment.ToIban,
                    payment.Reference,
                    payment.Status,
                    requiredApprovals = attestants.Count,
                    attestants
                })
            });

            if (payment.Status == "completed")
            {
                await _auditRepository.AddEntryAsync(new AuditEntries
                {
                    TenantId = payment.TenantId,
                    UserId = userId,
                    Action = AuditActions.ExecutePayment,
                    EntityType = AuditEntityTypes.Payment,
                    EntityId = payment.Id,
                    Description = $"Betalning {payment.Id} genomfördes direkt (under attestgräns): {payment.Amount} {payment.Currency} till {payment.ToIban}",
                    Details = AuditEntries.ToDetailsJson(new
                    {
                        payment.Amount,
                        payment.Currency,
                        payment.FromAccountId,
                        payment.ToIban,
                        payment.Reference,
                        status = "completed",
                        automatic = true
                    })
                });
            }
        }

        public async Task<Payment?> GetPaymentById(Guid paymentId, int tenantId)
        {
            var payment = await _paymentRepository.GetByPublicIdAsync(paymentId, tenantId);
            return payment;
        }

        public Task<IEnumerable<Payment>> GetPaymentsByUserId(int userId, int tenantId)
        {
            return _paymentRepository.GetPaymentsByUserIdAsync(userId, tenantId);
        }
    }
}
