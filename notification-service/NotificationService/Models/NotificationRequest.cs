namespace NotificationService.Models;

public class NotificationRequest
{
    public string EventId { get; set; } = default!;
    public string EventName { get; set; } = default!;
    public string OrganizerId { get; set; } = default!;
    public string OrganizerEmail { get; set; } = default!;
    // Change this from IList<string> to IList<Recipient>
    public IList<Recipient> Recipients { get; set; } = []; // Changed name to Recipients (plural)
    public string Message { get; set; } = default!;
}