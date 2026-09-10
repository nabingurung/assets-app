using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using BtsAssetMgmt.Core.Dtos;
using BtsAssetMgmt.Core.Entities;

namespace BtsAssetMgmt.Core.Interfaces
{
    public interface IAssetService
    {
        Task<IEnumerable<Asset>> GetAssetsAsync(AssetFilter filter);
        Task<Asset?> GetAssetByIdAsync(Guid id);
        Task<Asset> CreateAssetAsync(Asset asset, CurrentUser user);
        Task<Asset?> UpdateAssetAsync(Guid id, Asset asset, CurrentUser user);
        Task<bool> DeleteAssetAsync(Guid id, CurrentUser user);
        Task<IEnumerable<AssetHistory>> GetAssetHistoryAsync(Guid assetId);
        Task<IEnumerable<AssetNote>> GetAssetNotesAsync(Guid assetId);
        Task<AssetNote?> AddNoteAsync(Guid assetId, CurrentUser user, string content);
    }
}
