using System.ComponentModel.DataAnnotations;
using maxxing_app.Profiles;

namespace maxxing_app.Contracts;

public record UpdateProfileRequest(
    [MaxLength(40, ErrorMessage = "DisplayNameTooLong")] string? DisplayName,
    [MaxLength(160, ErrorMessage = "BioTooLong")] string? Bio,
    [MaxLength(6, ErrorMessage = "TooManyAreas")] List<string>? Areas);

public record ChangePasswordRequest(
    [Required(ErrorMessage = "CurrentPasswordRequired")] string CurrentPassword,
    [Required(ErrorMessage = "NewPasswordRequired")]
    [MinLength(8, ErrorMessage = "PasswordTooShort")]
    [MaxLength(128, ErrorMessage = "PasswordTooLong")]
    string NewPassword);

// Key: listedeki alanın anahtarı; kullanıcının kendi yazdığı alanda null.
public record AreaResponse(string? Key, string Label);

public record ProfileStatsResponse(int CurrentStreak, int LongestStreak, int CompletedDays, DateTime MemberSince);

// Email sadece kişinin kendi profilinde dolu.
public record ProfileResponse(
    Guid UserId,
    string UserName,
    string? DisplayName,
    string? Bio,
    IReadOnlyList<AreaResponse> Areas,
    ProfileStatsResponse Stats,
    bool IsMe,
    string? Email);

public record AreaCatalogResponse(string Key, string Label, IReadOnlyList<RoutineSuggestion> Suggestions);
