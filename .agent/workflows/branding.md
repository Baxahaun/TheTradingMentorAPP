---
description: Cambiar el branding completo de Trading Mentor (nombre, colores, logos)
---

# Workflow: Cambio de Branding - Trading Mentor

Este workflow guía el proceso de personalizar el branding de la aplicación.

## Información Requerida

Antes de comenzar, necesitas definir:
- [ ] **Nombre de la app**: (ej: "Trading Mentor", "MyTradingJournal")
- [ ] **Tagline/Descripción**: (ej: "Tu diario de trading profesional")
- [ ] **Color primario**: En formato HEX (ej: #6366f1 para indigo)
- [ ] **Logo**: Archivo PNG/SVG para favicon y header
- [ ] **Nombre del score**: Reemplazar "Zella Score" por otro nombre

---

## Paso 1: Actualizar Metadatos HTML

Editar `index.html`:

```html
<!-- Línea 6 - Título -->
<title>TU_NOMBRE_APP</title>

<!-- Línea 7 - Descripción -->
<meta name="description" content="TU_DESCRIPCION" />

<!-- Línea 8 - Autor -->
<meta name="author" content="TU_EMPRESA" />

<!-- Líneas 10-17 - Open Graph y Twitter -->
<meta property="og:title" content="TU_NOMBRE_APP" />
<meta property="og:description" content="TU_DESCRIPCION" />
<meta property="og:image" content="URL_DE_TU_LOGO" />
<meta name="twitter:image" content="URL_DE_TU_LOGO" />
```

---

## Paso 2: Actualizar Constantes de la App

Editar `src/lib/constants.ts`:

```typescript
// Línea 9 - Nombre principal
export const APP_NAME = 'TU_NOMBRE_APP';

// Líneas 193-198 - Cambiar prefijo de localStorage (opcional)
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'tu_app_user_preferences',
  DASHBOARD_LAYOUT: 'tu_app_dashboard_layout',
  THEME_PREFERENCE: 'tu_app_theme',
  RECENT_TRADES: 'tu_app_recent_trades',
  EXPORT_HISTORY: 'tu_app_export_history',
};
```

---

## Paso 3: Actualizar Variables de Entorno

Editar `.env`:

```env
VITE_APP_NAME=TU_NOMBRE_APP
```

---

## Paso 4: Actualizar Formulario de Login

Editar `src/components/AuthForm.tsx`:

```typescript
// Línea 106 - Cambiar título del login
<CardTitle className="text-2xl font-bold">TU_NOMBRE_APP</CardTitle>
```

---

## Paso 5: Renombrar "Zella Score" a Tu Score

### 5.1 Tipos
Editar `src/types/tradingPerformance.ts`:
```typescript
// Cambiar 'zellaScore' por 'mentorScore' (o tu nombre)
mentorScore: number;
```

Editar `src/types/widget.ts`:
```typescript
mentorScore: number;
```

### 5.2 Servicio de Métricas
Editar `src/services/TradingPerformanceService.ts`:
- Buscar y reemplazar `zellaScore` → `mentorScore`
- Buscar y reemplazar `calculateZellaScore` → `calculateMentorScore`

### 5.3 Dashboard
Editar `src/components/Dashboard.tsx`:
- Buscar y reemplazar `zellaScore` → `mentorScore`
- Buscar y reemplazar `Zella Score` → `Mentor Score`

Editar `src/components/Dashboard_v2.tsx`:
- Buscar y reemplazar `zellaScore` → `mentorScore`

### 5.4 Widget
Renombrar archivo:
```bash
mv src/components/widgets/ZellaScoreWidget.tsx src/components/widgets/MentorScoreWidget.tsx
```

Editar el widget renombrado:
- Cambiar nombre del componente
- Cambiar textos visibles

### 5.5 Registry de Widgets
Editar `src/lib/widgetRegistry.tsx`:
- Cambiar import y referencias
- Cambiar `id: 'zellaScore'` → `id: 'mentorScore'`
- Cambiar `title: 'Zella Score'` → `title: 'Mentor Score'`

Editar `src/config/widgetRegistry.ts`:
- Mismos cambios

Editar `src/config/dashboardConfig.tsx`:
- Buscar y reemplazar referencias

---

## Paso 6: Cambiar Favicon y Logo

### 6.1 Favicon
Reemplazar `public/favicon.ico` con tu icono.

Herramientas para crear favicon:
- https://realfavicongenerator.net/
- https://favicon.io/

### 6.2 Logo en Header (si existe)
Buscar componentes de header/navbar y reemplazar logo.

---

## Paso 7: Cambiar Colores

Editar `src/index.css` o el archivo de variables CSS:

```css
:root {
  /* Color primario - convertir HEX a HSL */
  --primary: 262 83% 58%;  /* Ejemplo: púrpura */
  --primary-foreground: 0 0% 100%;
  
  /* Color de acento */
  --accent: 220 90% 56%;
  
  /* Otros colores de marca */
  --ring: 262 83% 58%;
}
```

Herramienta para convertir HEX a HSL: https://htmlcolors.com/hex-to-hsl

### Colores adicionales en Tailwind
Editar `tailwind.config.ts` si necesitas colores custom:

```typescript
colors: {
  brand: {
    primary: '#TU_COLOR',
    secondary: '#TU_COLOR',
  }
}
```

---

## Paso 8: Actualizar Package.json (opcional)

Editar `package.json`:

```json
{
  "name": "tu-nombre-app",
  "version": "1.0.0",
  "description": "Tu descripción"
}
```

---

## Paso 9: Rebuild y Deploy

// turbo
```bash
# Rebuild
npm run build

# Deploy
firebase deploy
```

---

## Checklist Final

- [ ] `index.html` - Título y meta tags actualizados
- [ ] `src/lib/constants.ts` - APP_NAME cambiado
- [ ] `.env` - VITE_APP_NAME actualizado
- [ ] `AuthForm.tsx` - Título de login cambiado
- [ ] Score renombrado en todos los archivos
- [ ] Favicon reemplazado
- [ ] Colores CSS actualizados
- [ ] Build exitoso sin errores
- [ ] Deploy completado

---

## Archivos Afectados (Resumen)

```
├── index.html
├── .env
├── package.json
├── public/
│   └── favicon.ico
├── src/
│   ├── index.css
│   ├── lib/
│   │   ├── constants.ts
│   │   └── widgetRegistry.tsx
│   ├── config/
│   │   ├── widgetRegistry.ts
│   │   └── dashboardConfig.tsx
│   ├── components/
│   │   ├── AuthForm.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Dashboard_v2.tsx
│   │   └── widgets/
│   │       └── ZellaScoreWidget.tsx → MentorScoreWidget.tsx
│   ├── services/
│   │   └── TradingPerformanceService.ts
│   └── types/
│       ├── tradingPerformance.ts
│       └── widget.ts
└── tailwind.config.ts
```
