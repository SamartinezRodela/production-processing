# ============================================================
# 🧪 TEST DE SEGURIDAD - Verificar Integridad
# ============================================================
# Este script prueba que la verificación de integridad funciona
# ============================================================

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "🧪 TEST DE SEGURIDAD - Verificación de Integridad" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que el backend está corriendo
Write-Host "🔍 Verificando que el backend esté corriendo..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/python/verify-integrity" -Method Get
    
    Write-Host "✅ Backend respondiendo correctamente" -ForegroundColor Green
    Write-Host ""
    
    # Mostrar resultados
    Write-Host "📊 RESULTADOS DE VERIFICACIÓN:" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📁 Ruta de scripts: $($response.scriptsPath)" -ForegroundColor White
    Write-Host "📦 Total de archivos: $($response.totalFiles)" -ForegroundColor White
    Write-Host ""
    
    $validCount = 0
    $modifiedCount = 0
    $missingCount = 0
    $errorCount = 0
    
    foreach ($file in $response.results.PSObject.Properties) {
        $fileName = $file.Name
        $fileInfo = $file.Value
        
        switch ($fileInfo.status) {
            "valid" {
                Write-Host "✅ $fileName" -ForegroundColor Green
                Write-Host "   Estado: Válido" -ForegroundColor Gray
                Write-Host "   Hash: $($fileInfo.expectedHash.Substring(0, 16))..." -ForegroundColor Gray
                $validCount++
            }
            "modified" {
                Write-Host "❌ $fileName" -ForegroundColor Red
                Write-Host "   Estado: MODIFICADO" -ForegroundColor Red
                Write-Host "   Hash esperado: $($fileInfo.expectedHash.Substring(0, 16))..." -ForegroundColor Gray
                Write-Host "   Hash actual:   $($fileInfo.actualHash.Substring(0, 16))..." -ForegroundColor Gray
                $modifiedCount++
            }
            "missing" {
                Write-Host "⚠️  $fileName" -ForegroundColor Yellow
                Write-Host "   Estado: NO ENCONTRADO" -ForegroundColor Yellow
                Write-Host "   Ruta: $($fileInfo.path)" -ForegroundColor Gray
                $missingCount++
            }
            "error" {
                Write-Host "❌ $fileName" -ForegroundColor Red
                Write-Host "   Estado: ERROR" -ForegroundColor Red
                Write-Host "   Error: $($fileInfo.error)" -ForegroundColor Gray
                $errorCount++
            }
        }
        Write-Host ""
    }
    
    # Resumen
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "📊 RESUMEN:" -ForegroundColor Cyan
    Write-Host "   ✅ Válidos:     $validCount" -ForegroundColor Green
    Write-Host "   ❌ Modificados: $modifiedCount" -ForegroundColor Red
    Write-Host "   ⚠️  Faltantes:   $missingCount" -ForegroundColor Yellow
    Write-Host "   ❌ Errores:     $errorCount" -ForegroundColor Red
    Write-Host ""
    
    # Resultado final
    if ($validCount -eq $response.totalFiles) {
        Write-Host "🎉 TODOS LOS ARCHIVOS SON VÁLIDOS" -ForegroundColor Green
        Write-Host "   La verificación de integridad está funcionando correctamente" -ForegroundColor Green
        Write-Host ""
        exit 0
    } else {
        Write-Host "⚠️  ALGUNOS ARCHIVOS TIENEN PROBLEMAS" -ForegroundColor Yellow
        Write-Host "   Revisa los archivos marcados arriba" -ForegroundColor Yellow
        Write-Host ""
        exit 1
    }
    
} catch {
    Write-Host "❌ Error conectando al backend" -ForegroundColor Red
    Write-Host "   Mensaje: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Asegúrate de que:" -ForegroundColor Yellow
    Write-Host "   1. El backend esté corriendo (npm run start:dev en nest-ui-be)" -ForegroundColor White
    Write-Host "   2. El backend esté en el puerto 3000" -ForegroundColor White
    Write-Host "   3. Los archivos .pyc existan en nest-files-py-embedded" -ForegroundColor White
    Write-Host ""
    exit 1
}
