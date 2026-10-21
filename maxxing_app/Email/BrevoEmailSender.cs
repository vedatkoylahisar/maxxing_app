using System.Net.Http.Json;
using Microsoft.Extensions.Options;

namespace maxxing_app.Email;

// Brevo'nun HTTP API'si. Render gibi barındırma servisleri ücretsiz planda SMTP portlarını kapattığı için production'da bu kullanılır.
// https://developers.brevo.com/reference/sendtransacemail
public class BrevoEmailSender(HttpClient http, IOptions<EmailOptions> options, ILogger<BrevoEmailSender> logger) : IEmailSender
{
    private readonly EmailOptions _email = options.Value;

    public async Task SendAsync(string to, string subject, string text, CancellationToken cancellationToken = default)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.brevo.com/v3/smtp/email")
        {
            Content = JsonContent.Create(new
            {
                sender = new { name = _email.FromName, email = _email.FromAddress },
                to = new[] { new { email = to } },
                subject,
                textContent = text,
            }),
        };
        request.Headers.Add("api-key", _email.BrevoApiKey);

        using var response = await http.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            logger.LogError("Brevo mail gönderemedi: {Status} {Body}", (int)response.StatusCode, body);
            response.EnsureSuccessStatusCode();
        }
    }
}
