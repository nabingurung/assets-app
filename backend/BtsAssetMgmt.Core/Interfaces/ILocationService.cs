using System.Collections.Generic;
using System.Threading.Tasks;
using BtsAssetMgmt.Core.Dtos;
using BtsAssetMgmt.Core.Entities;

namespace BtsAssetMgmt.Core.Interfaces
{
    public interface ILocationService
    {
        Task<IEnumerable<Location>> GetLocationsAsync();
        Task<Location> CreateLocationAsync(Location location, CurrentUser user);
        Task<Location?> UpdateLocationAsync(int id, Location location, CurrentUser user);
        /// <summary>Returns null if not found, false if the location is still in use.</summary>
        Task<bool?> DeleteLocationAsync(int id, CurrentUser user);
    }
}
