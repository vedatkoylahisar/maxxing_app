# maxxing_app

Kullanıcıyla Türkçe konuş.

## Ürün

Herkesin kullanabileceği, sosyal yönü olan bir gelişim takip uygulaması. Sadece "maxxing" (vücut, yüz) için değil: YKS'ye hazırlanan öğrenci, tıpçı, yazılımcı, iş, niş bir spor… herkes kendi alanında kullanır.

- **Alan seçimi (kayıtta):** "Ne için buradasın?" diye sorulur. Seçenekler geniş (YKS, body maxxing, face maxxing, yazılım, tıp, iş, spor…), birden fazla seçilebilir, listede yoksa kullanıcı kendisi yazar. Seçime göre hazır rutin önerileri sunulur ("rutin ekle"). Alan şimdilik sadece öneri için kullanılır; keşfet / tanımadığın kişileri bulma yok.
- **Günlük kayıt:** Kullanıcı her gün rutinlerini tikler (spor yaptı mı, kaç adım yürüdü, cilt bakımı vb.) ve isterse o güne not yazar.
- **Rutinler:** Kullanıcı kendi rutinlerini tanımlar ve ayarlar: yaptım/yapmadım ("her gün spor") ya da sayı hedefi ("her gün 20 sayfa kitap", "10 bin adım").
- **Günün notu:** Her zaman gizli, sadece sahibi görür (günlük gibi).
- **Paylaşımlar ("bugün şunu öğrendim"):** Günün notundan ayrı, kısa yazılar. Yazarken kullanıcıya sorulur: "Grubunla mı paylaşmak istersin, yoksa sadece sana mı kalsın?" Paylaşımlar sadece gruplarda görünür; herkese açık akış yok. Tıpçı tıpla, yazılımcı yazılımla ilgili öğrendiklerini arkadaşlarıyla paylaşır.
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
| Uygulama | React Native + Expo (SDK 58), Expo Router. Önce web olarak kullanılacak, sonra aynı kodla iOS. | `app/` |
| API | ASP.NET Core, .NET 10, controller tabanlı, EF Core | `maxxing_app/` |
| Veritabanı | PostgreSQL 17, Docker içinde | `docker-compose.yml` |

Tüm iş kuralları API'de yaşar: kimlik doğrulama, kim neyi görebilir, seri hesabı. İstemci sadece gösterir.

## Geliştirme

```
docker compose up -d                 # PostgreSQL (container: maxxing_db, volume: maxxing_pgdata) + Mailpit (maxxing_mail)
dotnet run --project maxxing_app     # API -> http://localhost:5055
dotnet ef migrations add <Ad> --project maxxing_app --output-dir Data/Migrations
cd app && npx expo start --web       # Uygulama (web) -> http://localhost:8081
cd app && npx tsc --noEmit && npx expo lint   # tip kontrolü + lint
```

### Uygulama (`app/`)

- Expo'ya özel kurallar `app/AGENTS.md` içinde: paketler `npx expo install` ile eklenir; Expo API'leri sürümden sürüme değiştiği için kod yazmadan önce SDK 58 dokümanına bakılır.
- Sayfalar `app/src/app/` altında (Expo Router). Diğer kod `app/src/` altında: `api/` (API istekleri), `auth/` (oturum, token saklama, form doğrulama), `components/`, `theme.ts`.
- Giriş koruması kök `_layout.tsx` içinde `Stack.Protected` ile. Token telefonda `expo-secure-store`, web'de `localStorage` içinde.
- API adresi: `EXPO_PUBLIC_API_URL` ortam değişkeni, yoksa `http://localhost:5055`.
- Tasarım: koyu tema, tek vurgu rengi limon yeşili (`#D4FF3A`), başlıklar Unbounded, metinler Manrope. Renk ve fontlar sadece `theme.ts`'den alınır.
- Uygulama çoğunlukla telefonda kullanılacak. Ekranlar telefon genişliğine göre tasarlanır; bilgisayarda aynı sütun `CONTENT_MAX_WIDTH` (440) genişliğinde ortalanır, yani iki cihazda da ekran aynı görünür. Her ekran için `components/Screen.tsx` kullanılır.
- Bu makinede Expo (Metro) dosya değişikliklerini her zaman algılamıyor: değişiklik ekranda görünmüyorsa sunucuyu `npx expo start --web --clear` ile yeniden başlat.
- API'deki doğrulama kuralları `app/src/auth/validation.ts` içinde tekrarlanır (hızlı geri bildirim için); biri değişirse diğeri de değişir.

- Development ortamında bekleyen migration'lar API açılışında otomatik uygulanır (`Program.cs`).
- Migration ekledikten sonra API'yi `--no-build` ile başlatma: yeni migration derlenmemiş olur ve API "pending model changes" hatasıyla açılmaz.
- Bağlantı cümlesi: `appsettings.Development.json` → `ConnectionStrings:Default`. İçindeki şifre yalnızca yerel geliştirme içindir; production'da ortam değişkenine taşınacak.
- JWT anahtarı: `appsettings.Development.json` → `Jwt:Key` (yalnızca yerel geliştirme için). Production'da `Jwt__Key` ortam değişkeni; anahtar yoksa ya da 32 karakterden kısaysa API açılmaz.
- E-posta: `Email` ayarları (`EmailOptions`), gönderim `Email/IEmailSender` üzerinden (şimdilik SMTP, MailKit). Development'ta Mailpit: SMTP `localhost:1025`, gelen kutusu `http://localhost:8025`; mailler gerçek adrese gitmez. Production'da `Email__FromAddress`, `Email__SmtpHost`, `Email__SmtpUser`, `Email__SmtpPassword` ortam değişkenleri; `FromAddress` ya da `SmtpHost` yoksa API açılmaz.
- E-posta doğrulama: varsayılan `[Authorize]` token'da `email_verified=true` ister; onaysız hesaplar sadece `AuthPolicies.AllowUnverified` kullanan endpoint'lere girer (`/auth/me`, `/auth/verify-email`, `/auth/verify-email/resend`). Kodlar `EmailCodes` tablosunda hash'li tutulur (`EmailCodeService`: 15 dk geçerli, 5 deneme, 60 sn tekrar gönderme beklemesi).
- CORS: izin verilen adresler `Cors:Origins` (development'ta Expo web: `http://localhost:8081`).
- Örnek istekler: `maxxing_app/maxxing_app.http` (kayıt, giriş, `/auth/me`).
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
2. [x] Kayıt ol / giriş yap: `User` tablosu, şifre hash'leme, JWT; Expo projesini `app/` altında oluşturup giriş/kayıt ekranları; API'de Expo web için CORS
3. [x] Rutinler, günlük tikleme, günün notu ve seri (3 ve 4. adım birleştirildi): iki rutin türü (yaptım/yapmadım, sayı hedefi); sadece bugün ve dün düzenlenebilir; gün, aktif rutinlerin hepsi tamamlanınca seriye sayılır; "bugün" kullanıcının saat dilimine göre (`User.TimeZone`); silinen rutin arşivlenir
4. [x] Gruplar ve davet kodu: grup kur, 6 haneli kodla katıl, ayrıl, sahip kodu yeniler; grup sayfasında üyelerin sadece günlük özeti (x/y tamamladı, seri) görünür
5. [x] Profil + alan seçimi: görünen ad, kısa bio, alanlar (kayıtta "ne için buradasın?" sorulur, profilden değiştirilir; seçime göre rutin önerileri), istatistikler (şu anki seri, en uzun seri, toplam tamamlanan gün), ayarlar (çıkış, şifre değiştir). Fotoğraf şimdilik yok, baş harf gösterilir. Grupta bir üyeye dokununca profil özeti görünür (ad, bio, alanlar, istatistikler); rutin adları ve notlar yine gizli.
6. [x] E-posta doğrulama. Kayıttan sonra e-postaya 6 haneli kod gider (15 dk geçerli, "kodu tekrar gönder" var); kullanıcı kodu girene kadar uygulamaya giremez: profil oluşturma ("Ne için buradasın?"), rutinler, gruplar hiçbiri açılmaz, sadece "kodu gir" ekranı görünür. API bunu zorlar (onaysız hesabın token'ı korumalı endpoint'lerde reddedilir), istemci sadece ekranı gösterir. Geliştirmede mailler Docker'da Mailpit'e gider (`localhost:8025`, gerçek adrese gitmez); production'da Resend/Brevo/SendGrid gibi bir servis ve alan adı gerekir. Mevcut hesaplar (`vedatkoylahisar`) onaylı sayılır. İleride "şifremi unuttum" da aynı altyapıyı kullanır.
7. [ ] **Sıradaki iş:** Paylaşım ve grup akışı (rutin kayıtlarının grupta görünmesi + "bugün öğrendim" paylaşımları)

2. adım bitince giriş yapılabilen bir site, 7. adım bitince arkadaşlarla gerçekten kullanılabilir bir uygulama olacak.

İleride belki: yapay zekâ sohbet asistanı, sesli komut ("bugün 5 bin adım attım"). Bunlar için şimdiden kod yazılmaz; ama her işlem API üzerinden yapıldığı sürece ileride aynı endpoint'leri çağırarak eklenebilirler. Bu yüzden iş kuralı istemciye konmaz.
