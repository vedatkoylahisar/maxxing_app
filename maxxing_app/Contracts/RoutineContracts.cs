using System.ComponentModel.DataAnnotations;
using maxxing_app.Models;

namespace maxxing_app.Contracts;

public record CreateRoutineRequest(
    [Required(ErrorMessage = "RoutineNameRequired")]
    [MaxLength(40, ErrorMessage = "RoutineNameTooLong")]
    string Name,
    [Required(ErrorMessage = "RoutineTypeRequired")] RoutineType? Type,
    [Range(1, 1_000_000, ErrorMessage = "TargetRange")] int? Target,
    [MaxLength(16, ErrorMessage = "UnitTooLong")] string? Unit);

// Rutinin türü sonradan değiştirilemez; geçmiş kayıtların anlamı bozulur.
public record UpdateRoutineRequest(
    [Required(ErrorMessage = "RoutineNameRequired")]
    [MaxLength(40, ErrorMessage = "RoutineNameTooLong")]
    string Name,
    [Range(1, 1_000_000, ErrorMessage = "TargetRange")] int? Target,
    [MaxLength(16, ErrorMessage = "UnitTooLong")] string? Unit);

public record RoutineResponse(Guid Id, string Name, RoutineType Type, int? Target, string? Unit, DateOnly StartDate);
