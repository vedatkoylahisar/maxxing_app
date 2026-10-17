# maxxing_app

Kullanıcıyla Türkçe konuş.

## Ürün

Kişisel gelişim takip uygulaması, sosyal yönü olan.

- **Günlük kayıt:** Kullanıcı her gün rutinlerini tikler (spor yaptı mı, kaç adım yürüdü, cilt bakımı vb.) ve isterse o güne not yazar.
- **Rutinler:** Kullanıcı kendi rutinlerini tanımlar ("her gün spor", "her gün 10 bin adım").
- **Seri (streak):** Aksatmadan geçen gün sayısı ("12 gündür hiç aksatmadın").
- **Gruplar:** Kullanıcı grup kurar, bir davet kodu üretilir. Arkadaşı kodu girip katılır. Grupta üyelerin o günkü durumu görünür (kim yaptı, kim boş geçti). Amaç motivasyon ve biraz rekabet.
- **Gizlilik:** Her şey varsayılan olarak sadece sahibine görünür. Paylaşım iki şekilde olur:
  - Kayıt bazında: "bu kaydı şu grupta göster"
  - Grup bazında: "bu gruba her şeyimi göster"
  Örnek: spor kayıtları grupla paylaşılır, kişisel notlar gizli kalır.

Kullanıcı akışı: kayıt ol / profil oluştur → rutinleri belirle → her gün tikle ve not ekle → grup kur veya koda katıl → grupta arkadaşlarının gününü gör.

## Mimari

| Parça | Teknoloji | Konum |
|---|---|---|
| Uygulama | React Native + Expo. Önce web olarak kullanılacak, sonra aynı kodla iOS. | `app/` (henüz oluşturulmadı) |
| API | ASP.NET Core, .NET 10, controller tabanlı, EF Core | `maxxing_app/` |
| Veritabanı | PostgreSQL 17, Docker içinde | `docker-compose.yml` |

Tüm iş kuralları API'de yaşar: kimlik doğrulama, kim neyi görebilir, seri hesabı. İstemci sadece gösterir.

## Geliştirme

```
docker compose up -d                 # PostgreSQL (container: maxxing_db, volume: maxxing_pgdata)
dotnet run --project maxxing_app     # API -> http://localhost:5055
dotnet ef migrations add <Ad> --project maxxing_app --output-dir Data/Migrations
```

- Development ortamında bekleyen migration'lar API açılışında otomatik uygulanır (`Program.cs`).
- Bağlantı cümlesi: `appsettings.Development.json` → `ConnectionStrings:Default`. İçindeki şifre yalnızca yerel geliştirme içindir; production'da ortam değişkenine taşınacak.
- Sağlık kontrolü: `GET /health` (veritabanı bağlantısını da kontrol eder).
- OpenAPI dokümanı (development): `GET /openapi/v1.json`
- Proje klasörünün adı `maxxing_app` kalmalı: Docker volume adı klasör adından türetiliyor, değişirse boş bir veritabanı açılır.

## Git

- **Claude asla commit atmaz, asla push yapmaz.** `git commit`, `git push`, `git merge` ve geçmişi değiştiren hiçbir komutu çalıştırmaz. Commit ve push'u her zaman kullanıcı kendisi yapar. Claude sadece dosyaları düzenler; istenirse çalıştırılacak git komutlarını yazar.
- Repo: https://github.com/vedatkoylahisar/maxxing_app
- `main` her zaman çalışan sürümdür; `main`'e doğrudan commit atılmaz.
- Her özellik `main`'den açılan kendi branch'inde yapılır (örn. `auth`). Claude işe başlamadan önce doğru branch'te olunduğunu kontrol eder.
- Özellik bitince GitHub'da Pull Request açılıp `main`'e birleştirilir.

## Yol haritası

Her adımda önce backend, sonra o özelliğin ekranı yapılır.

1. [x] Veritabanını ayağa kaldırıp API'ye bağlamak
2. [ ] Kayıt ol / giriş yap: `User` tablosu, şifre hash'leme, JWT; Expo projesini `app/` altında oluşturup giriş/kayıt ekranları; API'de Expo web için CORS
3. [ ] Günlük kayıtlar ve notlar
4. [ ] Rutinler ve seri sayacı
5. [ ] Gruplar ve davet kodu
6. [ ] Paylaşım ve grup akışı

2. adım bitince giriş yapılabilen bir site, 6. adım bitince arkadaşlarla gerçekten kullanılabilir bir uygulama olacak.
