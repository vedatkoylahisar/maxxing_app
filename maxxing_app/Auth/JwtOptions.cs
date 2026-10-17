using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace maxxing_app.Auth;

public class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "";
    public string Audience { get; set; } = "";

    // HS256 için en az 32 karakter. Production'da ortam değişkeninden gelir (Jwt__Key).
    public string Key { get; set; } = "";

    public int ExpiresInDays { get; set; } = 7;

    public SymmetricSecurityKey GetSigningKey() => new(Encoding.UTF8.GetBytes(Key));
}
