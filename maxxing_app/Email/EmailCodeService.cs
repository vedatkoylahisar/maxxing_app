using System.Security.Cryptography;
using System.Text;
using maxxing_app.Data;
using maxxing_app.Localization;
using maxxing_app.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using Npgsql;

namespace maxxing_app.Email;

public enum VerifyCodeStatus
{
    Ok,
    Wrong,
    // Kod yok ya da süresi dolmuş
    Expired,
    TooManyAttempts,
}

public record VerifyCodeResult(VerifyCodeStatus Status, int AttemptsLeft = 0);

// E-postaya giden 6 haneli kodlar: e-posta doğrulama (ileride şifre sıfırlama da aynı altyapıyı kullanır).
public class EmailCodeService(AppDbContext db, IEmailSender emailSender, IStringLocalizer<SharedResource> localizer)
{
    public static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(15);

    // İstemcideki geri sayım da bu süreyi kullanır (app/src/app/verify-email.tsx).
    public static readonly TimeSpan ResendCooldown = TimeSpan.FromSeconds(60);

    public const int MaxAttempts = 5;

    // Yeni kod üretip gönderir; önceki kod geçersiz olur.
    // Son gönderimden bu yana bekleme süresi dolmadıysa göndermez ve kalan süreyi döner; gönderdiyse null döner.
    public async Task<TimeSpan?> SendAsync(User user, EmailCodePurpose purpose)
    {
        var now = DateTime.UtcNow;
        var row = await db.EmailCodes.SingleOrDefaultAsync(c => c.UserId == user.Id && c.Purpose == purpose);
        if (row is not null && row.SentAt + ResendCooldown > now)
            return row.SentAt + ResendCooldown - now;

        if (row is null)
        {
            row = new EmailCode { Id = Guid.CreateVersion7(), UserId = user.Id, Purpose = purpose, CodeHash = "" };
            db.EmailCodes.Add(row);
        }

        var code = RandomNumberGenerator.GetInt32(1_000_000).ToString("D6");
        row.CodeHash = Hash(user.Id, code);
        row.ExpiresAt = now + Lifetime;
        row.Attempts = 0;
        row.SentAt = now;

        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            // Aynı anda iki istek geldi; diğeri kodu gönderiyor.
            db.Entry(row).State = EntityState.Detached;
            return ResendCooldown;
        }

        try
        {
            var (subject, text) = Compose(user, purpose, code);
            await emailSender.SendAsync(user.Email, subject, text);
        }
        catch
        {
            // Gönderilemeyen kod saklanmaz; kullanıcı beklemeden tekrar isteyebilsin.
            db.EmailCodes.Remove(row);
            await db.SaveChangesAsync();
            throw;
        }

        return null;
    }

    // Süresi dolmamış, deneme hakkı bitmemiş bir kod var mı?
    public Task<bool> HasActiveCodeAsync(User user, EmailCodePurpose purpose)
    {
        var now = DateTime.UtcNow;
        return db.EmailCodes.AnyAsync(c =>
            c.UserId == user.Id && c.Purpose == purpose && c.ExpiresAt > now && c.Attempts < MaxAttempts);
    }

    // Kod doğruysa siler. Kodun amacına göre yapılacak iş (örn. e-postayı onaylı işaretlemek) çağırana kalır.
    public async Task<VerifyCodeResult> VerifyAsync(User user, EmailCodePurpose purpose, string code)
    {
        var now = DateTime.UtcNow;
        var row = await db.EmailCodes.AsNoTracking()
            .SingleOrDefaultAsync(c => c.UserId == user.Id && c.Purpose == purpose);
        if (row is null || row.ExpiresAt <= now)
            return new(VerifyCodeStatus.Expired);

        // Deneme hakkı karşılaştırmadan önce, tek bir UPDATE ile harcanır: aynı anda gelen istekler de sınırı aşamaz.
        var claimed = await db.EmailCodes
            .Where(c => c.Id == row.Id && c.Attempts < MaxAttempts)
            .ExecuteUpdateAsync(s => s.SetProperty(c => c.Attempts, c => c.Attempts + 1));
        if (claimed == 0)
            return new(VerifyCodeStatus.TooManyAttempts);

        var expected = Convert.FromHexString(row.CodeHash);
        if (!CryptographicOperations.FixedTimeEquals(expected, Convert.FromHexString(Hash(user.Id, code))))
        {
            var left = MaxAttempts - (row.Attempts + 1);
            return left > 0 ? new(VerifyCodeStatus.Wrong, left) : new(VerifyCodeStatus.TooManyAttempts);
        }

        await db.EmailCodes.Where(c => c.Id == row.Id).ExecuteDeleteAsync();
        return new(VerifyCodeStatus.Ok);
    }

    private static string Hash(Guid userId, string code) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes($"{userId}:{code}")));

    // Mail, isteğin değil kullanıcının dilinde yazılır (User.Language).
    private (string Subject, string Text) Compose(User user, EmailCodePurpose purpose, string code)
    {
        using var _ = Languages.Use(user.Language);
        return purpose switch
        {
            EmailCodePurpose.EmailVerification => (
                localizer["VerificationEmailSubject", code],
                localizer["VerificationEmailBody", user.UserName, code, Lifetime.TotalMinutes]),
            _ => throw new ArgumentOutOfRangeException(nameof(purpose)),
        };
    }
}
