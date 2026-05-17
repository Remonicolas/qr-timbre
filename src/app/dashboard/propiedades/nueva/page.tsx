import { PropertyForm } from '@/components/property/property-form'
export const metadata = { title: 'Nueva Propiedad | QR Bell' }
export default function NewPropertyPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="font-display text-2xl font-bold">Nueva Propiedad</h1>
        <p className="text-muted-foreground text-sm mt-1">Configurá tu timbre digital</p>
      </div>
      <PropertyForm />
    </div>
  )
}
