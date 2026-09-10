using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using BtsAssetMgmt.Core.Dtos;
using BtsAssetMgmt.Core.Interfaces;
using BtsAssetMgmt.Infrastructure.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace BtsAssetMgmt.Infrastructure.Services
{
    public class AdminService : IAdminService
    {
        private readonly BtsDbContext _context;
        private readonly IAuthService _authService;
        private readonly IActivityLogService _activityLog;

        public AdminService(BtsDbContext context, IAuthService authService, IActivityLogService activityLog)
        {
            _context = context;
            _authService = authService;
            _activityLog = activityLog;
        }

        public async Task<byte[]> ExportAssetsToCsvAsync()
        {
            var assets = await _context.Assets.AsNoTracking()
                .Include(a => a.Category)
                .Include(a => a.Location)
                .OrderBy(a => a.Name)
                .ToListAsync();

            var csv = new StringBuilder();
            csv.AppendLine("Id,Name,SKU,SerialNumber,Category,Location,PurchaseDate,Quantity,UnitValue,TotalValue,Status,Description,CreatedAt");

            foreach (var a in assets)
            {
                csv.AppendLine(string.Join(",",
                    a.Id,
                    EscapeCsv(a.Name),
                    EscapeCsv(a.SKU),
                    EscapeCsv(a.SerialNumber),
                    EscapeCsv(a.Category?.Name),
                    EscapeCsv(a.Location?.Name),
                    a.PurchaseDate?.ToString("yyyy-MM-dd") ?? string.Empty,
                    a.Quantity,
                    a.Value.ToString("0.00"),
                    (a.Value * a.Quantity).ToString("0.00"),
                    a.Status,
                    EscapeCsv(a.Description),
                    a.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss")));
            }

            // UTF-8 BOM so Excel opens non-ASCII names correctly.
            return Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(csv.ToString())).ToArray();
        }

        public async Task<BackupInfo> BackupDatabaseAsync(CurrentUser user)
        {
            var dbPath = GetDatabasePath();
            var backupDir = GetBackupDirectory(dbPath);
            Directory.CreateDirectory(backupDir);

            var fileName = $"bts_backup_{DateTime.Now:yyyyMMdd_HHmmss}.db";
            var backupPath = Path.Combine(backupDir, fileName);

            // Use SQLite's online backup API so the copy is consistent even while the app is running.
            var connection = (SqliteConnection)_context.Database.GetDbConnection();
            var wasClosed = connection.State != System.Data.ConnectionState.Open;
            if (wasClosed) await connection.OpenAsync();
            try
            {
                using var destination = new SqliteConnection($"Data Source={backupPath}");
                await destination.OpenAsync();
                connection.BackupDatabase(destination);
            }
            finally
            {
                if (wasClosed) await connection.CloseAsync();
            }

            var info = new FileInfo(backupPath);
            await _activityLog.LogActivityAsync(user, "Database Backup", $"Created backup {fileName}");
            return new BackupInfo(fileName, info.Length, info.CreationTimeUtc);
        }

        public Task<IReadOnlyList<BackupInfo>> ListBackupsAsync()
        {
            var backupDir = GetBackupDirectory(GetDatabasePath());
            if (!Directory.Exists(backupDir))
            {
                return Task.FromResult<IReadOnlyList<BackupInfo>>(Array.Empty<BackupInfo>());
            }

            var list = new DirectoryInfo(backupDir)
                .GetFiles("bts_backup_*.db")
                .OrderByDescending(f => f.CreationTimeUtc)
                .Select(f => new BackupInfo(f.Name, f.Length, f.CreationTimeUtc))
                .ToList();
            return Task.FromResult<IReadOnlyList<BackupInfo>>(list);
        }

        public async Task ChangePasswordAsync(CurrentUser user, string currentPassword, string newPassword)
        {
            if (string.IsNullOrWhiteSpace(newPassword) || newPassword.Length < 6)
            {
                throw new InvalidOperationException("New password must be at least 6 characters long.");
            }

            var account = await _context.Users.FirstOrDefaultAsync(u => u.Id == user.Id);
            if (account == null)
            {
                throw new InvalidOperationException("User account not found.");
            }

            if (!_authService.VerifyPassword(currentPassword, account.PasswordHash))
            {
                throw new InvalidOperationException("Current password is incorrect.");
            }

            account.PasswordHash = _authService.HashPassword(newPassword);
            await _context.SaveChangesAsync();
            await _activityLog.LogActivityAsync(user, "Password Changed", $"Password changed for \"{account.Username}\"");
        }

        private string GetDatabasePath()
        {
            var connectionString = _context.Database.GetConnectionString()
                ?? throw new InvalidOperationException("No database connection string configured.");
            var builder = new SqliteConnectionStringBuilder(connectionString);
            return Path.GetFullPath(builder.DataSource);
        }

        private static string GetBackupDirectory(string dbPath)
        {
            return Path.Combine(Path.GetDirectoryName(dbPath) ?? ".", "backups");
        }

        private static string EscapeCsv(string? value)
        {
            if (string.IsNullOrEmpty(value)) return string.Empty;

            // Spreadsheets treat cells starting with these characters as formulas. Prefix with a
            // single quote so user-entered text like "=SUM(...)" is shown literally, not executed.
            if (value[0] is '=' or '+' or '-' or '@' or '\t' or '\r')
            {
                value = "'" + value;
            }

            if (value.Contains(',') || value.Contains('"') || value.Contains('\n') || value.Contains('\r'))
            {
                return $"\"{value.Replace("\"", "\"\"")}\"";
            }
            return value;
        }
    }
}
