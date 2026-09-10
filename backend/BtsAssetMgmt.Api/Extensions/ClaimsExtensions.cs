using System.Security.Claims;
using BtsAssetMgmt.Core.Dtos;

namespace BtsAssetMgmt.Api.Extensions
{
    public static class ClaimsExtensions
    {
        public static CurrentUser ToCurrentUser(this ClaimsPrincipal principal)
        {
            var idValue = principal.FindFirstValue(ClaimTypes.NameIdentifier);
            var id = Guid.TryParse(idValue, out var parsed) ? parsed : Guid.Empty;
            var name = principal.FindFirstValue(ClaimTypes.Name) ?? "unknown";
            return new CurrentUser(id, name);
        }
    }
}
