using System.Security.Claims;
using Microsoft.IdentityModel.JsonWebTokens;

namespace maxxing_app.Auth;

public static class ClaimsPrincipalExtensions
{
    // [Authorize] olan endpoint'lerde token'daki kullanıcı id'si.
    public static Guid GetUserId(this ClaimsPrincipal principal) =>
        Guid.Parse(principal.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? throw new InvalidOperationException("Token'da kullanıcı id'si yok."));
}
