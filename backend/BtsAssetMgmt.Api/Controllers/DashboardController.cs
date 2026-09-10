using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BtsAssetMgmt.Core.Interfaces;

namespace BtsAssetMgmt.Api.Controllers
{
    [ApiController]
    [Route("api/v1/dashboard")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            return Ok(await _dashboardService.GetSummaryAsync());
        }

        [HttpGet("activity")]
        public async Task<IActionResult> GetActivity([FromQuery] int take = 20)
        {
            take = Math.Clamp(take, 1, 200);
            return Ok(await _dashboardService.GetRecentActivityAsync(take));
        }
    }
}
