namespace maxxing_app;

// Kullanıcıya giden tüm API metinleri (hata mesajları, doğrulama, mail) tek bir kaynakta:
// Resources/SharedResource.resx (İngilizce, varsayılan) ve Resources/SharedResource.tr.resx (Türkçe).
// Kullanım: IStringLocalizer<SharedResource> localizer → localizer["EmailTaken"].
// Contracts'taki ErrorMessage değerleri de bu kaynaktaki anahtarlardır.
// Bu dosya Resources/ klasörüne taşınmamalı: aynı klasörde olursa .resx sınıfın adıyla gömülür ve metinler bulunamaz.
public class SharedResource;
