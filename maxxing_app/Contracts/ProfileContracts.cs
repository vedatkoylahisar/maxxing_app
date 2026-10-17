using System.ComponentModel.DataAnnotations;
using maxxing_app.Profiles;

namespace maxxing_app.Contracts;

public record UpdateProfileRequest(
    [MaxLength(40, ErrorMessage = "Ad en fazla 40 karakter olabilir.")] string? DisplayName,
    [MaxLength(160, ErrorMessage = "Bio en fazla 160 karakter olabilir.")] string? Bio,
    [MaxLength(6, ErrorMessage = "En fazla 6 alan seçebilirsin.")] List<string>? Areas);

public record ChangePasswordRequest(
    [Required(ErrorMessage = "Mevcut şifreni gir.")] string CurrentPassword,
    [Required(ErrorMessage = "Yeni şifre gerekli.")]
    [MinLength(8, ErrorMessage = "Şifre en az 8 karakter olmalı.")]
    [MaxLength(128, ErrorMessage = "Şifre en fazla 128 karakter olabilir.")]
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
