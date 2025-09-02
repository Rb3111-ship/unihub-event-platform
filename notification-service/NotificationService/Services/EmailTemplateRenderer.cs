namespace NotificationService.Services;

public static class EmailTemplateRenderer
{
    // Add an optional 'recipientName' parameter
    public static string Render(string eventName, string plain, string? recipientName = null)
    {
        // If a name is provided, use it in the greeting, otherwise use a generic greeting.
        var greeting = string.IsNullOrWhiteSpace(recipientName) ? "Hello" : $"Hello {recipientName}";

        return $$"""
            <html>
              <body style="font-family:sans-serif">
                <p>{{greeting}},</p>
                <h2>{{eventName}}</h2>
                <p>{{plain}}</p>
                <hr/>
                <small>UniHub Notification Service</small>
              </body>
            </html>
            """;
    }
}