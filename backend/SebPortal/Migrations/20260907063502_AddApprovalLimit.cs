// Migration: AddApprovalLimit
// Creates the `approvalLimit` table used to store tenant-specific approval thresholds.
// Contains columns for min amount, required approvals and audit fields.

using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SebPortal.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddApprovalLimit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "approvalLimit",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    tenant_id = table.Column<int>(type: "integer", nullable: false),
                    minAmount = table.Column<decimal>(type: "numeric", nullable: false),
                    requiredApprovals = table.Column<int>(type: "integer", nullable: false),
                    description = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    lastModified_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    lastModified_by = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_approvalLimit", x => x.id);
                    table.ForeignKey(
                        name: "FK_approvalLimit_tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_audit_entries_user_id",
                table: "audit_entries",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_approvalLimit_tenant_id",
                table: "approvalLimit",
                column: "tenant_id");

            migrationBuilder.AddForeignKey(
                name: "FK_audit_entries_users_user_id",
                table: "audit_entries",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_audit_entries_users_user_id",
                table: "audit_entries");

            migrationBuilder.DropTable(
                name: "approvalLimit");

            migrationBuilder.DropIndex(
                name: "IX_audit_entries_user_id",
                table: "audit_entries");
        }
    }
}
