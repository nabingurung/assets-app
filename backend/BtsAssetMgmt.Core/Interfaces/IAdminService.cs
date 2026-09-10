using System.Collections.Generic;
using System.Threading.Tasks;
using BtsAssetMgmt.Core.Dtos;

namespace BtsAssetMgmt.Core.Interfaces
{
    public record BackupInfo(string FileName, long SizeBytes, System.DateTime CreatedAt);

    public interface IAdminService
    {
        Task<byte[]> ExportAssetsToCsvAsync();
        Task<BackupInfo> BackupDatabaseAsync(CurrentUser user);
        Task<IReadOnlyList<BackupInfo>> ListBackupsAsync();
        Task ChangePasswordAsync(CurrentUser user, string currentPassword, string newPassword);
    }
}
