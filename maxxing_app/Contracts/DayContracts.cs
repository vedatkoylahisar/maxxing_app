using System.ComponentModel.DataAnnotations;
using maxxing_app.Models;

namespace maxxing_app.Contracts;

public record SetEntryRequest(
    [Range(0, 1_000_000, ErrorMessage = "Değer 0 ile 1.000.000 arasında olmalı.")] int Value);

public record SetNoteRequest(
    [MaxLength(2000, ErrorMessage = "Not en fazla 2000 karakter olabilir.")] string? Text);

public record DayRoutineResponse(
    Guid Id,
    string Name,
    RoutineType Type,
    int? Target,
    string? Unit,
    int Value,
    bool Completed,
    int Streak);

public record DayResponse(
    DateOnly Date,
    bool IsToday,
    bool IsEditable,
    IReadOnlyList<DayRoutineResponse> Routines,
    string? Note,
    int CompletedCount,
    int TotalCount,
    StreakResponse Streak);

// Current: aksatmadan geçen gün sayısı. Bugün henüz bitmediyse dünden geriye sayılır.
public record StreakResponse(int Current, bool TodayCompleted);

public record DaySummaryResponse(DateOnly Date, int CompletedCount, int TotalCount);
