# 🚀 Configuraciones de Entorno

## Entornos Disponibles

### 🔧 Local Development (Backend npm run start:dev)
- **Backend**: Conecta al backend local en `http://localhost:3000`
- **Proxy**: Reescribe `/api/*` → `/*`
- **Comando**: `nx run orbyt:serve:development`

### 🐳 Docker Development (Backend en contenedor)
- **Backend**: Conecta al backend Docker en `http://localhost:3000`
- **Proxy**: Reescribe `/api/*` → `/*`
- **Comando**: `nx run orbyt:serve:docker`

### 🚀 Production
- **Backend**: Conecta al backend de producción
- **Comando**: `nx run orbyt:serve:production`

## Comandos Corregidos

```bash
# Desarrollo local (backend npm run start:dev en backoffice-hub)
nx run orbyt:serve:development

# Desarrollo con Docker (backend en contenedor)
nx run orbyt:serve:docker

# Producción
nx run orbyt:serve:production
```

## Cómo Funciona el Proxy

El frontend hace llamadas como:
- `http://localhost:4200/api/auth/login`

El proxy intercepta y transforma:
- `/api/auth/login` → `http://localhost:3000/auth/login`

## URLs Reales del Backend

- **Login**: `POST /auth/login` 
- **Profile**: `GET /auth/profile`
- **Users**: `GET /users`
- **Clients**: `GET /clients`

## Credenciales de Prueba
- **Admin Peluquería**: `peluqueria@glamour.com` / `12345678`
- **Admin Oftalmología**: `oftalmologia@vision.com` / `12345678`
- **Estilista**: `estilista@glamour.com` / `12345678`

## Testing

1. **Backend Docker debe estar corriendo**:
   ```bash
   cd /c/repositories/orbyt-repositories/backoffice-hub
   docker-compose ps
   ```

2. **Frontend para Docker**:
   ```bash
   cd /c/repositories/orbyt-repositories/orbyt/orbyt
   nx run orbyt:serve:docker
   ```

3. **Acceder a**: `http://localhost:4200`
