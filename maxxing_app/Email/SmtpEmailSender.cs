using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace maxxing_app.Email;

public class SmtpEmailSender(IOptions<EmailOptions> options) : IEmailSender
{
    private readonly EmailOptions _email = options.Value;

    public async Task SendAsync(string to, string subject, string text, CancellationToken cancellationToken = default)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_email.FromName, _email.FromAddress));
        message.To.Add(MailboxAddress.Parse(to));
        message.Subject = subject;
        message.Body = new TextPart("plain") { Text = text };

        using var client = new SmtpClient();
        var security = _email.UseStartTls ? SecureSocketOptions.StartTls : SecureSocketOptions.None;
        await client.ConnectAsync(_email.SmtpHost, _email.SmtpPort, security, cancellationToken);
        if (!string.IsNullOrEmpty(_email.SmtpUser))
            await client.AuthenticateAsync(_email.SmtpUser, _email.SmtpPassword ?? "", cancellationToken);
        await client.SendAsync(message, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);
    }
}
