using System.Globalization;

namespace maxxing_app.Localization;

// Desteklenen diller. İstek dili Accept-Language başlığından gelir (Program.cs → UseRequestLocalization):
// Türkçe ise Türkçe, diğer tüm dillerde İngilizce.
public static class Languages
{
    public const string English = "en";
    public const string Turkish = "tr";

    public const string Default = English;

    public static readonly string[] Supported = [English, Turkish];

    // Bu isteğin dili.
    public static string Current => Normalize(CultureInfo.CurrentUICulture.TwoLetterISOLanguageName);

    public static string Normalize(string? code) => code == Turkish ? Turkish : English;

    // Bir işi belirli bir dilde yapmak için (örn. maili kullanıcının dilinde yazmak); dispose edilince eski dile döner.
    public static IDisposable Use(string language) => new CultureScope(new CultureInfo(Normalize(language)));

    private sealed class CultureScope : IDisposable
    {
        private readonly CultureInfo _culture = CultureInfo.CurrentCulture;
        private readonly CultureInfo _uiCulture = CultureInfo.CurrentUICulture;

        public CultureScope(CultureInfo culture)
        {
            CultureInfo.CurrentCulture = culture;
            CultureInfo.CurrentUICulture = culture;
        }

        public void Dispose()
        {
            CultureInfo.CurrentCulture = _culture;
            CultureInfo.CurrentUICulture = _uiCulture;
        }
    }
}
