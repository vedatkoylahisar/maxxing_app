using System.ComponentModel.DataAnnotations;

namespace maxxing_app.Contracts;

public record CreateGroupRequest(
    [Required(ErrorMessage = "Grup adı gerekli.")]
    [MaxLength(40, ErrorMessage = "Grup adı en fazla 40 karakter olabilir.")]
    string Name);

public record JoinGroupRequest(
    [Required(ErrorMessage = "Davet kodu gerekli.")]
    [MaxLength(16, ErrorMessage = "Geçerli bir davet kodu gir.")]
    string Code);

public record GroupResponse(Guid Id, string Name, string InviteCode, int MemberCount, bool IsOwner);

// Grupta görünen sadece özet: rutin adları ve notlar paylaşılmaz.
public record GroupMemberResponse(
    Guid UserId,
    string UserName,
    bool IsMe,
    bool IsOwner,
    int CompletedCount,
    int TotalCount,
    bool TodayCompleted,
    int Streak);

public record GroupDetailResponse(
    Guid Id,
    string Name,
    string InviteCode,
    bool IsOwner,
    IReadOnlyList<GroupMemberResponse> Members);
