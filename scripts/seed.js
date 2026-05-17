#!/usr/bin/env node
// ============================================================
// QR BELL - Database Seed (Development Only)
// Run: node scripts/seed.js
// ============================================================

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function seed() {
  console.log('🌱 Seeding QR Bell database...\n')

  // Create test user via Supabase Auth
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: 'demo@qrbell.app',
    password: 'demo123456',
    email_confirm: true,
    user_metadata: { full_name: 'Usuario Demo' },
  })

  if (authError && !authError.message.includes('already registered')) {
    console.error('Auth error:', authError)
    return
  }

  const userId = authUser?.user?.id
  if (!userId) {
    console.log('ℹ️  Demo user already exists, skipping...')
    return
  }

  console.log(`✅ Created demo user: demo@qrbell.app`)

  // Create demo properties
  const properties = [
    {
      user_id: userId,
      name: 'Casa Principal',
      type: 'house',
      address: 'Av. Rivadavia 1234, Buenos Aires',
      status: 'available',
      qr_code: 'demo-casa-principal-001',
      qr_color: '#1a1a2e',
      qr_bg_color: '#ffffff',
    },
    {
      user_id: userId,
      name: 'Oficina Centro',
      type: 'office',
      unit_number: 'Piso 3, Of. 301',
      address: 'Florida 800, CABA',
      status: 'busy',
      qr_code: 'demo-oficina-centro-002',
      qr_color: '#2563eb',
      qr_bg_color: '#f0f4ff',
    },
  ]

  for (const prop of properties) {
    const { data, error } = await supabase.from('properties').insert(prop).select().single()
    if (error) {
      console.error(`Error creating property ${prop.name}:`, error.message)
    } else {
      console.log(`✅ Created property: ${data.name} (QR: /timbre/${data.qr_code})`)

      // Create sample ring events
      const categories = ['delivery', 'guest', 'mail']
      for (let i = 0; i < 10; i++) {
        await supabase.from('ring_events').insert({
          property_id: data.id,
          visitor_category: categories[i % 3],
          visitor_message: i % 3 === 0 ? 'Vengo a entregar un paquete' : null,
          status: i < 7 ? 'responded' : 'pending',
          quick_response: i < 7 ? 'Ya bajo 🏃' : null,
          responded_at: i < 7 ? new Date(Date.now() - i * 3600000).toISOString() : null,
          created_at: new Date(Date.now() - i * 3600000 * 2).toISOString(),
        })
      }
      console.log(`   ↳ Created 10 sample ring events`)
    }
  }

  console.log('\n🎉 Seed completed!')
  console.log('\nDemo credentials:')
  console.log('  Email: demo@qrbell.app')
  console.log('  Password: demo123456\n')
}

seed().catch(console.error)
