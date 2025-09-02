using AspNetCoreRateLimit;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using NotificationService.Data;
using NotificationService.Services;
using NotificationService.Validation;
using System.Security.Claims;
using System.Text.Encodings.Web;

var builder = WebApplication.CreateBuilder(args);

// ── add controllers + validation ───────────────────────────────
builder.Services.AddControllers()
       .AddFluentValidation(cfg =>
           cfg.RegisterValidatorsFromAssemblyContaining<NotificationRequestValidator>());

// ── EF-Core (SQLite) ────────────────────────────────────────────
builder.Services.AddDbContext<NotificationDbContext>(opt =>
    opt.UseSqlite(builder.Configuration.GetConnectionString("Sqlite")));

// ── SMTP mail sender DI ─────────────────────────────────────────
builder.Services.AddScoped<IEmailSender, SmtpEmailSender>();

// ── Swagger/OpenAPI ────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ── simple API-key authentication ──────────────────────────────
builder.Services.AddAuthentication("ApiKey")
       .AddScheme<AuthenticationSchemeOptions, ApiKeyAuthHandler>("ApiKey", null);
builder.Services.AddAuthorization();

// ── rate limiting (per IP) ─────────────────────────────────────
builder.Services.AddMemoryCache();
builder.Services.Configure<IpRateLimitOptions>(builder.Configuration.GetSection("IpRateLimiting"));
builder.Services.AddInMemoryRateLimiting();
builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();

// --- REMOVE THIS LINE: builder.Services.AddDirectoryBrowser(); ---
// builder.Services.AddDirectoryBrowser();

var app = builder.Build();

// ── middleware pipeline ────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
// --- REMOVE THESE TWO LINES: ---
// app.UseStaticFiles();
// app.UseDefaultFiles();
app.UseIpRateLimiting();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
// API-key auth handler implementation
public class ApiKeyAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> opt,
        ILoggerFactory logger,
        UrlEncoder encoder,
        IConfiguration cfg)
    : AuthenticationHandler<AuthenticationSchemeOptions>(opt, logger, encoder)
{
    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue("x-api-key", out var key))
            return Task.FromResult(AuthenticateResult.Fail("Missing API key"));

        var good = cfg["ApiKey"];
        if (!string.Equals(key, good, StringComparison.Ordinal))
            return Task.FromResult(AuthenticateResult.Fail("Invalid API key"));

        var id = new ClaimsIdentity(Scheme.Name);
        var principal = new ClaimsPrincipal(id);
        var ticket = new AuthenticationTicket(principal, Scheme.Name);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
