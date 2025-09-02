using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NotificationService.Data;
using NotificationService.Models;
using NotificationService.Services;

namespace NotificationService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotificationsController(
        NotificationDbContext db,
        IEmailSender emailSender,
        IConfiguration cfg) : ControllerBase
{
    private readonly bool _storeStudents =
        cfg.GetValue("StoreStudentEmails", false);

    [HttpPost("receive")]
    public async Task<IActionResult> Receive([FromBody] NotificationRequest req)
    {
        // Iterate through the new Recipients list
        foreach (var recipient in req.Recipients.DistinctBy(r => r.Email, StringComparer.OrdinalIgnoreCase)) // Use DistinctBy for unique emails
        {
            // Pass the recipient's name to the renderer
            var html = EmailTemplateRenderer.Render(req.EventName, req.Message, recipient.Name);

            // Send to recipient.Email
            await emailSender.SendAsync(recipient.Email, $"[{req.EventName}] Update", html);

            if (recipient.Email.Equals(req.OrganizerEmail, StringComparison.OrdinalIgnoreCase) ||
                _storeStudents)
            {
                db.Notifications.Add(new Notification
                {
                    EventId = req.EventId,
                    OrganizerId = req.OrganizerId,
                    RecipientEmail = recipient.Email, // Store the email here
                    Subject = $"Update {req.EventName}",
                    Message = req.Message
                });
            }
        }
        await db.SaveChangesAsync();
        return Ok(new { sent = req.Recipients.Count }); // Return count of recipients
    }

    [HttpGet("organizer/{organizerId}")]
    public async Task<IActionResult> GetForOrganizer(string organizerId)
    {
        var list = await db.Notifications
                           .Where(n => n.OrganizerId == organizerId)
                           .OrderByDescending(n => n.SentAt)
                           .ToListAsync();

        return Ok(list);
    }
}