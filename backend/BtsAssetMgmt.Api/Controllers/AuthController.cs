using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BtsAssetMgmt.Api.Extensions;
using BtsAssetMgmt.Core.Dtos;
using BtsAssetMgmt.Core.Interfaces;
using System.Security.Claims;

namespace BtsAssetMgmt.Api.Controllers
{
    [ApiController]
    [Route("api/v1/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IActivityLogService _activityLog;

        public AuthController(IAuthService authService, IActivityLogService activityLog)
        {
            _authService = authService;
            _activityLog = activityLog;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var response = _authService.Login(request);
            if (response == null)
            {
                return Unauthorized(new { message = "Invalid username or password." });
            }

            await _activityLog.LogActivityAsync(new CurrentUser(response.User.Id, response.User.Username), "Login", $"\"{response.User.Username}\" signed in");
            return Ok(response);
        }

        [HttpGet("me")]
        [Authorize]
        public IActionResult Me()
        {
            var user = User.ToCurrentUser();
            var role = User.FindFirstValue(ClaimTypes.Role) ?? "User";
            return Ok(new UserDto(user.Id, user.Username, role));
        }
    }
}
