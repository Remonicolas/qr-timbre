# 🔔 QR Bell — Timbre Inteligente SaaS

> El timbre digital que protege tu número. Recibí visitas con un código QR — sin revelar tu teléfono.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📋 Tabla de Contenidos

- [¿Qué es QR Bell?](#-qué-es-qr-bell)
- [Stack Tecnológico](#-stack-tecnológico)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Setup Local](#-setup-local-desarrollo)
- [Configuración de Supabase](#-configuración-de-supabase)
- [Configuración de Firebase/FCM](#-configuración-de-firebasefcm)
- [Configuración de Stripe](#-configuración-de-stripe)
- [Variables de Entorno](#-variables-de-entorno)
- [Deploy en Vercel](#-deploy-en-vercel)
- [Deploy con Docker](#-deploy-con-docker)
- [PWA y Notificaciones Push](#-pwa-y-notificaciones-push)
- [Arquitectura de Seguridad](#-arquitectura-de-seguridad)
- [API Reference](#-api-reference)
- [Checklist de Producción](#-checklist-de-producción)
- [FAQ](#-faq)

---

## 🔔 ¿Qué es QR Bell?

QR Bell es una plataforma SaaS de timbre digital basada en códigos QR. Los residentes colocan un QR en su puerta; cuando alguien lo escanea, el propietario recibe una notificación instantánea **sin revelar su número de teléfono**.

### Flujo principal

```
Visitante escanea QR → Página pública /timbre/{code}
     ↓
Selecciona categoría + mensaje opcional
     ↓
Presiona "Tocar Timbre"
     ↓
API valida → guarda ring_event → notificación push
     ↓
Propietario recibe alerta en tiempo real (con app cerrada)
     ↓
Respuesta rápida: "Ya bajo", "No estoy en casa", etc.
```

### Características principales

| Categoría | Función |
|-----------|---------|
| 🔐 Privacidad | Número de teléfono nunca expuesto públicamente |
| 📲 Push | Notificaciones incluso con app/navegador cerrado |
| 🏢 Edificios | Modo multi-unidad con selector de departamentos |
| 📊 Analíticas | Historial, horarios activos, categorías de visitas |
| 💳 Suscripciones | Planes Free/Pro/Business con Stripe |
| 🌐 PWA | Instalable en iPhone y Android |
| ⚡ Realtime | Dashboard con actualizaciones en vivo vía Supabase |
| 🛡️ RLS | Row Level Security — aislamiento total entre usuarios |

---

## 🛠 Stack Tecnológico

### Frontend
- **Next.js 15** — App Router, RSC, Server Actions
- **React 19** — Concurrent features
- **TypeScript 5.7** — Strict mode, noUncheckedIndexedAccess
- **Tailwind CSS 3.4** — Design system personalizado
- **Framer Motion** — Animaciones fluidas
- **React Hook Form + Zod** — Validación de formularios
- **Recharts** — Gráficos de analíticas
- **Zustand** — Estado global

### Backend
- **Supabase** — PostgreSQL + Auth + Realtime + Storage
- **Row Level Security (RLS)** — Aislamiento multi-tenant
- **Supabase Functions** — Procedimientos almacenados para analíticas
- **Edge Runtime** — API routes de alta performance

### Notificaciones
- **Web Push API** — Push nativo del navegador
- **VAPID** — Autenticación de push server
- **Firebase Cloud Messaging (FCM)** — Capa adicional para Android
- **Service Worker** — Background notifications + offline cache

### Pagos
- **Stripe** — Checkout, suscripciones, portal de facturación
- **Stripe Webhooks** — Sincronización de estado de suscripción

### Infraestructura
- **Vercel** — Deploy principal (recomendado)
- **Docker** — Imagen de producción multi-stage
- **Upstash Redis** — Rate limiting distribuido
- **Sentry** — Error monitoring y performance
- **GitHub Actions** — CI/CD pipeline

---

## 📁 Estructura del Proyecto

```
qrbell/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (landing)/                # Página pública / SEO
│   │   ├── auth/                     # Login, registro, callback
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   └── callback/             # OAuth + email redirect
│   │   ├── dashboard/                # App protegida (requiere auth)
│   │   │   ├── layout.tsx            # Sidebar + header
│   │   │   ├── page.tsx              # Overview + realtime rings
│   │   │   ├── propiedades/          # CRUD de propiedades
│   │   │   ├── historial/            # Historial de timbrazos
│   │   │   ├── analiticas/           # Gráficos y métricas
│   │   │   ├── notificaciones/       # Inbox de notificaciones
│   │   │   ├── configuracion/        # Perfil + push setup
│   │   │   └── suscripcion/          # Planes Stripe
│   │   ├── admin/                    # Panel admin (role-gated)
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # Stats globales
│   │   │   └── usuarios/
│   │   ├── visitor/
│   │   │   └── [qrCode]/             # Página pública del timbre
│   │   └── api/                      # API Routes
│   │       ├── health/               # Health check para Docker
│   │       ├── properties/           # CRUD propiedades
│   │       ├── rings/                # Crear timbrazo + responder
│   │       ├── subscriptions/push/   # Suscripción push
│   │       ├── notifications/        # Marcar como leída
│   │       ├── billing/              # Checkout + portal Stripe
│   │       └── webhooks/stripe/      # Webhook Stripe
│   ├── components/
│   │   ├── ui/                       # Componentes base (skeleton, toast)
│   │   ├── auth/                     # Forms de autenticación
│   │   ├── dashboard/                # Overview, sidebar, header, analytics
│   │   ├── property/                 # Form, lista, QR panel
│   │   ├── notifications/            # Lista de notificaciones
│   │   ├── shared/                   # PWA banner, SW registration, providers
│   │   └── admin/                    # Componentes del panel admin
│   ├── lib/
│   │   ├── supabase/                 # Client, Server, Admin, Types
│   │   ├── stripe/                   # SDK, planes, helpers
│   │   ├── push/                     # Web Push + FCM
│   │   ├── rate-limit/               # Rate limiting Redis/in-memory
│   │   ├── monitoring/               # Sentry helpers
│   │   └── email/                    # Email transaccional (Resend)
│   ├── hooks/                        # Custom React hooks
│   ├── store/                        # Zustand global state
│   ├── types/                        # TypeScript types completos
│   ├── utils/                        # cn(), helpers
│   ├── config/                       # app.ts, rutas, constantes
│   ├── styles/                       # globals.css con design tokens
│   └── middleware.ts                 # Auth guard + headers de seguridad
├── public/
│   ├── manifest.json                 # PWA manifest
│   ├── service-worker.js             # SW: push, cache, sync
│   └── icons/                        # Iconos PWA (72-512px)
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql    # Schema completo + RLS + Functions
├── scripts/
│   ├── generate-vapid.js             # Genera VAPID keys
│   └── seed.js                       # Datos de prueba para desarrollo
├── docker/
├── .github/workflows/ci.yml          # CI/CD pipeline
├── Dockerfile                        # Multi-stage build
├── docker-compose.yml                # Stack completo local
├── next.config.js                    # PWA + Sentry + Headers CSP
├── tailwind.config.js
├── tsconfig.json                     # Strict TypeScript
└── .env.example                      # Todas las variables documentadas
```

---

## 🚀 Setup Local (Desarrollo)

### Prerequisitos

- Node.js 22+
- npm 10+
- Cuenta en [Supabase](https://supabase.com) (gratis)
- Cuenta en [Stripe](https://stripe.com) (para pagos)
- Cuenta en [Firebase](https://firebase.google.com) (para FCM)

### 1. Clonar e instalar

```bash
git clone https://github.com/tu-usuario/qrbell.git
cd qrbell
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Editá `.env.local` con tus valores reales. Ver sección [Variables de Entorno](#-variables-de-entorno).

### 3. Generar VAPID keys para Push

```bash
node scripts/generate-vapid.js
```

Copiá las claves generadas en tu `.env.local`.

### 4. Configurar Supabase

Ver [Configuración de Supabase](#-configuración-de-supabase) abajo.

### 5. Correr en desarrollo

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

### 6. (Opcional) Poblar base de datos con datos de prueba

```bash
node scripts/seed.js
```

Esto crea:
- Usuario demo: `demo@qrbell.app` / `demo123456`
- 2 propiedades de ejemplo
- 20 ring events de muestra

---

## 🗄 Configuración de Supabase

### 1. Crear proyecto

1. Ir a [app.supabase.com](https://app.supabase.com)
2. Clic en **New Project**
3. Elegir nombre, región (la más cercana) y contraseña fuerte
4. Esperar ~2 minutos a que el proyecto esté listo

### 2. Ejecutar migraciones

**Opción A — Supabase CLI (recomendado)**

```bash
# Instalar CLI
npm install -g supabase

# Login
supabase login

# Linkear con tu proyecto (obtener project-id de la URL)
supabase link --project-ref TU_PROJECT_ID

# Ejecutar migraciones
supabase db push
```

**Opción B — SQL Editor manual**

1. Ir a **SQL Editor** en el dashboard de Supabase
2. Copiar el contenido de `supabase/migrations/001_initial_schema.sql`
3. Pegar y ejecutar (Run)

### 3. Configurar Authentication

En Supabase Dashboard → **Authentication** → **Providers**:

**Email:**
- ✅ Enable Email provider
- ✅ Enable Email confirmations
- URL de confirmación: `https://tudominio.com/auth/callback`

**Google OAuth:**
1. Ir a [console.cloud.google.com](https://console.cloud.google.com)
2. Crear proyecto → **APIs & Services** → **Credentials**
3. Crear **OAuth 2.0 Client ID** (Web application)
4. Agregar en "Authorized redirect URIs":
   ```
   https://TU_PROJECT_ID.supabase.co/auth/v1/callback
   ```
5. Copiar **Client ID** y **Client Secret**
6. En Supabase → Authentication → Providers → Google:
   - Pegar Client ID y Client Secret
   - ✅ Enable

### 4. Configurar Realtime

En Supabase Dashboard → **Database** → **Replication**:

Verificar que estas tablas tengan Realtime habilitado:
- ✅ `ring_events`
- ✅ `notifications`
- ✅ `properties`

> Nota: El script SQL ya incluye `ALTER PUBLICATION supabase_realtime ADD TABLE ...`

### 5. Configurar URLs de Redirect

En Supabase → **Authentication** → **URL Configuration**:

```
Site URL: https://tudominio.com
Redirect URLs:
  https://tudominio.com/auth/callback
  http://localhost:3000/auth/callback   ← para desarrollo
```

### 6. Obtener credenciales

En Supabase → **Project Settings** → **API**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=tu-jwt-secret  ← Project Settings → API → JWT Secret
```

> ⚠️ **NUNCA** expongas `SUPABASE_SERVICE_ROLE_KEY` en el cliente.

---

## 🔥 Configuración de Firebase/FCM

Firebase se usa para notificaciones push adicionales (especialmente en Android).

### 1. Crear proyecto Firebase

1. Ir a [console.firebase.google.com](https://console.firebase.google.com)
2. Clic **Add project** → nombre del proyecto → Continuar
3. (Opcional) Desactivar Google Analytics → Crear proyecto

### 2. Configurar Web App

1. En el dashboard → ícono **</>** (Web)
2. Nombre de la app: "QR Bell Web"
3. ✅ También configurar Firebase Hosting → Registrar app
4. Copiar las credenciales de `firebaseConfig`

### 3. Habilitar Cloud Messaging

1. Firebase Dashboard → **Cloud Messaging**
2. En **Web Push certificates** → **Generate key pair**
3. Copiar la clave pública (VAPID key de Firebase)

> ⚠️ Esta es diferente de las VAPID keys del script. Ambas pueden coexistir.

### 4. Admin SDK (para enviar desde servidor)

1. Firebase → **Project Settings** → **Service accounts**
2. Clic **Generate new private key**
3. Descargar el JSON
4. Extraer `project_id`, `client_email`, y `private_key`

### 5. Variables de entorno

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BNxxxxxxxx...

FIREBASE_ADMIN_PROJECT_ID=tu-proyecto
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk@tu-proyecto.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

> 💡 En desarrollo, las notificaciones push funcionan sin Firebase usando solo VAPID. Firebase es recomendado para producción en Android.

---

## 💳 Configuración de Stripe

### 1. Crear cuenta y productos

1. Ir a [dashboard.stripe.com](https://dashboard.stripe.com)
2. Activar modo Test primero
3. **Products** → **Add product**

Crear 2 productos:

**QR Bell Pro**
- Monthly: $9.99/mes → copiar Price ID (`price_xxx`)
- Yearly: $89.90/año → copiar Price ID

**QR Bell Business**
- Monthly: $29.99/mes → copiar Price ID
- Yearly: $269.90/año → copiar Price ID

### 2. Configurar Webhook

1. Stripe Dashboard → **Developers** → **Webhooks**
2. Clic **Add endpoint**
3. URL: `https://tudominio.com/api/webhooks/stripe`
4. Eventos a escuchar:
   ```
   customer.created
   customer.subscription.created
   customer.subscription.updated
   customer.subscription.deleted
   invoice.payment_failed
   invoice.payment_succeeded
   ```
5. Copiar **Signing secret** (`whsec_xxx`)

**Para desarrollo local con Stripe CLI:**

```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Escuchar eventos localmente
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copiar el webhook secret que aparece en consola
```

### 3. Variables de entorno

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

STRIPE_PRICE_PRO_MONTHLY=price_xxx
STRIPE_PRICE_PRO_YEARLY=price_xxx
STRIPE_PRICE_BUSINESS_MONTHLY=price_xxx
STRIPE_PRICE_BUSINESS_YEARLY=price_xxx
```

### 4. Activar modo producción

Cuando estés listo para producción:
1. Completar el proceso de activación de cuenta en Stripe
2. Cambiar las claves de `pk_test_` → `pk_live_` y `sk_test_` → `sk_live_`
3. Crear productos y precios en modo Live
4. Actualizar los Price IDs

---

## 🔐 Variables de Entorno

Referencia completa de todas las variables. Ver `.env.example` para valores de ejemplo.

### Requeridas (mínimo para funcionar)

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | URL base de la app (ej: `https://qrbell.app`) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key pública de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (solo servidor) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | VAPID key pública (generada con el script) |
| `VAPID_PRIVATE_KEY` | VAPID key privada (generada con el script) |
| `VAPID_EMAIL` | Email para VAPID: `mailto:push@tudominio.com` |

### Para pagos (Stripe)

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Publishable key |
| `STRIPE_SECRET_KEY` | Secret key (solo servidor) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret |
| `STRIPE_PRICE_PRO_MONTHLY` | Price ID plan Pro mensual |
| `STRIPE_PRICE_PRO_YEARLY` | Price ID plan Pro anual |
| `STRIPE_PRICE_BUSINESS_MONTHLY` | Price ID plan Business mensual |
| `STRIPE_PRICE_BUSINESS_YEARLY` | Price ID plan Business anual |

### Para push notifications (Firebase)

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | API Key de Firebase |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Project ID |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | VAPID key de Firebase Console |
| `FIREBASE_ADMIN_PROJECT_ID` | Project ID (servidor) |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Service account email |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Private key del Service Account |

### Opcionales (mejoran producción)

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN para error tracking |
| `SENTRY_AUTH_TOKEN` | Para source maps en build |
| `UPSTASH_REDIS_REST_URL` | Redis para rate limiting distribuido |
| `UPSTASH_REDIS_REST_TOKEN` | Token de Upstash |
| `RESEND_API_KEY` | Para emails transaccionales |
| `ADMIN_SECRET_KEY` | Key para operaciones de admin |

---

## ▲ Deploy en Vercel

### 1. Preparar repositorio

```bash
git init
git add .
git commit -m "feat: initial QR Bell production setup"
git remote add origin https://github.com/tu-usuario/qrbell.git
git push -u origin main
```

### 2. Conectar a Vercel

1. Ir a [vercel.com](https://vercel.com) → **New Project**
2. Importar tu repositorio de GitHub
3. Framework: **Next.js** (detectado automáticamente)
4. Root Directory: `.` (raíz)

### 3. Configurar variables de entorno

En Vercel → **Settings** → **Environment Variables**:

Agregar TODAS las variables de `.env.example` con sus valores reales.

> 💡 Tip: Podés importar desde el dashboard usando el botón "Import .env" si pegás el contenido del archivo.

### 4. Configurar dominio

1. Vercel → **Domains** → agregar tu dominio
2. Configurar DNS en tu registrador (CNAME o A record)
3. Vercel provee SSL automático

### 5. Actualizar URLs en Supabase

Con tu dominio real, actualizar en Supabase:
- **Authentication** → **URL Configuration** → Site URL
- **Authentication** → **URL Configuration** → Redirect URLs

### 6. Actualizar webhook de Stripe

Stripe Dashboard → Webhooks → actualizar endpoint URL al dominio real.

### 7. Verificar deploy

```bash
# Verificar health check
curl https://tudominio.com/api/health

# Verificar página de visitante de demo
curl https://tudominio.com/timbre/demo
```

---

## 🐳 Deploy con Docker

### Build de imagen

```bash
# Build
docker build -t qrbell:latest .

# Run (con variables de entorno)
docker run -d \
  --name qrbell \
  -p 3000:3000 \
  --env-file .env.production \
  qrbell:latest
```

### Con Docker Compose (stack completo)

```bash
# Copiar env
cp .env.example .env.local
# Editar .env.local con valores reales

# Iniciar stack (app + Redis)
docker-compose up -d

# Ver logs
docker-compose logs -f app

# Parar
docker-compose down
```

### Variables para producción Docker

Crear `.env.production` con todas las variables de producción (no commitear).

---

## 📱 PWA y Notificaciones Push

### Iconos requeridos

Crear los siguientes íconos en `public/icons/`:

```
icon-72x72.png
icon-96x96.png
icon-128x128.png
icon-144x144.png
icon-152x152.png
icon-192x192.png    ← Requerido para instalar
icon-384x384.png
icon-512x512.png    ← Requerido para splash screen
apple-touch-icon.png (180x180)
badge-72x72.png     ← Para notificaciones en Android
```

**Herramientas recomendadas:**
- [RealFaviconGenerator](https://realfavicongenerator.net) — genera todos los tamaños
- [PWA Builder](https://www.pwabuilder.com) — verifica el manifest

### iOS (iPhone/iPad)

- El Service Worker y las notificaciones push requieren **iOS 16.4+**
- El usuario debe instalar la PWA para recibir push en iOS
- El banner de instalación manual (`PWAInstallBanner`) guía al usuario

### Android

- Las notificaciones push funcionan sin instalar la app
- El banner de instalación aparece automáticamente (`beforeinstallprompt`)
- FCM mejora la confiabilidad en Android

### Verificar notificaciones push

1. Ir a **Configuración** en el dashboard
2. Hacer clic en **Activar notificaciones push**
3. Aceptar el permiso del navegador
4. Escanear tu QR en otra ventana/dispositivo
5. Verificar que llegue la notificación

---

## 🔒 Arquitectura de Seguridad

### Row Level Security (RLS)

Cada tabla tiene políticas RLS estrictas:

```sql
-- Propiedades: solo el dueño puede CRUD
CREATE POLICY "Users can CRUD own properties"
  ON public.properties FOR ALL
  USING (auth.uid() = user_id);

-- QR público: solo lee propiedad activa (SIN phone_number)
CREATE POLICY "Public can read active property by qr_code"
  ON public.properties FOR SELECT
  USING (is_active = TRUE);
```

El campo `phone_number` **nunca** aparece en queries públicas — la API lo omite explícitamente en la selección.

### Rate Limiting

- **Ring endpoint**: máx 3 rings/minuto por IP
- **Cooldown por propiedad**: configurable 30s–10min
- **API general**: máx 100 req/minuto por IP
- Implementado en memoria (dev) o Redis (producción)

### Headers de Seguridad

Configurados en `next.config.js`:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Content-Security-Policy` estricta
- `Referrer-Policy: strict-origin-when-cross-origin`

### Multi-tenancy

Aislamiento total entre usuarios:
- Todas las queries filtran por `user_id = auth.uid()`
- RLS en la base de datos como segunda capa de protección
- El middleware de Next.js verifica sesión en server-side

---

## 📡 API Reference

### Visitor (Público — sin auth)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/timbre/{qrCode}` | Página pública del timbre |
| `POST` | `/api/rings` | Tocar el timbre |

**POST /api/rings**
```json
{
  "qr_code": "abc123def456",
  "visitor_category": "delivery",
  "visitor_message": "Tengo un paquete",
  "unit_id": "uuid-opcional-para-edificio"
}
```

Respuesta 201:
```json
{
  "data": { "id": "ring-uuid", "message": "¡Timbre enviado!" },
  "error": null
}
```

Rate limit: 3 requests/min por IP. Respuesta 429 si excede.

### Dashboard (Requiere auth)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/properties` | Listar propiedades |
| `POST` | `/api/properties` | Crear propiedad |
| `GET` | `/api/properties/{id}` | Detalle de propiedad |
| `PATCH` | `/api/properties/{id}` | Actualizar propiedad |
| `DELETE` | `/api/properties/{id}` | Eliminar propiedad |
| `POST` | `/api/rings/{id}/respond` | Responder a un timbre |
| `POST` | `/api/subscriptions/push` | Suscribir push notifications |
| `DELETE` | `/api/subscriptions/push` | Desuscribir |
| `GET` | `/api/notifications` | Listar notificaciones |
| `POST` | `/api/billing/checkout` | Crear sesión de pago Stripe |
| `POST` | `/api/billing/portal` | Abrir portal de facturación |

### Admin (Requiere rol admin/superadmin)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/admin/stats` | Estadísticas globales |
| `GET` | `/api/admin/users` | Lista de usuarios |

### Sistema

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/webhooks/stripe` | Webhook de Stripe |

---

## ✅ Checklist de Producción

### Pre-deploy

- [ ] Todas las variables de entorno configuradas en Vercel/servidor
- [ ] Migraciones SQL ejecutadas en Supabase producción
- [ ] Realtime habilitado para tablas `ring_events`, `notifications`, `properties`
- [ ] Google OAuth configurado con dominio de producción
- [ ] URLs de redirect de Supabase apuntan al dominio real
- [ ] VAPID keys generadas y configuradas
- [ ] Stripe productos y precios creados en modo Live
- [ ] Webhook de Stripe apuntando al dominio de producción
- [ ] Iconos PWA generados (todos los tamaños)
- [ ] Sentry DSN configurado

### Seguridad

- [ ] `SUPABASE_SERVICE_ROLE_KEY` NO está en variables públicas
- [ ] `STRIPE_SECRET_KEY` NO está en variables públicas
- [ ] `VAPID_PRIVATE_KEY` NO está en variables públicas
- [ ] RLS habilitado en todas las tablas (verificar en Supabase)
- [ ] `.env.local` en `.gitignore` ✅
- [ ] `NODE_ENV=production` en el servidor

### Performance

- [ ] Imágenes optimizadas (WebP/AVIF)
- [ ] Lazy loading en componentes pesados
- [ ] Rate limiting configurado con Redis en producción
- [ ] CDN para assets estáticos (Vercel lo hace automáticamente)

### Monitoring

- [ ] Sentry integrado y recibiendo eventos
- [ ] Health check respondiendo: `GET /api/health`
- [ ] Alertas configuradas en Sentry para errores críticos
- [ ] Uptime monitoring (UptimeRobot, Pingdom, etc.)

### PWA

- [ ] Manifest válido (validar con Lighthouse)
- [ ] Service Worker registrado correctamente
- [ ] Notificaciones push funcionando en Chrome y Firefox
- [ ] Instalación en Android verificada
- [ ] Banner de instalación iOS funcionando

### Post-deploy

- [ ] Probar flujo completo: registro → crear propiedad → escanear QR → recibir notificación
- [ ] Probar Google OAuth en producción
- [ ] Probar pago con tarjeta de prueba Stripe: `4242 4242 4242 4242`
- [ ] Probar push notification en mobile
- [ ] Verificar Lighthouse score: Accesibilidad ≥90, PWA ✅, Performance ≥75
- [ ] Revisar logs de Sentry sin errores críticos

---

## ❓ FAQ

**¿Por qué el teléfono del propietario nunca se expone?**

La columna `phone_number` tiene RLS que solo la permite al propietario autenticado. La API de visitante (`/timbre/{qrCode}`) hace un SELECT explícito que omite ese campo. El número tampoco aparece en la respuesta del timbre ni en las notificaciones.

**¿Cómo funciona el rate limiting sin Redis?**

En desarrollo, se usa un `Map` en memoria. En producción con Upstash Redis, se usa el REST API de Redis para rate limiting distribuido. Sin Upstash, el rate limiting funciona pero no es compartido entre instancias (en Vercel serverless está bien porque cada función tiene su propio estado efímero).

**¿Las notificaciones push funcionan en iPhone?**

Sí, desde iOS 16.4+, pero **solo si el usuario instala la PWA** (Agregar a pantalla de inicio). El Service Worker con Push API no funciona en Safari móvil sin instalación. El banner de iOS explica los pasos al usuario.

**¿Cómo escala la arquitectura?**

- Supabase escala automáticamente el PostgreSQL
- Vercel escala serverless functions automáticamente
- El Realtime de Supabase maneja WebSockets escalables
- Redis (Upstash) escala el rate limiting
- Para escala masiva, se puede mover el worker de notificaciones a una queue (Bull/BullMQ)

**¿Cómo manejo múltiples idiomas?**

La app está en español argentino. Para internacionalización, se puede integrar `next-intl` en una versión futura. Las rutas en español (`/timbre/`, `/propiedades/`) son intencionales para SEO local.

**¿Puedo usar otra DB en lugar de Supabase?**

Las queries están escritas con el cliente de Supabase, pero la lógica de negocio es estándar PostgreSQL. Migrar a Neon + Drizzle/Prisma requiere refactorizar los clientes y adaptar las políticas RLS.

---

## 🤝 Contribuir

1. Fork el repositorio
2. Crear rama: `git checkout -b feature/mi-feature`
3. Commit: `git commit -m 'feat: agregar mi feature'`
4. Push: `git push origin feature/mi-feature`
5. Abrir Pull Request

### Convenciones de commits

```
feat: nueva funcionalidad
fix: corrección de bug
refactor: refactorización sin cambio funcional
docs: solo documentación
style: formato, espacios (sin lógica)
test: agregar o modificar tests
chore: tareas de mantenimiento
```

---

## 📄 Licencia

MIT © 2024 QR Bell

---

<div align="center">

**¿Preguntas?** Abrí un [Issue](https://github.com/tu-usuario/qrbell/issues) o escribinos a soporte@qrbell.app

Hecho con 🔔 en Argentina

</div>
