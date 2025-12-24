---
description: Implementar backoffice SaaS completo para Trading Mentor
---

# Workflow: Backoffice SaaS - Trading Mentor

Este workflow guía la implementación del panel de administración y sistema de suscripciones para Trading Mentor.

## Requisitos Previos
- [ ] Cuenta Stripe creada con API keys
- [ ] Firebase Plan Blaze activado
- [ ] Productos/precios configurados en Stripe

---

## Fase 1: Sistema de Roles y Auth Admin (~4h)

### 1.1 Crear tipos de admin
// turbo
```bash
# Crear archivo de tipos
touch src/types/admin.ts
```

Contenido de `src/types/admin.ts`:
```typescript
export type AdminRole = 'super_admin' | 'admin' | 'support';

export type AdminPermission = 
  | 'users:read' | 'users:write' | 'users:delete'
  | 'subscriptions:read' | 'subscriptions:write'
  | 'challenges:read' | 'challenges:write'
  | 'support:read' | 'support:write'
  | 'settings:write';

export interface AdminUser {
  uid: string;
  role: AdminRole;
  permissions: AdminPermission[];
  createdAt: Date;
  createdBy: string;
}
```

### 1.2 Crear tipos de suscripción
Crear `src/types/subscription.ts`:
```typescript
export type SubscriptionPlan = 'starter' | 'trader' | 'prop' | 'fund';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';

export interface UserSubscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
}
```

### 1.3 Actualizar reglas de Firestore
Agregar a `firestore.rules`:
```javascript
match /admins/{userId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow write: if false; // Solo desde consola o Cloud Functions
}
```

### 1.4 Crear componente AdminRoute
Crear `src/components/AdminRoute.tsx` que verifique si el usuario es admin antes de renderizar rutas protegidas.

---

## Fase 2: Stripe y Planes de Suscripción (~5h)

### 2.1 Configurar Stripe Dashboard
1. Ir a https://dashboard.stripe.com/products
2. Crear productos:
   - Starter: $0/mes (free tier)
   - Trader: $15/mes
   - Prop: $29/mes
   - Fund: $99/mes
3. Copiar los Price IDs

### 2.2 Crear configuración de planes
Crear `src/config/plans.ts`:
```typescript
export const PLANS = {
  starter: {
    name: 'Starter',
    price: 0,
    priceId: null, // Gratis
    limits: { tradesPerMonth: 20, accounts: 1 },
    features: ['Analytics básicos', '1 cuenta de trading']
  },
  trader: {
    name: 'Trader',
    price: 15,
    priceId: 'price_xxx', // Reemplazar con Price ID real
    limits: { tradesPerMonth: Infinity, accounts: 3 },
    features: ['Trades ilimitados', '3 cuentas', 'Analytics avanzados']
  },
  prop: {
    name: 'Prop',
    price: 29,
    priceId: 'price_yyy',
    limits: { tradesPerMonth: Infinity, accounts: 10 },
    features: ['Todo en Trader', 'Prop Firm Challenges', 'Alertas', 'PDF Reports']
  },
  fund: {
    name: 'Fund',
    price: 99,
    priceId: 'price_zzz',
    limits: { tradesPerMonth: Infinity, accounts: Infinity },
    features: ['Todo en Prop', 'Multi-usuario', 'API Access', 'White-label']
  }
};
```

### 2.3 Crear Stripe Service
Crear `src/services/stripeService.ts` con funciones:
- `createCheckoutSession(priceId: string)`
- `createPortalSession()`
- `getSubscriptionStatus()`

### 2.4 Crear Cloud Functions para Webhooks
Crear `functions/src/stripeWebhooks.ts` para manejar:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

### 2.5 Crear página de precios
Crear `src/pages/PricingPage.tsx` con cards de planes y botones de checkout.

---

## Fase 3: Panel Admin Core (~6h)

### 3.1 Crear layout de admin
Crear `src/pages/admin/AdminLayout.tsx` con:
- Sidebar con navegación
- Header con info del admin
- Outlet para contenido

### 3.2 Crear dashboard
Crear `src/pages/admin/AdminDashboard.tsx` con métricas:
- **SaaS**: Usuarios totales, activos, MRR, Churn
- **Trading**: Total trades, win rate promedio, top pairs

### 3.3 Crear gestión de usuarios
Crear `src/pages/admin/AdminUsers.tsx` con:
- Tabla con búsqueda y filtros
- Acciones: ver perfil, cambiar plan, suspender
- Export CSV

### 3.4 Crear gestión de suscripciones
Crear `src/pages/admin/AdminSubscriptions.tsx`

### 3.5 Agregar rutas de admin
Modificar `src/App.tsx` para agregar rutas `/admin/*` protegidas con AdminRoute.

---

## Fase 4: Prop Firm Challenges (~4h)

### 4.1 Crear tipos de challenge
Crear `src/types/challenge.ts`

### 4.2 Crear página de gestión
Crear `src/pages/admin/AdminChallenges.tsx`:
- CRUD de templates
- Prop firms preconfiguradas (FTMO, MyForexFunds, etc.)
- Estadísticas de aprobación

### 4.3 Crear servicio de alertas
Crear `src/services/challengeAlerts.ts` para detectar usuarios en riesgo.

---

## Fase 5: Sistema de Soporte (~4h)

### 5.1 Crear tipos de soporte
Crear `src/types/support.ts`

### 5.2 Crear página de admin
Crear `src/pages/admin/AdminSupport.tsx`

### 5.3 Crear página de usuario
Crear `src/pages/user/SupportPage.tsx`

### 5.4 Crear base de conocimiento
Crear `src/pages/admin/AdminKnowledgeBase.tsx`

---

## Fase 6: Onboarding (~3h)

### 6.1 Crear configuración de onboarding
Crear `src/pages/admin/AdminOnboarding.tsx`

### 6.2 Crear settings
Crear `src/pages/admin/AdminSettings.tsx`

### 6.3 Crear wizard de onboarding
Crear `src/components/onboarding/OnboardingWizard.tsx`

---

## Fase 7: Integraciones (Opcional) (~3h)

### 7.1 Crear página de integraciones
Crear `src/pages/admin/AdminIntegrations.tsx`:
- Gestión MT4/MT5
- API keys para enterprise
- Webhooks

---

## Testing y Deploy

### Test de Stripe (modo test)
1. Registrar usuario → plan Starter automático
2. Upgrade con tarjeta `4242 4242 4242 4242`
3. Verificar límites actualizados

### Test de Admin
1. Agregar en Firestore: `admins/{tuUserId} = {role: 'admin'}`
2. Acceder a `/admin`
3. Verificar todas las secciones

### Deploy
// turbo
```bash
npm run build
firebase deploy
```

---

## Checklist Final

- [ ] Stripe configurado con productos
- [ ] Firebase Plan Blaze activo
- [ ] Webhooks de Stripe apuntando a Cloud Functions
- [ ] Admin creado en Firestore
- [ ] Tests de pago completados
- [ ] Deploy a producción
