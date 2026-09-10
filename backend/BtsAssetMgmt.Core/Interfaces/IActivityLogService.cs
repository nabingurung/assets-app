using System.Threading.Tasks;
using BtsAssetMgmt.Core.Dtos;

namespace BtsAssetMgmt.Core.Interfaces
{
    public interface IActivityLogService
    {
        Task LogActivityAsync(CurrentUser? user, string action, string details);
    }
}
