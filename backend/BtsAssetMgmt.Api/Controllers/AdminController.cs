using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BtsAssetMgmt.Api.Extensions;
using BtsAssetMgmt.Core.Dtos;
using BtsAssetMgmt.Core.Interfaces;

namespace BtsAssetMgmt.Api.Controllers
{
    [ApiController]
    [Route("api/v1/admin")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;

        public AdminController(IAdminService adminService)
        {
            _adminService = adminService;
        }

        [HttpGet("export-csv")]
        public async Task<IActionResult> ExportAssetsCsv()
        {
            var csvData = await _adminService.ExportAssetsToCsvAsync();
            return File(csvData, "text/csv; charset=utf-8", $"bts_assets_{DateTime.Now:yyyyMMdd_HHmmss}.csv");
        }

        [HttpPost("backup")]
        public async Task<IActionResult> BackupDatabase()
        {
            try
            {
                var info = await _adminService.BackupDatabaseAsync(User.ToCurrentUser());
                return Ok(new { message = $"Backup created: {info.FileName}", backup = info });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Backup failed: {ex.Message}" });
            }
        }

        [HttpGet("backups")]
        public async Task<IActionResult> ListBackups()
        {
            return Ok(await _adminService.ListBackupsAsync());
        }

        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            try
            {
                await _adminService.ChangePasswordAsync(User.ToCurrentUser(), request.CurrentPassword, request.NewPassword);
                return Ok(new { message = "Password changed successfully." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
