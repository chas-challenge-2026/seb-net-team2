using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SebPortal.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddNativeAuditMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "native_hash",
                table: "audit_entries",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "native_written_at",
                table: "audit_entries",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "native_hash",
                table: "audit_entries");

            migrationBuilder.DropColumn(
                name: "native_written_at",
                table: "audit_entries");
        }
    }
}
