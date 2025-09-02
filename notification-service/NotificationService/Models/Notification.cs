namespace NotificationService.Models;

public class Notification
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string EventId { get; set; } = default!;
    public string OrganizerId { get; set; } = default!;
    public string RecipientEmail { get; set; } = default!;
    public string Subject { get; set; } = default!;
    public string Message { get; set; } = default!;
    public DateTime SentAt { get; init; } = DateTime.UtcNow;
}