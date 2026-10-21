using System.Text.Json;
using System.Text.Json.Serialization;
using maxxing_app.Auth;
using maxxing_app.Data;
using maxxing_app;
using maxxing_app.Email;
using maxxing_app.Localization;
using maxxing_app.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Localization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>("database");

// Kimlik doğrulama: JWT
var jwtSection = builder.Configuration.GetSection(JwtOptions.SectionName);
var jwt = jwtSection.Get<JwtOptions>() ?? new JwtOptions();
if (jwt.Key.Length < 32)
    throw new InvalidOperationException("Jwt:Key ayarlanmamış ya da 32 karakterden kısa.");

builder.Services.Configure<JwtOptions>(jwtSection);
builder.Services.AddSingleton<TokenService>();
builder.Services.AddSingleton<IPasswordHasher<User>, PasswordHasher<User>>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Claim adları token'daki gibi kalsın ("sub", "unique_name").
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = jwt.GetSigningKey(),
            NameClaimType = JwtRegisteredClaimNames.UniqueName,
        };
        options.Events = new JwtBearerEvents
        {
            // E-posta doğrulamadan önce verilmiş token'larda bu claim yok; geçersiz sayılır, kullanıcı bir kez yeniden giriş yapar.
            OnTokenValidated = context =>
            {
                if (context.Principal?.HasClaim(c => c.Type == AuthPolicies.EmailVerifiedClaim) != true)
                    context.Fail("Token'da e-posta onay bilgisi yok.");
                return Task.CompletedTask;
            },
        };
    });
builder.Services.AddAuthorizationBuilder()
    // [Authorize]: giriş yapmış ve e-postasını onaylamış olmak gerekir.
    .SetDefaultPolicy(new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .RequireClaim(AuthPolicies.EmailVerifiedClaim, "true")
        .Build())
    .AddPolicy(AuthPolicies.AllowUnverified, policy => policy.RequireAuthenticatedUser());

// E-posta: kodlar ve gönderim
var emailSection = builder.Configuration.GetSection(EmailOptions.SectionName);
var email = emailSection.Get<EmailOptions>() ?? new EmailOptions();
if (string.IsNullOrWhiteSpace(email.FromAddress))
    throw new InvalidOperationException("Email:FromAddress ayarlanmamış.");

builder.Services.Configure<EmailOptions>(emailSection);
if (string.Equals(email.Provider, "Brevo", StringComparison.OrdinalIgnoreCase))
{
    if (string.IsNullOrWhiteSpace(email.BrevoApiKey))
        throw new InvalidOperationException("Email:BrevoApiKey ayarlanmamış.");
    builder.Services.AddHttpClient<IEmailSender, BrevoEmailSender>();
}
else
{
    if (string.IsNullOrWhiteSpace(email.SmtpHost))
        throw new InvalidOperationException("Email:SmtpHost ayarlanmamış.");
    builder.Services.AddSingleton<IEmailSender, SmtpEmailSender>();
}
builder.Services.AddScoped<EmailCodeService>();

// Expo web istemcisinin API'ye istek atabilmesi için
var corsOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(corsOrigins).AllowAnyHeader().AllowAnyMethod()));

// Dil: Accept-Language başlığına göre Türkçe ya da İngilizce (Localization/Languages.cs).
// Metinler Resources/SharedResource*.resx içinde; doğrulama mesajları (ErrorMessage) da oradan çevrilir.
builder.Services.AddLocalization(options => options.ResourcesPath = "Resources");

builder.Services.AddControllers()
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase)))
    .AddDataAnnotationsLocalization(options =>
        options.DataAnnotationLocalizerProvider = (_, factory) => factory.Create(typeof(SharedResource)));
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Bekleyen migration'lar açılışta uygulanır (development ve production). API tek kopya çalıştığı sürece güvenli;
// birden fazla kopyaya çıkılırsa migration ayrı bir adımda uygulanmalı.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
}

app.UseHttpsRedirection();

app.UseRequestLocalization(options =>
{
    options.SetDefaultCulture(Languages.Default)
        .AddSupportedCultures(Languages.Supported)
        .AddSupportedUICultures(Languages.Supported);
    // Sadece Accept-Language; "tr-TR" gibi bölgeli değerler "tr"ye düşer, desteklenmeyen diller varsayılana (İngilizce).
    options.RequestCultureProviders = [new AcceptLanguageHeaderRequestCultureProvider()];
});

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
