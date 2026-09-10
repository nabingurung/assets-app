using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using BtsAssetMgmt.Core.Dtos;
using BtsAssetMgmt.Core.Entities;
using BtsAssetMgmt.Core.Interfaces;
using BtsAssetMgmt.Infrastructure.Data;

namespace BtsAssetMgmt.Infrastructure.Services
{
    public class LocationService : ILocationService
    {
        private readonly BtsDbContext _context;
        private readonly IActivityLogService _activityLog;

        public LocationService(BtsDbContext context, IActivityLogService activityLog)
        {
            _context = context;
            _activityLog = activityLog;
        }

        public async Task<IEnumerable<Location>> GetLocationsAsync()
        {
            return await _context.Locations.AsNoTracking().OrderBy(l => l.Name).ToListAsync();
        }

        public async Task<Location> CreateLocationAsync(Location location, CurrentUser user)
        {
            location.Id = 0;
            location.Name = location.Name.Trim();
            _context.Locations.Add(location);
            await _context.SaveChangesAsync();
            await _activityLog.LogActivityAsync(user, "Location Created", $"Created location \"{location.Name}\"");
            return location;
        }

        public async Task<Location?> UpdateLocationAsync(int id, Location location, CurrentUser user)
        {
            var existing = await _context.Locations.FindAsync(id);
            if (existing == null) return null;

            var oldName = existing.Name;
            existing.Name = location.Name.Trim();
            existing.Description = location.Description;

            await _context.SaveChangesAsync();
            await _activityLog.LogActivityAsync(user, "Location Updated",
                oldName == existing.Name ? $"Updated location \"{existing.Name}\"" : $"Renamed location \"{oldName}\" to \"{existing.Name}\"");
            return existing;
        }

        public async Task<bool?> DeleteLocationAsync(int id, CurrentUser user)
        {
            var location = await _context.Locations.FindAsync(id);
            if (location == null) return null;

            if (await _context.Assets.AnyAsync(a => a.LocationId == id)) return false;

            _context.Locations.Remove(location);
            await _context.SaveChangesAsync();
            await _activityLog.LogActivityAsync(user, "Location Deleted", $"Deleted location \"{location.Name}\"");
            return true;
        }
    }
}
