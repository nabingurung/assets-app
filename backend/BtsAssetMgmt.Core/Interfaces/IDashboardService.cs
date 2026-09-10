using System.Collections.Generic;
using System.Threading.Tasks;
using BtsAssetMgmt.Core.Dtos;

namespace BtsAssetMgmt.Core.Interfaces
{
    public interface IDashboardService
    {
        Task<DashboardSummary> GetSummaryAsync();
        Task<IEnumerable<ActivityItem>> GetRecentActivityAsync(int take = 20);
    }
}
