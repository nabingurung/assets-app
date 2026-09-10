using System;
using System.Threading.Tasks;
using BtsAssetMgmt.Core.Entities;
using BtsAssetMgmt.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BtsAssetMgmt.Infrastructure.Data
{
    /// <summary>
    /// Creates the SQLite schema on first run and makes sure an admin account exists.
    /// The admin password hash cannot live in HasData seeding because it must be
    /// generated with a random salt at runtime.
    /// </summary>
    public static class DbInitializer
    {
        public const string DefaultAdminUsername = "admin";
        public const string DefaultAdminPassword = "admin2016";

        public static async Task InitializeAsync(BtsDbContext context, IAuthService authService, string? adminPassword = null)
        {
            await context.Database.EnsureCreatedAsync();
            await EnsureColumnAsync(context, "Assets", "Quantity", "INTEGER NOT NULL DEFAULT 1");

            if (!await context.Users.AnyAsync(u => u.Role == UserRole.Admin))
            {
                context.Users.Add(new User
                {
                    Username = DefaultAdminUsername,
                    PasswordHash = authService.HashPassword(string.IsNullOrWhiteSpace(adminPassword) ? DefaultAdminPassword : adminPassword),
                    Role = UserRole.Admin
                });
                await context.SaveChangesAsync();
            }
        }

        /// <summary>
        /// EnsureCreated does not alter existing tables, so columns added after the first
        /// release are patched in here for databases created by an older version.
        /// </summary>
        private static async Task EnsureColumnAsync(BtsDbContext context, string table, string column, string definition)
        {
            var connection = context.Database.GetDbConnection();
            await connection.OpenAsync();
            try
            {
                using var check = connection.CreateCommand();
                check.CommandText = $"SELECT COUNT(*) FROM pragma_table_info('{table}') WHERE name = '{column}'";
                var exists = Convert.ToInt32(await check.ExecuteScalarAsync()) > 0;
                if (exists) return;

                using var alter = connection.CreateCommand();
                alter.CommandText = $"ALTER TABLE {table} ADD COLUMN {column} {definition}";
                await alter.ExecuteNonQueryAsync();
            }
            finally
            {
                await connection.CloseAsync();
            }
        }
    }
}
