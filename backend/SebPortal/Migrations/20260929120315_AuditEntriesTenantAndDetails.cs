using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SebPortal.Api.Migrations
{
    /// <inheritdoc />
    public partial class AuditEntriesTenantAndDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // tenant_id, dess index och FK läggs till av AddTenantToAuditEntries.
            // Här byts FK:erna till Restrict och det enkla tenant-indexet ersätts
            // av det sammansatta (tenant_id, created_at).
            migrationBuilder.DropForeignKey(
                name: "FK_audit_entries_tenants_tenant_id",
                table: "audit_entries");

            migrationBuilder.DropForeignKey(
                name: "FK_audit_entries_users_user_id",
                table: "audit_entries");

            migrationBuilder.DropIndex(
                name: "IX_audit_entries_tenant_id",
                table: "audit_entries");

            migrationBuilder.AddColumn<string>(
                name: "details",
                table: "audit_entries",
                type: "jsonb",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_audit_entries_entity_type_entity_id",
                table: "audit_entries",
                columns: new[] { "entity_type", "entity_id" });

            migrationBuilder.CreateIndex(
                name: "IX_audit_entries_tenant_id_created_at",
                table: "audit_entries",
                columns: new[] { "tenant_id", "created_at" });

            migrationBuilder.AddForeignKey(
                name: "FK_audit_entries_tenants_tenant_id",
                table: "audit_entries",
                column: "tenant_id",
                principalTable: "tenants",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_audit_entries_users_user_id",
                table: "audit_entries",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_audit_entries_tenants_tenant_id",
                table: "audit_entries");

            migrationBuilder.DropForeignKey(
                name: "FK_audit_entries_users_user_id",
                table: "audit_entries");

            migrationBuilder.DropIndex(
                name: "IX_audit_entries_entity_type_entity_id",
                table: "audit_entries");

            migrationBuilder.DropIndex(
                name: "IX_audit_entries_tenant_id_created_at",
                table: "audit_entries");

            migrationBuilder.DropColumn(
                name: "details",
                table: "audit_entries");

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

            migrationBuilder.AddForeignKey(
                name: "FK_audit_entries_users_user_id",
                table: "audit_entries",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
