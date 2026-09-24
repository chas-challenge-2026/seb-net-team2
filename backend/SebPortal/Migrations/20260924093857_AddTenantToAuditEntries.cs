using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SebPortal.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTenantToAuditEntries : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "tenant_id",
                table: "audit_entries",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_audit_entries_tenant_id",
                table: "audit_entries",
                column: "tenant_id");

            migrationBuilder.AddForeignKey(
                name: "FK_audit_entries_tenants_tenant_id",
                table: "audit_entries",
                column: "tenant_id",
                principalTable: "tenants",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_audit_entries_tenants_tenant_id",
                table: "audit_entries");

            migrationBuilder.DropIndex(
                name: "IX_audit_entries_tenant_id",
                table: "audit_entries");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "audit_entries");
        }
    }
}
