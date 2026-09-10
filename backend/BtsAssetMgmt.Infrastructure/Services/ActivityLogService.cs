using System.Threading.Tasks;
using BtsAssetMgmt.Core.Dtos;
using BtsAssetMgmt.Core.Entities;
using BtsAssetMgmt.Core.Interfaces;
using BtsAssetMgmt.Infrastructure.Data;

namespace BtsAssetMgmt.Infrastructure.Services
{
    public class ActivityLogService : IActivityLogService
    {
        private readonly BtsDbContext _context;

        public ActivityLogService(BtsDbContext context)
        {
            _context = context;
        }

        public async Task LogActivityAsync(CurrentUser? user, string action, string details)
        {
            _context.ActivityLogs.Add(new ActivityLog
            {
                UserId = user?.Id,
                Username = user?.Username,
                Action = action,
                Details = details,
                Timestamp = System.DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
        }
    }
}
