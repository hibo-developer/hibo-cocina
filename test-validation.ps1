#!/usr/bin/env pwsh

# Script de prueba de validación con curl

Write-Host "`n🧪 Iniciando pruebas de validación con curl...`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000/api"
$passed = 0
$failed = 0

# Test 1: POST sin nombre (debería fallar validación)
Write-Host "Test 1: POST /api/platos - Falta nombre"
$response = Invoke-WebRequest -Uri "$baseUrl/platos" -Method Post -Body (@{codigo = "TEST001"} | ConvertTo-Json) -ContentType "application/json" -ErrorAction SilentlyContinue
if ($response.StatusCode -eq 400) {
    Write-Host "✅ Pasó - Status 400" -ForegroundColor Green
    $passed++
} else {
    Write-Host "❌ Falló - Status $($response.StatusCode)" -ForegroundColor Red
    $failed++
}

# Test 2: POST con datos válidos
Write-Host "`nTest 2: POST /api/platos - Válido"
$response = Invoke-WebRequest -Uri "$baseUrl/platos" -Method Post -Body (@{codigo = "PASTA001"; nombre = "Pasta al Dente"; pvp = 12.50} | ConvertTo-Json) -ContentType "application/json" -ErrorAction SilentlyContinue
if ($response.StatusCode -eq 201) {
    Write-Host "✅ Pasó - Status 201" -ForegroundColor Green
    $passed++
} else {
    Write-Host "❌ Falló - Status $($response.StatusCode)" -ForegroundColor Red
    $failed++
}

# Test 3: GET sin validación
Write-Host "`nTest 3: GET /api/platos"
$response = Invoke-WebRequest -Uri "$baseUrl/platos" -Method Get -ErrorAction SilentlyContinue
if ($response.StatusCode -eq 200) {
    Write-Host "✅ Pasó - Status 200" -ForegroundColor Green
    $passed++
} else {
    Write-Host "❌ Falló - Status $($response.StatusCode)" -ForegroundColor Red
    $failed++
}

# Test 4: POST ingrediente sin nombre
Write-Host "`nTest 4: POST /api/ingredientes - Falta nombre"
$response = Invoke-WebRequest -Uri "$baseUrl/ingredientes" -Method Post -Body (@{} | ConvertTo-Json) -ContentType "application/json" -ErrorAction SilentlyContinue
if ($response.StatusCode -eq 400) {
    Write-Host "✅ Pasó - Status 400" -ForegroundColor Green
    $passed++
} else {
    Write-Host "❌ Falló - Status $($response.StatusCode)" -ForegroundColor Red
    $failed++
}

# Test 5: Health check
Write-Host "`nTest 5: GET /api/health"
$response = Invoke-WebRequest -Uri "$baseUrl/health" -Method Get -ErrorAction SilentlyContinue
if ($response.StatusCode -eq 200) {
    Write-Host "✅ Pasó - Status 200" -ForegroundColor Green
    $passed++
} else {
    Write-Host "❌ Falló - Status $($response.StatusCode)" -ForegroundColor Red
    $failed++
}

Write-Host "`n📊 Resultados: $passed pasadas, $failed fallidas`n" -ForegroundColor Cyan
