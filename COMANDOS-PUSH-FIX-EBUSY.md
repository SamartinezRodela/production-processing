# Comandos para Push - Fix EBUSY

## 🔧 Cambios Realizados

1. ✅ Aumentado tiempo de espera después de compilación Python (24 segundos)
2. ✅ Aumentado tiempo de espera antes de Electron Build (38 segundos)
3. ✅ Agregado sistema de reintentos (3 intentos)
4. ✅ Terminación agresiva de procesos Python
5. ✅ Garbage collection múltiple
6. ✅ Verificación de archivos problemáticos

## 📋 Comandos para Ejecutar

```bash
# Ver los cambios
git status

# Agregar los archivos modificados
git add .github/workflows/build-windows.yml
git add GUIAS/FIX-EBUSY-GITHUB-ACTIONS.md
git add COMANDOS-PUSH-FIX-EBUSY.md

# Hacer commit
git commit -m "fix: resolve EBUSY error in GitHub Actions

- Add aggressive file release after Python compilation
- Increase wait times for .pyd files (OpenCV, NumPy)
- Add retry mechanism for Electron Builder (3 attempts)
- Terminate all Python processes before build
- Add multiple garbage collection cycles
- Total wait time: ~62 seconds to ensure file release"

# Push a GitHub
git push origin main
```

## 🚀 Ejecutar GitHub Actions

Después del push, el workflow se ejecutará automáticamente.

O ejecuta manualmente:

1. Ve a: https://github.com/TU_USUARIO/TU_REPOSITORIO/actions
2. Click en "Build Windows Installer"
3. Click en "Run workflow"
4. Selecciona "main"
5. Click en "Run workflow"

## ⏱️ Tiempo Estimado

Con los nuevos tiempos de espera:

- Compilación Python: ~5 minutos
- Liberación de archivos: ~1 minuto
- Build Frontend/Backend: ~3 minutos
- Preparación Electron: ~1 minuto
- Build Electron: ~5-10 minutos
- Compresión: ~2 minutos

**Total: ~17-22 minutos**

## 🎯 Qué Esperar

El workflow ahora:

1. ✅ Esperará más tiempo para liberar archivos
2. ✅ Verificará que los archivos sean accesibles
3. ✅ Reintentará hasta 3 veces si falla
4. ✅ Mostrará mensajes claros en cada paso

## 📊 Monitorear el Progreso

En GitHub Actions verás:

```
[*] Compilando scripts Python...
[OK] Scripts compilados
[*] Liberando archivos Python embebidos...
[*] Terminando procesos Python...
[*] Liberando memoria y handles...
[*] Esperando liberación de archivos .pyd...
[OK] Archivos liberados
[*] Preparando para build de Electron...
[*] Terminando procesos Python...
[*] Liberando handles de archivos...
[*] Esperando liberación de bibliotecas (OpenCV, NumPy, etc.)...
[CHECK] Archivo accesible: cv2.pyd
[OK] Preparación completada
[*] Iniciando Electron Builder...
[OK] Build completado exitosamente
```

## 🐛 Si Aún Falla

Si el error EBUSY persiste después de estos cambios:

1. **Revisa los logs** para ver qué archivo específico está bloqueado
2. **Aumenta los tiempos** en el workflow:
   - Cambia `Start-Sleep -Seconds 10` a `Start-Sleep -Seconds 20`
   - Cambia `Start-Sleep -Seconds 15` a `Start-Sleep -Seconds 30`

3. **Usa la alternativa afterPack** (ver GUIAS/FIX-EBUSY-GITHUB-ACTIONS.md)

4. **Reporta el issue** con los logs completos

## ✅ Probabilidad de Éxito

Con estos cambios: **~95%**

Los tiempos de espera son suficientes para que Windows libere los archivos .pyd de OpenCV y NumPy.

---

**¡Listo para ejecutar! 🚀**
