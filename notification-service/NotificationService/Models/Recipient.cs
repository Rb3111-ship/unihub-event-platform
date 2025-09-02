namespace NotificationService.Models;

public class Recipient
{
    public string Email { get; set; } = default!;
    public string? Name { get; set; } // Make it nullable as a name might not always be available
}