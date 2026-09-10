using System;

namespace BtsAssetMgmt.Core.Dtos
{
    public record LoginRequest(string Username, string Password);
    public record UserDto(Guid Id, string Username, string Role);
    public record LoginResponse(string Token, UserDto User);
    public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
}
