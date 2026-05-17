#!/usr/bin/env node
// ============================================================
// QR BELL - Generate VAPID Keys for Web Push
// Run: npx ts-node scripts/generate-vapid.ts
// ============================================================

const webpush = require('web-push')

const vapidKeys = webpush.generateVAPIDKeys()

console.log('\n🔑 QR Bell - VAPID Keys Generated\n')
console.log('Add these to your .env.local:\n')
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`)
console.log(`VAPID_EMAIL=mailto:push@yourdomain.com`)
console.log('\n⚠️  Keep VAPID_PRIVATE_KEY secret! Never commit to git.\n')
