import { cn } from '../lib/utils'
import type { SemaphoreState, CoroutineInfo, SemaphoreEvent } from '../types/sync'
import { formatDuration, formatUtilization } from '../types/sync'

// ============================================================================
// SEMAPHORE VISUALIZATION COMPONENT
// ============================================================================

interface SemaphoreVisualizationProps {
  semaphore: SemaphoreState
  className?: string
  showTimeline?: boolean
  events?: SemaphoreEvent[]
}

/**
 * SemaphoreVisualization - Visualizes the state of a Semaphore
 * 
 * Shows:
 * - Permit pool (visual representation)
 * - Active holders
 * - Wait queue
 * - Utilization metrics
 */
export function SemaphoreVisualization({ 
  semaphore, 
  className,
  showTimeline = false,
  events = []
}: SemaphoreVisualizationProps) {
  const utilizationPercent = semaphore.utilization * 100
  const utilizationColor = 
    utilizationPercent > 80 ? 'rose' :
    utilizationPercent > 50 ? 'amber' : 'emerald'

  return (
    <div className={cn(
      'rounded-xl border-2 border-indigo-500/40 bg-gradient-to-br from-indigo-950/40 to-slate-900',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <SemaphoreIcon utilization={semaphore.utilization} />
          <div>
            <h3 className="text-lg font-semibold text-white">
              {semaphore.label || semaphore.semaphoreId}
            </h3>
            <span className="text-sm text-indigo-400">
              {semaphore.availablePermits} / {semaphore.totalPermits} permits available
            </span>
          </div>
        </div>
        <UtilizationBadge utilization={semaphore.utilization} />
      </div>

      {/* Permit Pool Visualization */}
      <div className="p-4 border-b border-white/10">
        <div className="text-xs text-slate-400 mb-3 uppercase tracking-wide">
          Permit Pool
        </div>
        <PermitPool 
          total={semaphore.totalPermits} 
          available={semaphore.availablePermits}
        />
      </div>

      {/* Utilization Bar */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400 uppercase tracking-wide">Utilization</span>
          <span className={cn(
            'text-sm font-mono font-bold',
            utilizationColor === 'rose' ? 'text-rose-400' :
            utilizationColor === 'amber' ? 'text-amber-400' : 'text-emerald-400'
          )}>
            {formatUtilization(semaphore.utilization)}
          </span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className={cn(
              'h-full transition-all duration-300 rounded-full',
              utilizationColor === 'rose' ? 'bg-rose-500' :
              utilizationColor === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'
            )}
            style={{ width: `${utilizationPercent}%` }}
          />
        </div>
      </div>

      {/* Active Holders */}
      {semaphore.activeHolders.length > 0 && (
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-400 uppercase tracking-wide">
              Active Holders
            </span>
            <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-xs font-medium rounded">
              {semaphore.activeHolders.length} active
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {semaphore.activeHolders.map((holder) => (
              <HolderCard key={holder.id} holder={holder} />
            ))}
          </div>
        </div>
      )}

      {/* Wait Queue */}
      {semaphore.waitQueue.length > 0 && (
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-400 uppercase tracking-wide">
              Wait Queue
            </span>
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded">
              {semaphore.waitQueue.length} waiting
            </span>
          </div>
          <div className="space-y-2">
            {semaphore.waitQueue.map((waiter, index) => (
              <WaiterCard 
                key={waiter.id} 
                waiter={waiter} 
                position={index + 1}
              />
            ))}
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="p-4 grid grid-cols-4 gap-3">
        <StatCard 
          label="Total" 
          value={semaphore.totalPermits.toString()} 
          color="slate"
        />
        <StatCard 
          label="Available" 
          value={semaphore.availablePermits.toString()} 
          color="emerald"
        />
        <StatCard 
          label="Acquires" 
          value={semaphore.totalAcquisitions.toString()} 
          color="indigo"
        />
        <StatCard 
          label="Releases" 
          value={semaphore.totalReleases.toString()} 
          color="indigo"
        />
      </div>

      {/* Timeline (optional) */}
      {showTimeline && events.length > 0 && (
        <div className="p-4 border-t border-white/10">
          <div className="text-xs text-slate-400 mb-3 uppercase tracking-wide">
            Recent Activity
          </div>
          <SemaphoreTimeline events={events.slice(-5)} />
        </div>
      )}
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function SemaphoreIcon({ utilization }: { utilization: number }) {
  const color = 
    utilization > 0.8 ? 'rose' :
    utilization > 0.5 ? 'amber' : 'emerald'
  
  const colorClasses = {
    rose: 'bg-rose-500/30 text-rose-400',
    amber: 'bg-amber-500/30 text-amber-400',
    emerald: 'bg-emerald-500/30 text-emerald-400'
  }
  
  return (
    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colorClasses[color])}>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    </div>
  )
}

function UtilizationBadge({ utilization }: { utilization: number }) {
  const percent = utilization * 100
  const color = percent > 80 ? 'rose' : percent > 50 ? 'amber' : 'emerald'
  
  const colorClasses = {
    rose: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
  }
  
  return (
    <div className={cn(
      'px-3 py-1.5 rounded-lg border text-sm font-bold font-mono',
      colorClasses[color]
    )}>
      {formatUtilization(utilization)}
    </div>
  )
}

interface PermitPoolProps {
  total: number
  available: number
}

function PermitPool({ total, available }: PermitPoolProps) {
  const permits = Array.from({ length: total }, (_, i) => i < available)
  
  return (
    <div className="flex flex-wrap gap-2">
      {permits.map((isAvailable, index) => (
        <div
          key={index}
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-300',
            isAvailable 
              ? 'bg-emerald-500/30 text-emerald-400 border border-emerald-500/50' 
              : 'bg-rose-500/30 text-rose-400 border border-rose-500/50'
          )}
          title={isAvailable ? 'Available' : 'In use'}
        >
          {isAvailable ? '✓' : '•'}
        </div>
      ))}
    </div>
  )
}

interface HolderCardProps {
  holder: CoroutineInfo
}

function HolderCard({ holder }: HolderCardProps) {
  return (
    <div className="flex items-center gap-2 py-2 px-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
      <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
      <span className="text-sm text-white truncate">
        {holder.label || holder.id}
      </span>
    </div>
  )
}

interface WaiterCardProps {
  waiter: CoroutineInfo
  position: number
}

function WaiterCard({ waiter, position }: WaiterCardProps) {
  const waitTimeClass = (waiter.waitTimeMs || 0) > 500 ? 'text-rose-400' : 'text-amber-400'
  
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-slate-800/50 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-slate-400 bg-slate-700 rounded">
          {position}
        </span>
        <span className="text-amber-400">⏳</span>
        <span className="text-sm text-white">
          {waiter.label || waiter.id}
        </span>
      </div>
      {waiter.waitTimeMs !== undefined && (
        <span className={cn('text-sm font-mono', waitTimeClass)}>
          {waiter.waitTimeMs.toFixed(0)}ms
        </span>
      )}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string
  color: 'slate' | 'amber' | 'rose' | 'emerald' | 'indigo'
}

function StatCard({ label, value, color }: StatCardProps) {
  const colorClasses = {
    slate: 'text-slate-300',
    amber: 'text-amber-400',
    rose: 'text-rose-400',
    emerald: 'text-emerald-400',
    indigo: 'text-indigo-400'
  }
  
  return (
    <div className="text-center">
      <div className="text-xs text-slate-400 uppercase tracking-wide">{label}</div>
      <div className={cn('text-lg font-bold font-mono', colorClasses[color])}>
        {value}
      </div>
    </div>
  )
}

interface SemaphoreTimelineProps {
  events: SemaphoreEvent[]
}

function SemaphoreTimeline({ events }: SemaphoreTimelineProps) {
  return (
    <div className="space-y-2">
      {events.map((event) => (
        <div 
          key={`${event.kind}-${event.seq}`}
          className="flex items-center gap-3 text-sm"
        >
          <EventIcon kind={event.kind} />
          <span className="text-slate-300 flex-1">
            {getEventDescription(event)}
          </span>
          <span className="text-xs text-slate-500 font-mono">
            #{event.seq}
          </span>
        </div>
      ))}
    </div>
  )
}

function EventIcon({ kind }: { kind: string }) {
  switch (kind) {
    case 'SemaphoreAcquireRequested':
      return <span className="text-amber-400">⏳</span>
    case 'SemaphorePermitAcquired':
      return <span className="text-emerald-400">✅</span>
    case 'SemaphorePermitReleased':
      return <span className="text-indigo-400">🔄</span>
    case 'SemaphoreTryAcquireFailed':
      return <span className="text-slate-400">❌</span>
    default:
      return <span className="text-slate-400">📋</span>
  }
}

function getEventDescription(event: SemaphoreEvent): string {
  switch (event.kind) {
    case 'SemaphoreCreated':
      return `Semaphore created with ${event.totalPermits} permits`
    case 'SemaphoreAcquireRequested':
      return `${event.requesterLabel || event.requesterId} requested permit`
    case 'SemaphorePermitAcquired':
      return `${event.acquirerLabel || event.acquirerId} acquired permit (waited ${formatDuration(event.waitDurationNanos)})`
    case 'SemaphorePermitReleased':
      return `${event.releaserLabel || event.releaserId} released permit (held ${formatDuration(event.holdDurationNanos)})`
    case 'SemaphoreTryAcquireFailed':
      return `${event.requesterLabel || event.requesterId} tryAcquire failed`
    case 'SemaphoreStateChanged':
      return `State: ${event.availablePermits}/${event.totalPermits} permits`
    default:
      return 'Unknown event'
  }
}

// ============================================================================
// UTILIZATION CHART COMPONENT
// ============================================================================

interface UtilizationChartProps {
  samples: { timestamp: number; utilization: number }[]
  className?: string
}

export function UtilizationChart({ samples, className }: UtilizationChartProps) {
  if (samples.length === 0) return null
  
  const maxHeight = 60
  const width = 100 / Math.max(samples.length - 1, 1)
  
  return (
    <div className={cn('bg-slate-800/50 rounded-lg p-4', className)}>
      <div className="text-xs text-slate-400 mb-2 uppercase tracking-wide">
        Utilization Over Time
      </div>
      <div className="relative h-16">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 -translate-x-full pr-2 flex flex-col justify-between h-full text-xs text-slate-500">
          <span>100%</span>
          <span>0%</span>
        </div>
        
        {/* Chart */}
        <svg className="w-full h-full" preserveAspectRatio="none">
          {/* Background grid */}
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="currentColor" strokeWidth="0.5" className="text-slate-700" strokeDasharray="4" />
          
          {/* Utilization line */}
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-indigo-400"
            points={samples
              .map((s, i) => `${i * width}%,${maxHeight - s.utilization * maxHeight}`)
              .join(' ')}
          />
          
          {/* Fill area */}
          <polygon
            className="fill-indigo-400/20"
            points={`0,${maxHeight} ${samples
              .map((s, i) => `${i * width}%,${maxHeight - s.utilization * maxHeight}`)
              .join(' ')} 100%,${maxHeight}`}
          />
        </svg>
      </div>
    </div>
  )
}

export default SemaphoreVisualization

