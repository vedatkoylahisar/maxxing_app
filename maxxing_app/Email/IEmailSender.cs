namespace maxxing_app.Email;

// Mail servisi değişirse (Mailpit, Brevo, Resend...) sadece bunun uygulaması değişir.
public interface IEmailSender
{
    Task SendAsync(string to, string subject, string text, CancellationToken cancellationToken = default);
}
