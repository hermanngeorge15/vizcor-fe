import { useState } from 'react'
import { cn } from '../lib/utils'
import { MutexVisualization, DeadlockWarning } from './MutexVisualization'
import { SemaphoreVisualization, UtilizationChart } from './SemaphoreVisualization'
import type { 
  MutexState, 
  SemaphoreState, 
  SyncScenario, 
  MutexEvent, 
  SemaphoreEvent,
  DeadlockInfo
} from '../types/sync'

// ============================================================================
// SYNC DASHBOARD - Combined view of all synchronization primitives
// ============================================================================

interface SyncDashboardProps {
  mutexes: MutexState[]
  semaphores: SemaphoreState[]
  deadlock?: DeadlockInfo | null
  mutexEvents?: MutexEvent[]
  semaphoreEvents?: SemaphoreEvent[]
  className?: string
}

export function SyncDashboard({
  mutexes,
  semaphores,
  deadlock,
  mutexEvents = [],
  semaphoreEvents = [],
  className
}: SyncDashboardProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'mutex' | 'semaphore'>('all')

  const showMutexes = activeTab === 'all' || activeTab === 'mutex'
  const showSemaphores = activeTab === 'all' || activeTab === 'semaphore'

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with tabs */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          Synchronization Primitives
        </h2>
        <div className="flex gap-2">
          <TabButton 
            active={activeTab === 'all'} 
            onClick={() => setActiveTab('all')}
          >
            All
          </TabButton>
          <TabButton 
            active={activeTab === 'mutex'} 
            onClick={() => setActiveTab('mutex')}
          >
            Mutex ({mutexes.length})
          </TabButton>
          <TabButton 
            active={activeTab === 'semaphore'} 
            onClick={() => setActiveTab('semaphore')}
          >
            Semaphore ({semaphores.length})
          </TabButton>
        </div>
      </div>

      {/* Deadlock Warning */}
      {deadlock && (
        <DeadlockWarning
          involvedCoroutines={deadlock.involvedCoroutines}
          involvedMutexes={deadlock.involvedMutexes}
          cycleDescription={deadlock.cycleDescription}
        />
      )}

      {/* Summary Stats */}
      <SyncSummary 
        mutexes={mutexes} 
        semaphores={semaphores}
        hasDeadlock={!!deadlock}
      />

      {/* Mutex Section */}
      {showMutexes && mutexes.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-rose-400">🔒</span> Mutexes
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {mutexes.map(mutex => (
              <MutexVisualization
                key={mutex.mutexId}
                mutex={mutex}
                showTimeline
                events={mutexEvents.filter(e => 
                  'mutexId' in e && e.mutexId === mutex.mutexId
                )}
              />
            ))}
          </div>
        </section>
      )}

      {/* Semaphore Section */}
      {showSemaphores && semaphores.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-indigo-400">📊</span> Semaphores
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {semaphores.map(semaphore => (
              <SemaphoreVisualization
                key={semaphore.semaphoreId}
                semaphore={semaphore}
                showTimeline
                events={semaphoreEvents.filter(e => 
                  'semaphoreId' in e && e.semaphoreId === semaphore.semaphoreId
                )}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {mutexes.length === 0 && semaphores.length === 0 && (
        <EmptyState />
      )}
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function TabButton({ 
  active, 
  onClick, 
  children 
}: { 
  active: boolean
  onClick: () => void
  children: React.ReactNode 
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-2 rounded-lg text-sm font-medium transition-all',
        active 
          ? 'bg-indigo-500 text-white' 
          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
      )}
    >
      {children}
    </button>
  )
}

interface SyncSummaryProps {
  mutexes: MutexState[]
  semaphores: SemaphoreState[]
  hasDeadlock: boolean
}

function SyncSummary({ mutexes, semaphores, hasDeadlock }: SyncSummaryProps) {
  const lockedMutexes = mutexes.filter(m => m.isLocked).length
  const totalWaiting = mutexes.reduce((sum, m) => sum + m.waitQueue.length, 0) +
                       semaphores.reduce((sum, s) => sum + s.waitQueue.length, 0)
  const avgUtilization = semaphores.length > 0
    ? semaphores.reduce((sum, s) => sum + s.utilization, 0) / semaphores.length
    : 0

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <SummaryCard
        icon="🔒"
        label="Mutexes"
        value={`${lockedMutexes}/${mutexes.length}`}
        subtext="locked"
        color={lockedMutexes > 0 ? 'rose' : 'emerald'}
      />
      <SummaryCard
        icon="📊"
        label="Semaphores"
        value={semaphores.length.toString()}
        subtext="active"
        color="indigo"
      />
      <SummaryCard
        icon="⏳"
        label="Waiting"
        value={totalWaiting.toString()}
        subtext="coroutines"
        color={totalWaiting > 5 ? 'amber' : 'slate'}
      />
      <SummaryCard
        icon="📈"
        label="Avg Utilization"
        value={`${(avgUtilization * 100).toFixed(0)}%`}
        subtext="semaphores"
        color={avgUtilization > 0.8 ? 'rose' : avgUtilization > 0.5 ? 'amber' : 'emerald'}
      />
      <SummaryCard
        icon={hasDeadlock ? "⚠️" : "✅"}
        label="Deadlocks"
        value={hasDeadlock ? "DETECTED" : "None"}
        subtext=""
        color={hasDeadlock ? 'rose' : 'emerald'}
      />
    </div>
  )
}

interface SummaryCardProps {
  icon: string
  label: string
  value: string
  subtext: string
  color: 'slate' | 'rose' | 'amber' | 'emerald' | 'indigo'
}

function SummaryCard({ icon, label, value, subtext, color }: SummaryCardProps) {
  const colorClasses = {
    slate: 'border-slate-700 bg-slate-800/50',
    rose: 'border-rose-500/40 bg-rose-500/10',
    amber: 'border-amber-500/40 bg-amber-500/10',
    emerald: 'border-emerald-500/40 bg-emerald-500/10',
    indigo: 'border-indigo-500/40 bg-indigo-500/10'
  }

  const textColors = {
    slate: 'text-slate-300',
    rose: 'text-rose-400',
    amber: 'text-amber-400',
    emerald: 'text-emerald-400',
    indigo: 'text-indigo-400'
  }

  return (
    <div className={cn(
      'rounded-xl border p-4 text-center',
      colorClasses[color]
    )}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xs text-slate-400 uppercase tracking-wide">{label}</div>
      <div className={cn('text-xl font-bold font-mono', textColors[color])}>
        {value}
      </div>
      {subtext && (
        <div className="text-xs text-slate-500">{subtext}</div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">🔐</div>
      <h3 className="text-xl font-semibold text-white mb-2">
        No Synchronization Primitives
      </h3>
      <p className="text-slate-400 max-w-md mx-auto">
        Run a scenario with Mutex or Semaphore to see synchronization visualization.
        Try the "Connection Pool" or "Thread-Safe Counter" scenarios.
      </p>
    </div>
  )
}

// ============================================================================
// SCENARIO SELECTOR COMPONENT
// ============================================================================

interface ScenarioSelectorProps {
  scenarios: SyncScenario[]
  onSelect: (scenario: SyncScenario) => void
  loading?: boolean
  className?: string
}

export function ScenarioSelector({ 
  scenarios, 
  onSelect, 
  loading = false,
  className 
}: ScenarioSelectorProps) {
  const mutexScenarios = scenarios.filter(s => s.type === 'Mutex')
  const semaphoreScenarios = scenarios.filter(s => s.type === 'Semaphore')
  const combinedScenarios = scenarios.filter(s => s.type === 'Combined')

  return (
    <div className={cn('space-y-6', className)}>
      <h2 className="text-xl font-bold text-white">Synchronization Scenarios</h2>
      
      {/* Mutex Scenarios */}
      <section>
        <h3 className="text-sm text-rose-400 uppercase tracking-wide mb-3 flex items-center gap-2">
          <span>🔒</span> Mutex Scenarios
        </h3>
        <div className="grid md:grid-cols-2 gap-3">
          {mutexScenarios.map(scenario => (
            <ScenarioCard 
              key={scenario.path}
              scenario={scenario}
              onSelect={onSelect}
              loading={loading}
              color="rose"
            />
          ))}
        </div>
      </section>

      {/* Semaphore Scenarios */}
      <section>
        <h3 className="text-sm text-indigo-400 uppercase tracking-wide mb-3 flex items-center gap-2">
          <span>📊</span> Semaphore Scenarios
        </h3>
        <div className="grid md:grid-cols-2 gap-3">
          {semaphoreScenarios.map(scenario => (
            <ScenarioCard 
              key={scenario.path}
              scenario={scenario}
              onSelect={onSelect}
              loading={loading}
              color="indigo"
            />
          ))}
        </div>
      </section>

      {/* Combined Scenarios */}
      <section>
        <h3 className="text-sm text-amber-400 uppercase tracking-wide mb-3 flex items-center gap-2">
          <span>🔀</span> Combined Scenarios
        </h3>
        <div className="grid md:grid-cols-2 gap-3">
          {combinedScenarios.map(scenario => (
            <ScenarioCard 
              key={scenario.path}
              scenario={scenario}
              onSelect={onSelect}
              loading={loading}
              color="amber"
            />
          ))}
        </div>
      </section>
    </div>
  )
}

interface ScenarioCardProps {
  scenario: SyncScenario
  onSelect: (scenario: SyncScenario) => void
  loading: boolean
  color: 'rose' | 'indigo' | 'amber'
}

function ScenarioCard({ scenario, onSelect, loading, color }: ScenarioCardProps) {
  const colorClasses = {
    rose: 'border-rose-500/30 hover:border-rose-500/60 hover:bg-rose-500/10',
    indigo: 'border-indigo-500/30 hover:border-indigo-500/60 hover:bg-indigo-500/10',
    amber: 'border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/10'
  }

  return (
    <button
      onClick={() => onSelect(scenario)}
      disabled={loading}
      className={cn(
        'p-4 rounded-xl border bg-slate-800/50 text-left transition-all',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        colorClasses[color]
      )}
    >
      <h4 className="font-semibold text-white mb-1">{scenario.name}</h4>
      <p className="text-sm text-slate-400">{scenario.description}</p>
    </button>
  )
}

export default SyncDashboard


