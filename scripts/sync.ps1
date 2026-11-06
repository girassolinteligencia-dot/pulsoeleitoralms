# Script de Sincronização Automática - PULSO ELEITORAL MS
$message = $args[0]
if (-not $message) {
    $message = "update: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
}

Write-Host "🚀 Iniciando sincronização com GitHub..." -ForegroundColor Cyan

git add .
git commit -m "$message"
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Sincronização concluída com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Falha na sincronização. Verifique se há conflitos ou permissões." -ForegroundColor Red
}
