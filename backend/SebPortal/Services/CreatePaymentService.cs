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
        private readonly SebDbContext _context;

        public CreatePaymentService(IUserRepository userRepository, IPaymentRepository paymentRepository, IApprovalEngineService approvalEngineService, SebDbContext context)
        {
            _userRepository = userRepository;
            _paymentRepository = paymentRepository;
            _approvalEngineService = approvalEngineService;
            _context = context;
        }

        public async Task<Payment> CreatePaymentAsync(CreatePaymentDTO createPaymentDTO, int userId)
        {
            //Starts transaction
            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var user = await _userRepository.GetUserByIdAsync(userId);

                if (user == null)
                {
                    throw new UnauthorizedAccessException("User not found or unauthorized.");
                }

                if (createPaymentDTO.Amount <= 0)
                {
                    throw new ArgumentException("Amount must be greater than zero.");
                }

                // Check if the account exists and has sufficient balance, and update the balance atomically
                var affectedRows = await _context.Accounts
                    .Where(a =>
                        a.Id == createPaymentDTO.FromAccountId &&
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
                    FromAccountId = createPaymentDTO.FromAccountId,
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

                await transaction.CommitAsync();

                return payment;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<Payment?> GetPaymentById(int paymentId)
        {
            var payment = await _paymentRepository.GetPaymentByIdAsync(paymentId);
            return payment;
        }
    }
}
