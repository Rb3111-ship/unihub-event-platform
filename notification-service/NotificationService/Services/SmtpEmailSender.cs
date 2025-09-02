using System.Net;
using System.Net.Mail;

namespace NotificationService.Services;

public class SmtpEmailSender : IEmailSender
{
    private readonly IConfiguration _cfg;
    public SmtpEmailSender(IConfiguration cfg) => _cfg = cfg;

    public async Task SendAsync(string to, string subject, string htmlBody)
    {
        var host = _cfg["Smtp:Host"];
        var port = int.Parse(_cfg["Smtp:Port"]!);
        var user = _cfg["Smtp:User"];
        var pass = _cfg["Smtp:Pass"];
        var from = _cfg["Smtp:From"] ?? "no-reply@example.com";

        using var client = new SmtpClient(host, port)
        {
            UseDefaultCredentials = false,
            Credentials = new NetworkCredential(user, pass),
            EnableSsl = true,  // VERY IMPORTANT for Mailtrap
            DeliveryMethod = SmtpDeliveryMethod.Network
        };

        var mail = new MailMessage();
        mail.From = new MailAddress(from);
        mail.To.Add(to);
        mail.Subject = subject;
        mail.Body = htmlBody;
        mail.IsBodyHtml = true;

        await client.SendMailAsync(mail);
    }
}
