using System.ComponentModel.DataAnnotations;
using maxxing_app.Models;

namespace maxxing_app.Contracts;

public record CreateRoutineRequest(
    [Required(ErrorMessage = "Rutin adı gerekli.")]
    [MaxLength(40, ErrorMessage = "Rutin adı en fazla 40 karakter olabilir.")]
    string Name,
    [Required(ErrorMessage = "Rutin türü gerekli.")] RoutineType? Type,
    [Range(1, 1_000_000, ErrorMessage = "Hedef 1 ile 1.000.000 arasında olmalı.")] int? Target,
    [MaxLength(16, ErrorMessage = "Birim en fazla 16 karakter olabilir.")] string? Unit);

// Rutinin türü sonradan değiştirilemez; geçmiş kayıtların anlamı bozulur.
public record UpdateRoutineRequest(
    [Required(ErrorMessage = "Rutin adı gerekli.")]
    [MaxLength(40, ErrorMessage = "Rutin adı en fazla 40 karakter olabilir.")]
    string Name,
    [Range(1, 1_000_000, ErrorMessage = "Hedef 1 ile 1.000.000 arasında olmalı.")] int? Target,
    [MaxLength(16, ErrorMessage = "Birim en fazla 16 karakter olabilir.")] string? Unit);

public record RoutineResponse(Guid Id, string Name, RoutineType Type, int? Target, string? Unit, DateOnly StartDate);
