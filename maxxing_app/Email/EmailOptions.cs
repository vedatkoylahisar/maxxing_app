namespace maxxing_app.Email;

public class EmailOptions
{
    public const string SectionName = "Email";

    // Gönderen adresi (örn. "no-reply@alanadi.com"). Production'da alan adının DNS kayıtları (SPF/DKIM) bu adresi doğrulamalı.
    public string FromAddress { get; set; } = "";
    public string FromName { get; set; } = "maxxing";

    // "Smtp" (geliştirmede Mailpit) ya da "Brevo" (production, HTTP API; Email__BrevoApiKey ortam değişkeni).
    public string Provider { get; set; } = "Smtp";
    public string? BrevoApiKey { get; set; }

    // Geliştirmede Mailpit (localhost:1025). Production'da mail servisinin SMTP bilgileri ortam değişkeninden gelir
    // (Email__SmtpHost, Email__SmtpUser, Email__SmtpPassword).
    public string SmtpHost { get; set; } = "";
    public int SmtpPort { get; set; } = 587;
    public string? SmtpUser { get; set; }
    public string? SmtpPassword { get; set; }
    public bool UseStartTls { get; set; } = true;
}
