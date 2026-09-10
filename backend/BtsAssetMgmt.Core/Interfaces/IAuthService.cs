using BtsAssetMgmt.Core.Dtos;

namespace BtsAssetMgmt.Core.Interfaces
{
    public interface IAuthService
    {
        LoginResponse? Login(LoginRequest request);
        string GenerateJwtToken(Entities.User user);
        bool VerifyPassword(string password, string hash);
        string HashPassword(string password);
    }
}
