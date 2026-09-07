using Microsoft.EntityFrameworkCore;
using SebPortal.Models;

namespace SebPortal.Data
{
    public class SebDbContext : DbContext
    {
        public SebDbContext(DbContextOptions<SebDbContext> options) : base(options)
        {
        }

        public DbSet<Tenant> Tenants => Set<Tenant>();
        public DbSet<User> Users => Set<User>();
        public DbSet<Account> Accounts => Set<Account>();
        public DbSet<Payment> Payments => Set<Payment>();
        public DbSet<ApprovalStep> ApprovalSteps => Set<ApprovalStep>();
        public DbSet<AuditEntries> AuditEntries => Set<AuditEntries>();
        public DbSet<ApprovalLimit> ApprovalLimits => Set<ApprovalLimit>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // seed.sql använder snake_case kolumn-/tabellnamn — utan den här mappningen
            // letar EF efter t.ex. "TenantId" och hittar aldrig "tenant_id".
            modelBuilder.Entity<Tenant>(e =>
            {
                e.ToTable("tenants");
                e.Property(x => x.Id).HasColumnName("id");
                e.Property(x => x.Name).HasColumnName("name");
            });

            modelBuilder.Entity<User>(e =>
            {
                e.ToTable("users");
                e.Property(x => x.Id).HasColumnName("id");
                e.Property(x => x.TenantId).HasColumnName("tenant_id");
                e.Property(x => x.Name).HasColumnName("name");
                e.Property(x => x.Email).HasColumnName("email");
                e.Property(x => x.PasswordHash).HasColumnName("password_hash");
                e.Property(x => x.Role).HasColumnName("role");

                e.HasIndex(x => x.Email).IsUnique();

                e.HasOne(x => x.Tenant)
                 .WithMany()
                 .HasForeignKey(x => x.TenantId);
            });

            modelBuilder.Entity<Account>(e =>
            {
                e.ToTable("accounts");
                e.Property(x => x.Id).HasColumnName("id");
                e.Property(x => x.TenantId).HasColumnName("tenant_id");
                e.Property(x => x.AccountName).HasColumnName("account_name");
                e.Property(x => x.Iban).HasColumnName("iban");
                e.Property(x => x.Balance).HasColumnName("balance");
                e.Property(x => x.Currency).HasColumnName("currency");

                e.HasOne(x => x.Tenant)
                 .WithMany()
                 .HasForeignKey(x => x.TenantId);
            });

            modelBuilder.Entity<Payment>(e =>
            {
                e.ToTable("payments");
                e.Property(x => x.Id).HasColumnName("id");
                e.Property(x => x.TenantId).HasColumnName("tenant_id");
                e.Property(x => x.FromAccountId).HasColumnName("from_account_id");
                e.Property(x => x.ToIban).HasColumnName("to_iban");
                e.Property(x => x.Amount).HasColumnName("amount");
                e.Property(x => x.Currency).HasColumnName("currency");
                e.Property(x => x.Reference).HasColumnName("reference");
                e.Property(x => x.Status).HasColumnName("status");
                e.Property(x => x.CreatedByUserId).HasColumnName("created_by");
                e.Property(x => x.CreatedAt).HasColumnName("created_at");
                e.Property(x => x.ExecutedAt).HasColumnName("executed_at");

                // Restrict istället för cascade delete på finansiella poster — att radera
                // en användare eller ett konto ska aldrig kunna svepa med sig betalningshistorik.
                e.HasOne(x => x.Tenant).WithMany().HasForeignKey(x => x.TenantId).OnDelete(DeleteBehavior.Restrict);
                e.HasOne(x => x.FromAccount).WithMany().HasForeignKey(x => x.FromAccountId).OnDelete(DeleteBehavior.Restrict);
                e.HasOne(x => x.CreatedByUser).WithMany().HasForeignKey(x => x.CreatedByUserId).OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<ApprovalStep>(e =>
            {
                e.ToTable("approval_steps");
                e.Property(x => x.Id).HasColumnName("id");
                e.Property(x => x.PaymentId).HasColumnName("payment_id");
                e.Property(x => x.AttestantId).HasColumnName("attestant_id");
                e.Property(x => x.StepNumber).HasColumnName("step_number");
                e.Property(x => x.Status).HasColumnName("status");
                e.Property(x => x.DecidedAt).HasColumnName("decided_at");
                e.Property(x => x.Comment).HasColumnName("comment");

                e.HasOne(x => x.Payment).WithMany().HasForeignKey(x => x.PaymentId).OnDelete(DeleteBehavior.Restrict);
                e.HasOne(x => x.Attestant).WithMany().HasForeignKey(x => x.AttestantId).OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<AuditEntries>(e =>
            {
                e.ToTable("audit_entries");
                e.Property(x => x.Id).HasColumnName("id");
                e.Property(x => x.UserId).HasColumnName("user_id");
                e.Property(x => x.Action).HasColumnName("action");
                e.Property(x => x.EntityType).HasColumnName("entity_type");
                e.Property(x => x.EntityId).HasColumnName("entity_id");
                e.Property(x => x.Description).HasColumnName("description");
                e.Property(x => x.DateTime).HasColumnName("created_at");
            });

            modelBuilder.Entity<ApprovalLimit>(e =>
            {
                e.ToTable("approvalLimit");
                e.Property(x => x.Id).HasColumnName("id");
                e.Property(x => x.TenantId).HasColumnName("tenant_id");
                e.Property(x => x.MinAmount).HasColumnName("minAmount");
                e.Property(x => x.RequiredApprovals).HasColumnName("requiredApprovals");
                e.Property(x => x.Description).HasColumnName("description");
                e.Property(x => x.CreatedAt).HasColumnName("created_at");
                e.Property(x => x.LastModifiedAt).HasColumnName("lastModified_at");
                e.Property(x => x.LastModifiedBy).HasColumnName("lastModified_by");

                e.HasOne(x => x.Tenant)
                 .WithMany()
                 .HasForeignKey(x => x.TenantId);
            });
        }
    }
}
