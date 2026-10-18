using maxxing_app.Localization;
using maxxing_app.Models;

namespace maxxing_app.Profiles;

public record RoutineSuggestion(string Name, RoutineType Type, int? Target = null, string? Unit = null);

// Katalogdaki metinler her dilde ayrı. Yeni bir dil eklenirse buraya da eklenir.
public record LocalizedText(string Tr, string En)
{
    public string Current => Languages.Current == Languages.Turkish ? Tr : En;
}

public record SuggestionTemplate(LocalizedText Name, RoutineType Type, int? Target = null, LocalizedText? Unit = null)
{
    public RoutineSuggestion Current => new(Name.Current, Type, Target, Unit?.Current);
}

public record Area(string Key, LocalizedText Label, IReadOnlyList<SuggestionTemplate> Suggestions);

// "Ne için buradasın?" listesi ve her alana göre önerilen rutinler; metinler isteğin dilinde döner.
// Kullanıcı listede olmayan bir alanı kendisi de yazabilir; onun önerisi olmaz.
// Anahtarlar (örn. "yks") veritabanında saklandığı için değiştirilmez.
public static class AreaCatalog
{
    private static readonly LocalizedText Questions = new("soru", "questions");
    private static readonly LocalizedText Minutes = new("dakika", "minutes");
    private static readonly LocalizedText Hours = new("saat", "hours");

    public static readonly IReadOnlyList<Area> All =
    [
        // Türkçede YKS, diğer dillerde genel sınav hazırlığı.
        new("yks", new("YKS / sınav", "Exams (SAT, IELTS…)"),
        [
            new(new("Soru çöz", "Practice questions"), RoutineType.Count, 100, Questions),
            new(new("Konu tekrarı", "Topic review"), RoutineType.Check),
            new(new("Paragraf", "Reading comprehension"), RoutineType.Count, 20, Questions),
        ]),
        new("body", new("Vücut (body maxxing)", "Body (body maxxing)"),
        [
            new(new("Spor", "Workout"), RoutineType.Check),
            new(new("Protein", "Protein"), RoutineType.Count, 120, new("gram", "grams")),
            new(new("Su", "Water"), RoutineType.Count, 8, new("bardak", "glasses")),
            new(new("Uyku", "Sleep"), RoutineType.Count, 8, Hours),
        ]),
        new("face", new("Yüz (face maxxing)", "Face (face maxxing)"),
        [
            new(new("Sabah cilt bakımı", "Morning skincare"), RoutineType.Check),
            new(new("Akşam cilt bakımı", "Evening skincare"), RoutineType.Check),
            new(new("Güneş kremi", "Sunscreen"), RoutineType.Check),
            new(new("Mewing", "Mewing"), RoutineType.Check),
        ]),
        new("software", new("Yazılım", "Software"),
        [
            new(new("Kod yaz", "Code"), RoutineType.Count, 60, Minutes),
            new(new("Algoritma sorusu", "Algorithm problem"), RoutineType.Count, 1, new("soru", "problem")),
            new(new("Yeni bir şey öğren", "Learn something new"), RoutineType.Check),
        ]),
        new("medicine", new("Tıp", "Medicine"),
        [
            new(new("Konu çalış", "Study topics"), RoutineType.Count, 2, Hours),
            new(new("Soru / vaka", "Questions / cases"), RoutineType.Count, 30, Questions),
            new(new("Makale oku", "Read an article"), RoutineType.Check),
        ]),
        new("work", new("İş / kariyer", "Work / career"),
        [
            new(new("Derin çalışma", "Deep work"), RoutineType.Count, 90, Minutes),
            new(new("Günü planla", "Plan the day"), RoutineType.Check),
            new(new("Gelen kutusunu sıfırla", "Inbox zero"), RoutineType.Check),
        ]),
        new("selfdev", new("Kişisel gelişim", "Self-improvement"),
        [
            new(new("Kitap", "Reading"), RoutineType.Count, 20, new("sayfa", "pages")),
            new(new("Meditasyon", "Meditation"), RoutineType.Count, 10, Minutes),
            new(new("Günlük yaz", "Journal"), RoutineType.Check),
        ]),
        new("sport", new("Spor", "Sports"),
        [
            new(new("Antrenman", "Training"), RoutineType.Check),
            new(new("Esneme", "Stretching"), RoutineType.Count, 15, Minutes),
            new(new("Koşu", "Run"), RoutineType.Count, 5, new("km", "km")),
        ]),
        new("language", new("Dil öğrenme", "Language learning"),
        [
            new(new("Kelime", "Vocabulary"), RoutineType.Count, 20, new("kelime", "words")),
            new(new("Dinleme", "Listening"), RoutineType.Count, 30, Minutes),
        ]),
    ];

    private static readonly Dictionary<string, Area> ByKey = All.ToDictionary(a => a.Key);

    public static Area? Find(string key) => ByKey.GetValueOrDefault(key);

    // Kayıtlı değer listedeki bir anahtarsa onun (isteğin dilindeki) etiketi, değilse kullanıcının yazdığı metin.
    public static string LabelOf(string value) => Find(value)?.Label.Current ?? value;
}
