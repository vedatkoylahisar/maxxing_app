using maxxing_app.Models;

namespace maxxing_app.Profiles;

public record RoutineSuggestion(string Name, RoutineType Type, int? Target = null, string? Unit = null);

public record Area(string Key, string Label, IReadOnlyList<RoutineSuggestion> Suggestions);

// "Ne için buradasın?" listesi ve her alana göre önerilen rutinler.
// Kullanıcı listede olmayan bir alanı kendisi de yazabilir; onun önerisi olmaz.
public static class AreaCatalog
{
    public static readonly IReadOnlyList<Area> All =
    [
        new("yks", "YKS / sınav",
        [
            new("Soru çöz", RoutineType.Count, 100, "soru"),
            new("Konu tekrarı", RoutineType.Check),
            new("Paragraf", RoutineType.Count, 20, "soru"),
        ]),
        new("body", "Vücut (body maxxing)",
        [
            new("Spor", RoutineType.Check),
            new("Protein", RoutineType.Count, 120, "gram"),
            new("Su", RoutineType.Count, 8, "bardak"),
            new("Uyku", RoutineType.Count, 8, "saat"),
        ]),
        new("face", "Yüz (face maxxing)",
        [
            new("Sabah cilt bakımı", RoutineType.Check),
            new("Akşam cilt bakımı", RoutineType.Check),
            new("Güneş kremi", RoutineType.Check),
            new("Mewing", RoutineType.Check),
        ]),
        new("software", "Yazılım",
        [
            new("Kod yaz", RoutineType.Count, 60, "dakika"),
            new("Algoritma sorusu", RoutineType.Count, 1, "soru"),
            new("Yeni bir şey öğren", RoutineType.Check),
        ]),
        new("medicine", "Tıp",
        [
            new("Konu çalış", RoutineType.Count, 2, "saat"),
            new("Soru / vaka", RoutineType.Count, 30, "soru"),
            new("Makale oku", RoutineType.Check),
        ]),
        new("work", "İş / kariyer",
        [
            new("Derin çalışma", RoutineType.Count, 90, "dakika"),
            new("Günü planla", RoutineType.Check),
            new("Gelen kutusunu sıfırla", RoutineType.Check),
        ]),
        new("selfdev", "Kişisel gelişim",
        [
            new("Kitap", RoutineType.Count, 20, "sayfa"),
            new("Meditasyon", RoutineType.Count, 10, "dakika"),
            new("Günlük yaz", RoutineType.Check),
        ]),
        new("sport", "Spor",
        [
            new("Antrenman", RoutineType.Check),
            new("Esneme", RoutineType.Count, 15, "dakika"),
            new("Koşu", RoutineType.Count, 5, "km"),
        ]),
        new("language", "Dil öğrenme",
        [
            new("Kelime", RoutineType.Count, 20, "kelime"),
            new("Dinleme", RoutineType.Count, 30, "dakika"),
        ]),
    ];

    private static readonly Dictionary<string, Area> ByKey = All.ToDictionary(a => a.Key);

    public static Area? Find(string key) => ByKey.GetValueOrDefault(key);

    // Kayıtlı değer listedeki bir anahtarsa onun etiketi, değilse kullanıcının yazdığı metin.
    public static string LabelOf(string value) => Find(value)?.Label ?? value;
}
