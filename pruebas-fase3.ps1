# SCRIPT DE PRUEBAS FASE 3 - Integración Frontend-Backend
# Pruebas de los endpoints Flask desde PowerShell

$BASE_URL = "http://localhost:5000/api"
$TOKEN = ""
$HEADERS = @{
    "Content-Type" = "application/json"
}

# Colores para output
$Green = @{ ForegroundColor = "Green" }
$Red = @{ ForegroundColor = "Red" }
$Yellow = @{ ForegroundColor = "Yellow" }
$Cyan = @{ ForegroundColor = "Cyan" }

function Print-Header {
    param([string]$text)
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" @Cyan
    Write-Host "  $text" @Cyan
    Write-Host "═══════════════════════════════════════════════════════════════" @Cyan
}

function Print-Success {
    param([string]$text)
    Write-Host "✅ $text" @Green
}

function Print-Error {
    param([string]$text)
    Write-Host "❌ $text" @Red
}

function Print-Info {
    param([string]$text)
    Write-Host "ℹ️  $text" @Yellow
}

# ==================== PRUEBA 1: Conectividad ====================
Print-Header "PRUEBA 1: Verificar Conectividad del Servidor"

try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Print-Success "Servidor Flask conectado en puerto 5000"
    Write-Host "Respuesta: $(($response | ConvertFrom-Json).message)"
} catch {
    Print-Error "No se puede conectar a Flask en http://localhost:5000"
    Print-Error "Asegúrate de que el servidor está corriendo: python app.py"
    exit
}

# ==================== PRUEBA 2: Login ====================
Print-Header "PRUEBA 2: Autenticación - Login"

$loginData = @{
    email = "admin@hibo.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest `
        -Uri "$BASE_URL/auth/login" `
        -Method POST `
        -Headers $HEADERS `
        -Body $loginData `
        -TimeoutSec 10 `
        -ErrorAction Stop
    
    $loginResult = $response.Content | ConvertFrom-Json
    
    if ($loginResult.success) {
        Print-Success "Login exitoso"
        $TOKEN = $loginResult.data.token
        $USER = $loginResult.data.usuario
        Write-Host "  Usuario: $($USER.nombre_usuario)"
        Write-Host "  Rol: $($USER.rol)"
        Write-Host "  Token: $($TOKEN.Substring(0, 20))..."
    } else {
        Print-Error "Login fallido: $($loginResult.message)"
    }
} catch {
    Print-Error "Error en login: $($_.Exception.Message)"
    exit
}

# Actualizar headers con token
$HEADERS_AUTH = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $TOKEN"
}

# ==================== PRUEBA 3: Verificar Token ====================
Print-Header "PRUEBA 3: Verificar Token JWT"

try {
    $response = Invoke-WebRequest `
        -Uri "$BASE_URL/auth/verify" `
        -Method GET `
        -Headers $HEADERS_AUTH `
        -TimeoutSec 10 `
        -ErrorAction Stop
    
    $verifyResult = $response.Content | ConvertFrom-Json
    
    if ($verifyResult.success) {
        Print-Success "Token válido"
        Write-Host "  Token válido hasta: $($verifyResult.data.expires_at)"
    } else {
        Print-Error "Token inválido: $($verifyResult.message)"
    }
} catch {
    Print-Error "Error verificando token: $($_.Exception.Message)"
}

# ==================== PRUEBA 4: Obtener Platos ====================
Print-Header "PRUEBA 4: Obtener Platos (GET /api/platos)"

try {
    $response = Invoke-WebRequest `
        -Uri "$BASE_URL/platos?page=1&limit=5" `
        -Method GET `
        -Headers $HEADERS_AUTH `
        -TimeoutSec 10 `
        -ErrorAction Stop
    
    $platosResult = $response.Content | ConvertFrom-Json
    
    if ($platosResult.success) {
        Print-Success "Platos obtenidos: $($platosResult.data.Count) registros"
        Write-Host ""
        Write-Host "Primeros platos:"
        foreach ($plato in $platosResult.data | Select-Object -First 3) {
            Write-Host "  • $($plato.nombre) - €$($plato.precio_venta)"
        }
    } else {
        Print-Error "Error obteniendo platos: $($platosResult.message)"
    }
} catch {
    Print-Error "Error en GET /platos: $($_.Exception.Message)"
}

# ==================== PRUEBA 5: Obtener Ingredientes ====================
Print-Header "PRUEBA 5: Obtener Ingredientes (GET /api/ingredientes)"

try {
    $response = Invoke-WebRequest `
        -Uri "$BASE_URL/ingredientes?page=1&limit=5" `
        -Method GET `
        -Headers $HEADERS_AUTH `
        -TimeoutSec 10 `
        -ErrorAction Stop
    
    $ingredientesResult = $response.Content | ConvertFrom-Json
    
    if ($ingredientesResult.success) {
        Print-Success "Ingredientes obtenidos: $($ingredientesResult.data.Count) registros"
        Write-Host ""
        Write-Host "Primeros ingredientes:"
        foreach ($ing in $ingredientesResult.data | Select-Object -First 3) {
            Write-Host "  • $($ing.nombre) - €$($ing.coste_unitario)"
        }
    } else {
        Print-Error "Error obteniendo ingredientes: $($ingredientesResult.message)"
    }
} catch {
    Print-Error "Error en GET /ingredientes: $($_.Exception.Message)"
}

# ==================== PRUEBA 6: Obtener Escandallos ====================
Print-Header "PRUEBA 6: Obtener Escandallos (GET /api/escandallos)"

try {
    $response = Invoke-WebRequest `
        -Uri "$BASE_URL/escandallos?page=1&limit=5" `
        -Method GET `
        -Headers $HEADERS_AUTH `
        -TimeoutSec 10 `
        -ErrorAction Stop
    
    $escandallosResult = $response.Content | ConvertFrom-Json
    
    if ($escandallosResult.success) {
        Print-Success "Escandallos obtenidos: $($escandallosResult.data.Count) registros"
        if ($escandallosResult.data.Count -gt 0) {
            Write-Host ""
            Write-Host "Escandallo encontrado:"
            $escandallo = $escandallosResult.data[0]
            Write-Host "  • $($escandallo.nombre)"
            Write-Host "  • Coste Total: €$($escandallo.coste_total)"
            Write-Host "  • Items: $($escandallo.items.Count)"
        }
    } else {
        Print-Error "Error obteniendo escandallos: $($escandallosResult.message)"
    }
} catch {
    Print-Error "Error en GET /escandallos: $($_.Exception.Message)"
}

# ==================== PRUEBA 7: Obtener Controles APPCC ====================
Print-Header "PRUEBA 7: Obtener Controles APPCC (GET /api/controles)"

try {
    $response = Invoke-WebRequest `
        -Uri "$BASE_URL/controles?page=1&limit=5" `
        -Method GET `
        -Headers $HEADERS_AUTH `
        -TimeoutSec 10 `
        -ErrorAction Stop
    
    $controlesResult = $response.Content | ConvertFrom-Json
    
    if ($controlesResult.success) {
        Print-Success "Controles obtenidos: $($controlesResult.data.Count) registros"
        if ($controlesResult.data.Count -gt 0) {
            Write-Host ""
            Write-Host "Controles APPCC:"
            foreach ($control in $controlesResult.data | Select-Object -First 3) {
                Write-Host "  • $($control.nombre) ($($control.tipo_control))"
            }
        }
    } else {
        Print-Error "Error obteniendo controles: $($controlesResult.message)"
    }
} catch {
    Print-Error "Error en GET /controles: $($_.Exception.Message)"
}

# ==================== PRUEBA 8: Obtener Estadísticas ====================
Print-Header "PRUEBA 8: Obtener Estadísticas Globales (GET /api/stats)"

try {
    $response = Invoke-WebRequest `
        -Uri "$BASE_URL/stats" `
        -Method GET `
        -Headers $HEADERS_AUTH `
        -TimeoutSec 10 `
        -ErrorAction Stop
    
    $statsResult = $response.Content | ConvertFrom-Json
    
    if ($statsResult.success) {
        Print-Success "Estadísticas obtenidas"
        Write-Host ""
        Write-Host "Resumen de datos:"
        Write-Host "  • Platos: $($statsResult.data.total_platos)"
        Write-Host "  • Ingredientes: $($statsResult.data.total_ingredientes)"
        Write-Host "  • Escandallos: $($statsResult.data.total_escandallos)"
        Write-Host "  • Controles APPCC: $($statsResult.data.total_controles)"
        Write-Host "  • Usuarios: $($statsResult.data.total_usuarios)"
    } else {
        Print-Error "Error obteniendo estadísticas: $($statsResult.message)"
    }
} catch {
    Print-Error "Error en GET /stats: $($_.Exception.Message)"
}

# ==================== RESUMEN FINAL ====================
Print-Header "RESUMEN DE PRUEBAS"

Print-Success "Todas las pruebas completadas"
Write-Host ""
Write-Host "✨ Próximos pasos:"
Write-Host "  1. Abre http://localhost:3000/login.html en tu navegador"
Write-Host "  2. Inicia sesión con admin@hibo.com / admin123"
Write-Host "  3. Verifica que los datos se cargan correctamente"
Write-Host "  4. Abre F12 y mira la consola para los logs"
Write-Host ""
Write-Host "📁 Archivos importantes:"
Write-Host "  • /public/api-client.js - Cliente API"
Write-Host "  • /public/integracion-flask.js - Integración"
Write-Host "  • /public/login.html - Página de login"
Write-Host "  • /hibo-cocina-hybrid/app.py - Backend Flask"
Write-Host ""
