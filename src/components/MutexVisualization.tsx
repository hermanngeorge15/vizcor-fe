import { cn } from '../lib/utils'
import type { MutexState, CoroutineInfo, MutexEvent } from '../types/sync'
import { formatDuration, nanosToMs } from '../types/sync'

// ============================================================================
// MUTEX VISUALIZATION COMPONENT
// ============================================================================

interface MutexVisualizationProps {
  mutex: MutexState
  className?: string
  showTimeline?: boolean
  events?: MutexEvent[]
}

/**
 * MutexVisualization - Visualizes the state of a Mutex lock
 * 
 * Shows:
 * - Lock status (locked/unlocked)
 * - Current owner
 * - Wait queue
 * - Contention statistics
 */
export function MutexVisualization({ 
  mutex, 
  className,
  showTimeline = false,
  events = []
}: MutexVisualizationProps) {
  const contentionRate = mutex.totalAcquisitions > 0 
    ? (mutex.contentionCount / mutex.totalAcquisitions * 100).toFixed(0) 
    : '0'

  return (
    <div className={cn(
      'rounded-xl border-2 transition-all duration-300',
      mutex.isLocked 
        ? 'border-rose-500/60 bg-gradient-to-br from-rose-950/40 to-slate-900' 
        : 'border-emerald-500/60 bg-gradient-to-br from-emerald-950/40 to-slate-900',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <LockIcon locked={mutex.isLocked} />
          <div>
            <h3 className="text-lg font-semibold text-white">
              {mutex.label || mutex.mutexId}
            </h3>
            <span className={cn(
              'text-xs font-medium uppercase tracking-wider',
              mutex.isLocked ? 'text-rose-400' : 'text-emerald-400'
            )}>
              {mutex.isLocked ? 'Locked' : 'Available'}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Contention Rate</div>
          <div className="text-lg font-mono font-bold text-white">{contentionRate}%</div>
        </div>
      </div>

      {/* Owner Section */}
      {mutex.isLocked && mutex.owner && (
        <div className="p-4 border-b border-white/10 bg-rose-500/10">
          <div className="text-xs text-slate-400 mb-2 uppercase tracking-wide">Current Owner</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="font-medium text-white">
                {mutex.owner.label || mutex.owner.id}
              </span>
            </div>
            <span className="text-sm text-rose-300 font-mono">
              Holding: {mutex.holdDurationMs.toFixed(0)}ms
            </span>
          </div>
        </div>
      )}

      {/* Wait Queue */}
      {mutex.waitQueue.length > 0 && (
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-400 uppercase tracking-wide">
              Wait Queue
            </span>
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded">
              {mutex.waitQueue.length} waiting
            </span>
          </div>
          <div className="space-y-2">
            {mutex.waitQueue.map((waiter, index) => (
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
      <div className="p-4 grid grid-cols-3 gap-4">
        <StatCard 
          label="Total Locks" 
          value={mutex.totalAcquisitions.toString()} 
          color="slate"
        />
        <StatCard 
          label="Contentions" 
          value={mutex.contentionCount.toString()} 
          color="amber"
        />
        <StatCard 
          label="Queue Size" 
          value={mutex.waitQueue.length.toString()} 
          color={mutex.waitQueue.length > 3 ? 'rose' : 'slate'}
        />
      </div>

      {/* Timeline (optional) */}
      {showTimeline && events.length > 0 && (
        <div className="p-4 border-t border-white/10">
          <div className="text-xs text-slate-400 mb-3 uppercase tracking-wide">
            Recent Activity
          </div>
          <MutexTimeline events={events.slice(-5)} />
        </div>
      )}
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function LockIcon({ locked }: { locked: boolean }) {
  return (
    <div className={cn(
      'w-10 h-10 rounded-lg flex items-center justify-center',
      locked 
        ? 'bg-rose-500/30 text-rose-400' 
        : 'bg-emerald-500/30 text-emerald-400'
    )}>
      {locked ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
        </svg>
      )}
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
  color: 'slate' | 'amber' | 'rose' | 'emerald'
}

function StatCard({ label, value, color }: StatCardProps) {
  const colorClasses = {
    slate: 'text-slate-300',
    amber: 'text-amber-400',
    rose: 'text-rose-400',
    emerald: 'text-emerald-400'
  }
  
  return (
    <div className="text-center">
      <div className="text-xs text-slate-400 uppercase tracking-wide">{label}</div>
      <div className={cn('text-xl font-bold font-mono', colorClasses[color])}>
        {value}
      </div>
    </div>
  )
}

interface MutexTimelineProps {
  events: MutexEvent[]
}

function MutexTimeline({ events }: MutexTimelineProps) {
  return (
    <div className="space-y-2">
      {events.map((event, index) => (
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
  const iconClass = "w-4 h-4"
  
  switch (kind) {
    case 'MutexLockRequested':
      return <span className="text-amber-400">⏳</span>
    case 'MutexLockAcquired':
      return <span className="text-rose-400">🔒</span>
    case 'MutexUnlocked':
      return <span className="text-emerald-400">🔓</span>
    case 'MutexTryLockFailed':
      return <span className="text-slate-400">❌</span>
    default:
      return <span className="text-slate-400">📋</span>
  }
}

function getEventDescription(event: MutexEvent): string {
  switch (event.kind) {
    case 'MutexCreated':
      return `Mutex created`
    case 'MutexLockRequested':
      return `${event.requesterLabel || event.requesterId} requested lock`
    case 'MutexLockAcquired':
      return `${event.acquirerLabel || event.acquirerId} acquired lock (waited ${formatDuration(event.waitDurationNanos)})`
    case 'MutexUnlocked':
      return `${event.releaserLabel || event.releaserId} released lock (held ${formatDuration(event.holdDurationNanos)})`
    case 'MutexTryLockFailed':
      return `${event.requesterLabel || event.requesterId} tryLock failed`
    case 'MutexQueueChanged':
      return `Queue: ${event.waitingCoroutineIds.length} waiting`
    default:
      return 'Unknown event'
  }
}

// ============================================================================
// DEADLOCK WARNING COMPONENT
// ============================================================================

interface DeadlockWarningProps {
  involvedCoroutines: CoroutineInfo[]
  involvedMutexes: { id: string; label: string | null }[]
  cycleDescription: string
  className?: string
}

export function DeadlockWarning({ 
  involvedCoroutines, 
  involvedMutexes, 
  cycleDescription,
  className 
}: DeadlockWarningProps) {
  return (
    <div className={cn(
      'rounded-xl border-2 border-red-500 bg-gradient-to-br from-red-950/60 to-slate-900 p-6',
      'animate-pulse',
      className
    )}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-red-500/30 flex items-center justify-center">
          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-red-400">⚠️ DEADLOCK DETECTED</h3>
          <p className="text-sm text-slate-400">Circular wait condition found</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {/* Involved Coroutines */}
        <div className="bg-slate-800/50 rounded-lg p-4">
          <h4 className="text-xs text-slate-400 uppercase tracking-wide mb-2">
            Involved Coroutines
          </h4>
          <div className="space-y-1">
            {involvedCoroutines.map(coroutine => (
              <div key={coroutine.id} className="text-sm text-white">
                🔄 {coroutine.label || coroutine.id}
              </div>
            ))}
          </div>
        </div>

        {/* Involved Mutexes */}
        <div className="bg-slate-800/50 rounded-lg p-4">
          <h4 className="text-xs text-slate-400 uppercase tracking-wide mb-2">
            Involved Mutexes
          </h4>
          <div className="space-y-1">
            {involvedMutexes.map(mutex => (
              <div key={mutex.id} className="text-sm text-white">
                🔒 {mutex.label || mutex.id}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cycle Description */}
      <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
        <h4 className="text-xs text-slate-400 uppercase tracking-wide mb-2">
          Wait Cycle
        </h4>
        <p className="text-sm text-red-300 font-mono">{cycleDescription}</p>
      </div>

      {/* Recommendation */}
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
        <h4 className="text-xs text-emerald-400 uppercase tracking-wide mb-2">
          💡 Recommendation
        </h4>
        <p className="text-sm text-slate-300">
          Always acquire locks in a consistent order (e.g., alphabetically by mutex label).
          Consider using <code className="text-emerald-400">tryLock()</code> with timeout to prevent indefinite blocking.
        </p>
      </div>
    </div>
  )
}

export default MutexVisualization

