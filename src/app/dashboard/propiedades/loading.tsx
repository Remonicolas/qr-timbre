import { PropertyCardSkeleton } from '@/components/ui/skeleton'

export default function PropertiesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-xl bg-muted/60 animate-pulse" />
          <div className="h-4 w-32 rounded-xl bg-muted/60 animate-pulse" />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {[0, 1, 2, 3].map((i) => <PropertyCardSkeleton key={i} />)}
      </div>
    </div>
  )
}
