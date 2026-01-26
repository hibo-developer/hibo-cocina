# 📝 Guía de Deployment

## Configuración de Secrets

Para habilitar el deploy automático, configura los siguientes secrets en GitHub:

### Secrets Requeridos

#### Para Azure Web App
- `AZURE_WEBAPP_NAME`: Nombre de tu Azure Web App
- `AZURE_WEBAPP_PUBLISH_PROFILE`: Perfil de publicación (descárgalo desde Azure Portal)

#### Para Servidor Propio (SSH)
- `DEPLOY_HOST`: IP o dominio del servidor (ej: `staging.midominio.com`)
- `DEPLOY_USER`: Usuario SSH (ej: `deploy`)
- `DEPLOY_SSH_KEY`: Clave privada SSH (contenido completo del archivo)
- `STAGING_URL`: URL de staging (opcional, para logs)
- `PRODUCTION_URL`: URL de producción (opcional, para logs)

### Cómo Configurar Secrets

1. GitHub → Repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Añade cada secret con su valor correspondiente

## Workflows Disponibles

### 1. Deploy Automático (por Release)
Se dispara automáticamente al publicar un release y despliega la versión tagged a producción.

### 2. Deploy Manual
Ir a GitHub → Actions → Deploy to Production → Run workflow, selecciona staging o production, y despliega la última imagen (latest) al entorno elegido.

## Deploy Manual (sin GitHub Actions)

### Azure Web App
```bash
# Login a Azure
az login

# Configurar Web App para contenedores
az webapp config container set \
  --name hibo-cocina-app \
  --resource-group hibo-cocina-rg \
  --docker-custom-image-name ghcr.io/hibo-developer/hibo-cocina:latest \
  --docker-registry-server-url https://ghcr.io \
  --docker-registry-server-user hibo-developer \
  --docker-registry-server-password $GHCR_PAT

# Reiniciar
az webapp restart --name hibo-cocina-app --resource-group hibo-cocina-rg
```

### Servidor Propio (SSH)
```bash
# Conectar vía SSH
ssh user@tu-servidor.com

# Login a GHCR
echo $GHCR_PAT | docker login ghcr.io -u hibo-developer --password-stdin

# Pull imagen
docker pull ghcr.io/hibo-developer/hibo-cocina:latest

# Parar y eliminar contenedor anterior
docker stop hibo-cocina && docker rm hibo-cocina

# Arrancar nuevo contenedor
docker run -d \
  --name hibo-cocina \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e REDIS_ENABLED=true \
  -e REDIS_HOST=localhost \
  -v /data/hibo-cocina:/app/data \
  --restart unless-stopped \
  ghcr.io/hibo-developer/hibo-cocina:latest

# Verificar salud
curl http://localhost:3000/api/health
```

### Docker Compose en Servidor
```bash
# Crear docker-compose.prod.yml en servidor con este contenido y luego ejecutar los comandos
# docker-compose -f docker-compose.prod.yml up -d
# docker-compose -f docker-compose.prod.yml logs -f app
```

## Verificación Post-Deploy

```bash
# Health check
curl https://tu-dominio.com/api/health

# Endpoints API
curl https://tu-dominio.com/api/platos

# Logs del contenedor
docker logs -f hibo-cocina
```

## Rollback

```bash
# Deploy de versión anterior
docker pull ghcr.io/hibo-developer/hibo-cocina:v2.10.0
docker stop hibo-cocina && docker rm hibo-cocina
docker run -d --name hibo-cocina -p 3000:3000 ghcr.io/hibo-developer/hibo-cocina:v2.10.0
```

## Monitoreo

```bash
# Stats en tiempo real
docker stats hibo-cocina

# Logs
docker logs -f hibo-cocina --tail 100
```
