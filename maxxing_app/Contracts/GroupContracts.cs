using System.ComponentModel.DataAnnotations;

namespace maxxing_app.Contracts;

public record CreateGroupRequest(
    [Required(ErrorMessage = "GroupNameRequired")]
    [MaxLength(40, ErrorMessage = "GroupNameTooLong")]
    string Name);

public record JoinGroupRequest(
    [Required(ErrorMessage = "InviteCodeRequired")]
    [MaxLength(16, ErrorMessage = "InviteCodeInvalid")]
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
