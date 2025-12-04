import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import { Button, Card, CardBody, CardHeader, Spinner, Chip, Progress } from '@heroui/react'
import { FiPlay, FiLock, FiGrid, FiZap, FiRefreshCw } from 'react-icons/fi'
import { Layout } from '@/components/Layout'
import { cn } from '@/lib/utils'
import type { 
  SyncScenario, 
  MutexState, 
  SemaphoreState, 
  CoroutineInfo,
  SyncEvent,
  MutexEvent,
  SemaphoreEvent
} from '@/types/sync'
import { formatDuration, formatUtilization, nanosToMs } from '@/types/sync'

export const Route = createFileRoute('/sync/')({
  component: SyncVisualizationPage,
})

const API_BASE = 'http://localhost:8080'

// Predefined scenarios with descriptions
const SCENARIOS: SyncScenario[] = [
  { path: 'mutex/counter', name: 'Thread-Safe Counter', type: 'Mutex', description: 'Atomic counter increments with mutex protection' },
  { path: 'mutex/bank-transfer', name: 'Bank Transfer', type: 'Mutex', description: 'Safe money transfer with lock ordering' },
  { path: 'mutex/cache', name: 'Cache Read-Through', type: 'Mutex', description: 'Thread-safe lazy initialization' },
  { path: 'mutex/deadlock-demo', name: 'Deadlock Demo', type: 'Mutex', description: '⚠️ Intentional deadlock demonstration' },
  { path: 'semaphore/connection-pool', name: 'Connection Pool', type: 'Semaphore', description: 'Database connection limiting (3 max)' },
  { path: 'semaphore/rate-limiter', name: 'Rate Limiter', type: 'Semaphore', description: 'API call throttling (5 concurrent)' },
  { path: 'semaphore/file-processor', name: 'File Processor', type: 'Semaphore', description: 'I/O-limited parallel processing' },
  { path: 'semaphore/producer-consumer', name: 'Producer-Consumer', type: 'Semaphore', description: 'Bounded buffer implementation' },
  { path: 'combined/ecommerce', name: 'E-commerce Orders', type: 'Combined', description: 'Order processing with inventory + payments' },
]

function SyncVisualizationPage() {
  const [selectedScenario, setSelectedScenario] = useState<SyncScenario | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [events, setEvents] = useState<SyncEvent[]>([])
  const [mutexStates, setMutexStates] = useState<Map<string, MutexState>>(new Map())
  const [semaphoreStates, setSemaphoreStates] = useState<Map<string, SemaphoreState>>(new Map())
  const [eventLog, setEventLog] = useState<string[]>([])

  // Process events to update states
  const processEvent = useCallback((event: SyncEvent) => {
    setEvents(prev => [...prev, event])
    
    // Update event log
    const timestamp = new Date().toLocaleTimeString()
    let logEntry = `[${timestamp}] ${event.kind}`
    
    if ('mutexId' in event) {
      const mutexEvent = event as MutexEvent
      logEntry += ` - ${mutexEvent.mutexLabel || mutexEvent.mutexId}`
      
      // Update mutex state based on event
      setMutexStates(prev => {
        const newStates = new Map(prev)
        const currentState = newStates.get(mutexEvent.mutexId) || createEmptyMutexState(mutexEvent.mutexId, mutexEvent.mutexLabel)
        
        switch (event.kind) {
          case 'MutexCreated':
            newStates.set(mutexEvent.mutexId, currentState)
            break
          case 'MutexLockRequested': {
            const req = event as any
            if (req.isLocked) {
              currentState.waitQueue.push({ id: req.requesterId, label: req.requesterLabel })
            }
            newStates.set(mutexEvent.mutexId, { ...currentState })
            break
          }
          case 'MutexLockAcquired': {
            const acq = event as any
            currentState.isLocked = true
            currentState.owner = { id: acq.acquirerId, label: acq.acquirerLabel }
            currentState.waitQueue = currentState.waitQueue.filter(w => w.id !== acq.acquirerId)
            currentState.totalAcquisitions++
            if (acq.waitDurationNanos > 0) currentState.contentionCount++
            newStates.set(mutexEvent.mutexId, { ...currentState })
            break
          }
          case 'MutexUnlocked': {
            currentState.isLocked = false
            currentState.owner = null
            currentState.holdDurationMs = 0
            newStates.set(mutexEvent.mutexId, { ...currentState })
            break
          }
        }
        
        return newStates
      })
    }
    
    if ('semaphoreId' in event) {
      const semEvent = event as SemaphoreEvent
      logEntry += ` - ${semEvent.semaphoreLabel || semEvent.semaphoreId}`
      
      // Update semaphore state
      setSemaphoreStates(prev => {
        const newStates = new Map(prev)
        const currentState = newStates.get(semEvent.semaphoreId) || createEmptySemaphoreState(semEvent.semaphoreId, semEvent.semaphoreLabel)
        
        switch (event.kind) {
          case 'SemaphoreCreated': {
            const created = event as any
            currentState.totalPermits = created.totalPermits
            currentState.availablePermits = created.totalPermits
            newStates.set(semEvent.semaphoreId, { ...currentState })
            break
          }
          case 'SemaphorePermitAcquired': {
            const acq = event as any
            currentState.availablePermits = acq.remainingPermits
            currentState.activeHolders.push({ id: acq.acquirerId, label: acq.acquirerLabel })
            currentState.waitQueue = currentState.waitQueue.filter(w => w.id !== acq.acquirerId)
            currentState.totalAcquisitions++
            currentState.utilization = (currentState.totalPermits - currentState.availablePermits) / currentState.totalPermits
            newStates.set(semEvent.semaphoreId, { ...currentState })
            break
          }
          case 'SemaphorePermitReleased': {
            const rel = event as any
            currentState.availablePermits = rel.newAvailablePermits
            currentState.activeHolders = currentState.activeHolders.filter(h => h.id !== rel.releaserId)
            currentState.totalReleases++
            currentState.utilization = (currentState.totalPermits - currentState.availablePermits) / currentState.totalPermits
            newStates.set(semEvent.semaphoreId, { ...currentState })
            break
          }
          case 'SemaphoreAcquireRequested': {
            const req = event as any
            if (req.availablePermits === 0) {
              currentState.waitQueue.push({ id: req.requesterId, label: req.requesterLabel })
            }
            newStates.set(semEvent.semaphoreId, { ...currentState })
            break
          }
        }
        
        return newStates
      })
    }
    
    setEventLog(prev => [...prev.slice(-50), logEntry])
  }, [])

  // Run scenario
  const runScenario = async (scenario: SyncScenario) => {
    setSelectedScenario(scenario)
    setIsRunning(true)
    setEvents([])
    setMutexStates(new Map())
    setSemaphoreStates(new Map())
    setEventLog([`Starting scenario: ${scenario.name}`])
    
    try {
      const response = await fetch(`${API_BASE}/api/sync/${scenario.path}`)
      const data = await response.json()
      
      if (data.success) {
        setSessionId(data.sessionId)
        setEventLog(prev => [...prev, `✅ Completed! Session: ${data.sessionId}`, `Events generated: ${data.eventCount}`])
        
        // Fetch events from the session
        await fetchSessionEvents(data.sessionId)
      } else {
        setEventLog(prev => [...prev, `❌ Failed: ${data.message}`])
      }
    } catch (error) {
      setEventLog(prev => [...prev, `❌ Error: ${error}`])
    } finally {
      setIsRunning(false)
    }
  }

  // Fetch and animate events from session
  const fetchSessionEvents = async (sid: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/sessions/${sid}/events`)
      const events = await response.json()
      
      // Animate events with delay
      for (let i = 0; i < events.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 100)) // 100ms between events
        processEvent(events[i])
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
    }
  }

  // Reset state
  const handleReset = () => {
    setSelectedScenario(null)
    setSessionId(null)
    setEvents([])
    setMutexStates(new Map())
    setSemaphoreStates(new Map())
    setEventLog([])
  }

  return (
    <Layout>
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <FiLock className="text-rose-500" />
            Synchronization Visualizer
          </h1>
          <p className="text-xl text-default-600">
            Real-time visualization of Mutex & Semaphore patterns
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Scenario Selector */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Scenarios</h2>
                {sessionId && (
                  <Button size="sm" variant="flat" startContent={<FiRefreshCw />} onPress={handleReset}>
                    Reset
                  </Button>
                )}
              </CardHeader>
              <CardBody className="space-y-2 max-h-[600px] overflow-y-auto">
                {SCENARIOS.map(scenario => (
                  <ScenarioCard
                    key={scenario.path}
                    scenario={scenario}
                    isSelected={selectedScenario?.path === scenario.path}
                    isRunning={isRunning && selectedScenario?.path === scenario.path}
                    onRun={() => runScenario(scenario)}
                  />
                ))}
              </CardBody>
            </Card>
          </div>

          {/* Visualization Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mutex States */}
            {mutexStates.size > 0 && (
              <section>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <FiLock className="text-rose-500" /> Mutexes
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {Array.from(mutexStates.values()).map(mutex => (
                    <AnimatedMutexCard key={mutex.mutexId} mutex={mutex} />
                  ))}
                </div>
              </section>
            )}

            {/* Semaphore States */}
            {semaphoreStates.size > 0 && (
              <section>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <FiGrid className="text-indigo-500" /> Semaphores
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {Array.from(semaphoreStates.values()).map(semaphore => (
                    <AnimatedSemaphoreCard key={semaphore.semaphoreId} semaphore={semaphore} />
                  ))}
                </div>
              </section>
            )}

            {/* Event Log */}
            {eventLog.length > 0 && (
              <Card>
                <CardHeader>
                  <h3 className="font-semibold flex items-center gap-2">
                    <FiZap className="text-amber-500" /> Event Log
                  </h3>
                </CardHeader>
                <CardBody>
                  <div className="bg-slate-900 rounded-lg p-4 max-h-64 overflow-y-auto font-mono text-sm">
                    {eventLog.map((log, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          'py-1',
                          log.includes('✅') && 'text-emerald-400',
                          log.includes('❌') && 'text-rose-400',
                          log.includes('Acquired') && 'text-amber-400',
                          log.includes('Released') && 'text-indigo-400',
                          log.includes('Requested') && 'text-slate-400'
                        )}
                      >
                        {log}
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Empty State */}
            {mutexStates.size === 0 && semaphoreStates.size === 0 && !isRunning && (
              <Card className="text-center py-16">
                <CardBody>
                  <div className="text-6xl mb-4">🔐</div>
                  <h3 className="text-xl font-semibold mb-2">Select a Scenario</h3>
                  <p className="text-default-500">
                    Choose a scenario from the left to see mutex and semaphore visualizations
                  </p>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ScenarioCardProps {
  scenario: SyncScenario
  isSelected: boolean
  isRunning: boolean
  onRun: () => void
}

function ScenarioCard({ scenario, isSelected, isRunning, onRun }: ScenarioCardProps) {
  const typeColors = {
    Mutex: 'danger',
    Semaphore: 'secondary',
    Combined: 'warning'
  } as const

  return (
    <div 
      className={cn(
        'p-3 rounded-lg border transition-all cursor-pointer',
        isSelected 
          ? 'border-primary bg-primary/10' 
          : 'border-default-200 hover:border-primary/50 hover:bg-default-100'
      )}
      onClick={onRun}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Chip size="sm" color={typeColors[scenario.type]} variant="flat">
              {scenario.type}
            </Chip>
          </div>
          <h4 className="font-medium text-sm">{scenario.name}</h4>
          <p className="text-xs text-default-500 truncate">{scenario.description}</p>
        </div>
        <Button
          size="sm"
          color="primary"
          isIconOnly
          isLoading={isRunning}
          onPress={(e) => {
            e.stopPropagation()
            onRun()
          }}
        >
          <FiPlay />
        </Button>
      </div>
    </div>
  )
}

interface AnimatedMutexCardProps {
  mutex: MutexState
}

function AnimatedMutexCard({ mutex }: AnimatedMutexCardProps) {
  return (
    <Card className={cn(
      'transition-all duration-300 border-2',
      mutex.isLocked 
        ? 'border-rose-500 bg-rose-500/5' 
        : 'border-emerald-500 bg-emerald-500/5'
    )}>
      <CardBody className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
              mutex.isLocked 
                ? 'bg-rose-500/20 text-rose-500' 
                : 'bg-emerald-500/20 text-emerald-500'
            )}>
              {mutex.isLocked ? '🔒' : '🔓'}
            </div>
            <div>
              <div className="font-semibold">{mutex.label || mutex.mutexId}</div>
              <div className={cn(
                'text-xs font-medium uppercase',
                mutex.isLocked ? 'text-rose-500' : 'text-emerald-500'
              )}>
                {mutex.isLocked ? 'LOCKED' : 'AVAILABLE'}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-default-400">Contention</div>
            <div className="font-mono font-bold">
              {mutex.totalAcquisitions > 0 
                ? `${((mutex.contentionCount / mutex.totalAcquisitions) * 100).toFixed(0)}%`
                : '0%'}
            </div>
          </div>
        </div>

        {/* Owner */}
        {mutex.isLocked && mutex.owner && (
          <div className="bg-rose-500/10 rounded-lg p-2">
            <div className="text-xs text-default-400 mb-1">Owner</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="font-medium">{mutex.owner.label || mutex.owner.id}</span>
            </div>
          </div>
        )}

        {/* Wait Queue */}
        {mutex.waitQueue.length > 0 && (
          <div>
            <div className="text-xs text-default-400 mb-2">
              Wait Queue ({mutex.waitQueue.length})
            </div>
            <div className="space-y-1">
              {mutex.waitQueue.map((waiter, i) => (
                <div key={waiter.id} className="flex items-center gap-2 text-sm bg-amber-500/10 rounded px-2 py-1">
                  <span className="text-amber-500">⏳</span>
                  <span className="w-4 text-xs text-default-400">[{i + 1}]</span>
                  <span>{waiter.label || waiter.id}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex gap-4 text-center pt-2 border-t border-default-200">
          <div className="flex-1">
            <div className="text-xs text-default-400">Locks</div>
            <div className="font-mono font-semibold">{mutex.totalAcquisitions}</div>
          </div>
          <div className="flex-1">
            <div className="text-xs text-default-400">Contentions</div>
            <div className="font-mono font-semibold text-amber-500">{mutex.contentionCount}</div>
          </div>
          <div className="flex-1">
            <div className="text-xs text-default-400">Waiting</div>
            <div className="font-mono font-semibold">{mutex.waitQueue.length}</div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

interface AnimatedSemaphoreCardProps {
  semaphore: SemaphoreState
}

function AnimatedSemaphoreCard({ semaphore }: AnimatedSemaphoreCardProps) {
  const utilizationPercent = semaphore.utilization * 100
  const utilizationColor = 
    utilizationPercent > 80 ? 'danger' :
    utilizationPercent > 50 ? 'warning' : 'success'

  return (
    <Card className="border-2 border-indigo-500/40 bg-indigo-500/5">
      <CardBody className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-500/20 text-indigo-500">
              📊
            </div>
            <div>
              <div className="font-semibold">{semaphore.label || semaphore.semaphoreId}</div>
              <div className="text-xs text-indigo-400">
                {semaphore.availablePermits} / {semaphore.totalPermits} available
              </div>
            </div>
          </div>
          <Chip color={utilizationColor} variant="flat" size="sm">
            {formatUtilization(semaphore.utilization)}
          </Chip>
        </div>

        {/* Permit Pool */}
        <div>
          <div className="text-xs text-default-400 mb-2">Permit Pool</div>
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: semaphore.totalPermits }, (_, i) => (
              <div
                key={i}
                className={cn(
                  'w-6 h-6 rounded flex items-center justify-center text-xs font-bold transition-all duration-300',
                  i < semaphore.availablePermits
                    ? 'bg-emerald-500/30 text-emerald-400 border border-emerald-500/50'
                    : 'bg-rose-500/30 text-rose-400 border border-rose-500/50 animate-pulse'
                )}
              >
                {i < semaphore.availablePermits ? '✓' : '•'}
              </div>
            ))}
          </div>
        </div>

        {/* Utilization Bar */}
        <div>
          <Progress 
            value={utilizationPercent} 
            color={utilizationColor}
            size="sm"
            className="max-w-full"
          />
        </div>

        {/* Active Holders */}
        {semaphore.activeHolders.length > 0 && (
          <div>
            <div className="text-xs text-default-400 mb-2">
              Active Holders ({semaphore.activeHolders.length})
            </div>
            <div className="flex flex-wrap gap-1">
              {semaphore.activeHolders.map(holder => (
                <Chip key={holder.id} size="sm" variant="flat" color="secondary">
                  {holder.label || holder.id}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {/* Wait Queue */}
        {semaphore.waitQueue.length > 0 && (
          <div>
            <div className="text-xs text-default-400 mb-2">
              Waiting ({semaphore.waitQueue.length})
            </div>
            <div className="flex flex-wrap gap-1">
              {semaphore.waitQueue.map(waiter => (
                <Chip key={waiter.id} size="sm" variant="flat" color="warning">
                  ⏳ {waiter.label || waiter.id}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex gap-4 text-center pt-2 border-t border-default-200">
          <div className="flex-1">
            <div className="text-xs text-default-400">Acquires</div>
            <div className="font-mono font-semibold">{semaphore.totalAcquisitions}</div>
          </div>
          <div className="flex-1">
            <div className="text-xs text-default-400">Releases</div>
            <div className="font-mono font-semibold">{semaphore.totalReleases}</div>
          </div>
          <div className="flex-1">
            <div className="text-xs text-default-400">Waiting</div>
            <div className="font-mono font-semibold text-amber-500">{semaphore.waitQueue.length}</div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

// ============================================================================
// HELPERS
// ============================================================================

function createEmptyMutexState(id: string, label: string | null): MutexState {
  return {
    mutexId: id,
    label,
    isLocked: false,
    owner: null,
    holdDurationMs: 0,
    waitQueue: [],
    totalAcquisitions: 0,
    contentionCount: 0
  }
}

function createEmptySemaphoreState(id: string, label: string | null): SemaphoreState {
  return {
    semaphoreId: id,
    label,
    totalPermits: 0,
    availablePermits: 0,
    activeHolders: [],
    waitQueue: [],
    utilization: 0,
    totalAcquisitions: 0,
    totalReleases: 0
  }
}


