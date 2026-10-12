using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SebPortal.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPublicIds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("CREATE EXTENSION IF NOT EXISTS pgcrypto;");

            migrationBuilder.AddColumn<Guid>(
                name: "public_id",
                table: "users",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()");

            migrationBuilder.AddColumn<Guid>(
                name: "public_id",
                table: "payments",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()");

            migrationBuilder.AddColumn<Guid>(
                name: "public_id",
                table: "approvalLimit",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()");

            migrationBuilder.AddColumn<Guid>(
                name: "public_id",
                table: "approval_steps",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()");

            migrationBuilder.AddColumn<Guid>(
                name: "public_id",
                table: "accounts",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()");

            migrationBuilder.CreateIndex(
                name: "IX_users_public_id",
                table: "users",
                column: "public_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_payments_public_id",
                table: "payments",
                column: "public_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_approvalLimit_public_id",
                table: "approvalLimit",
                column: "public_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_approval_steps_public_id",
                table: "approval_steps",
                column: "public_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_accounts_public_id",
                table: "accounts",
                column: "public_id",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_users_public_id",
                table: "users");

            migrationBuilder.DropIndex(
                name: "IX_payments_public_id",
                table: "payments");

            migrationBuilder.DropIndex(
                name: "IX_approvalLimit_public_id",
                table: "approvalLimit");

            migrationBuilder.DropIndex(
                name: "IX_approval_steps_public_id",
                table: "approval_steps");

            migrationBuilder.DropIndex(
                name: "IX_accounts_public_id",
                table: "accounts");

            migrationBuilder.DropColumn(
                name: "public_id",
                table: "users");

            migrationBuilder.DropColumn(
                name: "public_id",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "public_id",
                table: "approvalLimit");

            migrationBuilder.DropColumn(
                name: "public_id",
                table: "approval_steps");

            migrationBuilder.DropColumn(
                name: "public_id",
                table: "accounts");
        }
    }
}
