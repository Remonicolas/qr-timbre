// ============================================================
// QR BELL - Plan display data (safe for client components)
// Solo constantes, sin imports de servidor
// ============================================================

export const PLAN_DISPLAY = {
  free: {
    name: 'Gratis',
    price_monthly: 0,
    price_yearly: 0,
    description: 'Perfecto para empezar',
    color: 'slate',
  },
  pro: {
    name: 'Pro',
    price_monthly: 9.99,
    price_yearly: 89.9,
    description: 'Para propiedades múltiples',
    color: 'blue',
  },
  business: {
    name: 'Business',
    price_monthly: 29.99,
    price_yearly: 269.9,
    description: 'Para edificios y empresas',
    color: 'purple',
  },
} as const
