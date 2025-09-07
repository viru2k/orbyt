# 🚀 Configuración de Puertos de Desarrollo

## 📡 Puertos Asignados

- **orbyt** (Frontend principal): `http://localhost:4200`
- **orbyt-landing** (Landing page): `http://localhost:4201`

## 🛠️ Comandos de Desarrollo

### Ejecutar Orbyt Principal (Puerto 4200)
```bash
npm start
# o
npm run start:orbyt
# o
npx nx serve orbyt
```

### Ejecutar Orbyt Landing (Puerto 4201)
```bash
npm run start:landing
# o
npx nx serve orbyt-landing
```

### Ejecutar Ambos Proyectos Simultáneamente

#### Terminal 1:
```bash
npm start
```

#### Terminal 2:
```bash
npm run start:landing
```

## 🔧 Configuración

Los puertos están configurados en:
- **orbyt**: `project.json` → `serve.options.port: 4200`
- **orbyt-landing**: `orbyt-landing/project.json` → `serve.options.port: 4201`

## 📋 Scripts Disponibles

| Comando | Descripción | Puerto |
|---------|-------------|--------|
| `npm start` | Ejecutar orbyt principal | 4200 |
| `npm run start:landing` | Ejecutar orbyt-landing | 4201 |
| `npm run start:orbyt` | Ejecutar orbyt (explícito) | 4200 |
| `npm run build:orbyt` | Build orbyt | - |
| `npm run build:landing` | Build orbyt-landing | - |

## ✅ Verificación

1. **Orbyt Principal**: http://localhost:4200
2. **Orbyt Landing**: http://localhost:4201

Ambos proyectos pueden ejecutarse simultáneamente sin conflictos de puertos.