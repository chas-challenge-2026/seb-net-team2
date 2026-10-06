using Microsoft.EntityFrameworkCore;
using SebPortal.Data;
using SebPortal.Models;

namespace SebPortal.Api.Repositories
{
    public class PaymentRepository : IPaymentRepository
    {
        private readonly SebDbContext _context;

        public PaymentRepository(SebDbContext context)
        {
            _context = context;
        }

        public async Task<Payment> CreatePaymentAsync(Payment payment)
        {
            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();
            return payment;
        }

        public async Task<Payment?> GetPaymentByIdAsync(int paymentId, int tenantId)
        {
            return await _context.Payments.Include(p => p.Tenant)
                .Include(p => p.FromAccount)
                .Include(p => p.CreatedByUser)
                .FirstOrDefaultAsync(p => p.Id == paymentId && p.TenantId == tenantId);
        }

        public async Task<IEnumerable<Payment>> GetPaymentsByUserIdAsync(int userId, int tenantId)
        {
            var payments = await _context.Payments.Include(p => p.Tenant)
                .Include(p => p.FromAccount)
                .Include(p => p.CreatedByUser)
                .Where(p => p.CreatedByUserId == userId && p.TenantId == tenantId)
                .ToListAsync();

            return payments.AsEnumerable();
        }

        public async Task UpdatePaymentStatusAsync(int paymentId, string status, int tenantId)
        {
            var payment = await _context.Payments.FirstOrDefaultAsync(p => p.Id == paymentId && p.TenantId == tenantId);
            if (payment != null)
            {
                payment.Status = status;
                await _context.SaveChangesAsync();
            }
        }

        public async Task CompletePaymentAsync(int paymentId, int tenantId)
        {
            await _context.Payments
                .Where(p => p.Id == paymentId && p.Status == "pending_approval" && p.TenantId == tenantId)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(p => p.Status, "completed")
                    .SetProperty(p => p.ExecutedAt, DateTime.UtcNow));
        }

        public async Task RejectPaymentAsync(int paymentId, int tenantId)
        {
            await _context.Payments
                .Where(p => p.Id == paymentId && p.Status == "pending_approval" && p.TenantId == tenantId)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(p => p.Status, "rejected"));
        }
    }
}
