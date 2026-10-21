# API'nin production imajı (Render). Derleme bağlamı bu klasör: docker build -t maxxing-api maxxing_app
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY maxxing_app.csproj .
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
# Render isteği bu porta yönlendirir (Render'da PORT=8080 ayarlanır).
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "maxxing_app.dll"]
