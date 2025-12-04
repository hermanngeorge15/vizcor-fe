// ============================================================================
// Synchronization Primitive Types for Mutex and Semaphore Visualization
// ============================================================================

// ============================================================================
// MUTEX TYPES
// ============================================================================

export interface MutexState {
  mutexId: string
  label: string | null
  isLocked: boolean
  owner: CoroutineInfo | null
  holdDurationMs: number
  waitQueue: CoroutineInfo[]
  totalAcquisitions: number
  contentionCount: number
}

export interface CoroutineInfo {
  id: string
  label: string | null
  waitTimeMs?: number
}

// Mutex Events
export interface MutexCreatedEvent {
  kind: 'MutexCreated'
  sessionId: string
  seq: number
  tsNanos: number
  mutexId: string
  mutexLabel: string | null
  ownerCoroutineId: string | null
}

export interface MutexLockRequestedEvent {
  kind: 'MutexLockRequested'
  sessionId: string
  seq: number
  tsNanos: number
  mutexId: string
  mutexLabel: string | null
  requesterId: string
  requesterLabel: string | null
  isLocked: boolean
  queuePosition: number
}

export interface MutexLockAcquiredEvent {
  kind: 'MutexLockAcquired'
  sessionId: string
  seq: number
  tsNanos: number
  mutexId: string
  mutexLabel: string | null
  acquirerId: string
  acquirerLabel: string | null
  waitDurationNanos: number
}

export interface MutexUnlockedEvent {
  kind: 'MutexUnlocked'
  sessionId: string
  seq: number
  tsNanos: number
  mutexId: string
  mutexLabel: string | null
  releaserId: string
  releaserLabel: string | null
  nextWaiterId: string | null
  holdDurationNanos: number
}

export interface MutexTryLockFailedEvent {
  kind: 'MutexTryLockFailed'
  sessionId: string
  seq: number
  tsNanos: number
  mutexId: string
  mutexLabel: string | null
  requesterId: string
  requesterLabel: string | null
  currentOwnerId: string | null
}

export interface MutexQueueChangedEvent {
  kind: 'MutexQueueChanged'
  sessionId: string
  seq: number
  tsNanos: number
  mutexId: string
  mutexLabel: string | null
  waitingCoroutineIds: string[]
  waitingLabels: (string | null)[]
}

export type MutexEvent = 
  | MutexCreatedEvent 
  | MutexLockRequestedEvent 
  | MutexLockAcquiredEvent 
  | MutexUnlockedEvent
  | MutexTryLockFailedEvent
  | MutexQueueChangedEvent

// ============================================================================
// SEMAPHORE TYPES
// ============================================================================

export interface SemaphoreState {
  semaphoreId: string
  label: string | null
  totalPermits: number
  availablePermits: number
  activeHolders: CoroutineInfo[]
  waitQueue: CoroutineInfo[]
  utilization: number // 0.0 to 1.0
  totalAcquisitions: number
  totalReleases: number
}

// Semaphore Events
export interface SemaphoreCreatedEvent {
  kind: 'SemaphoreCreated'
  sessionId: string
  seq: number
  tsNanos: number
  semaphoreId: string
  semaphoreLabel: string | null
  totalPermits: number
}

export interface SemaphoreAcquireRequestedEvent {
  kind: 'SemaphoreAcquireRequested'
  sessionId: string
  seq: number
  tsNanos: number
  semaphoreId: string
  semaphoreLabel: string | null
  requesterId: string
  requesterLabel: string | null
  availablePermits: number
  permitsRequested: number
}

export interface SemaphorePermitAcquiredEvent {
  kind: 'SemaphorePermitAcquired'
  sessionId: string
  seq: number
  tsNanos: number
  semaphoreId: string
  semaphoreLabel: string | null
  acquirerId: string
  acquirerLabel: string | null
  remainingPermits: number
  waitDurationNanos: number
}

export interface SemaphorePermitReleasedEvent {
  kind: 'SemaphorePermitReleased'
  sessionId: string
  seq: number
  tsNanos: number
  semaphoreId: string
  semaphoreLabel: string | null
  releaserId: string
  releaserLabel: string | null
  newAvailablePermits: number
  holdDurationNanos: number
}

export interface SemaphoreTryAcquireFailedEvent {
  kind: 'SemaphoreTryAcquireFailed'
  sessionId: string
  seq: number
  tsNanos: number
  semaphoreId: string
  semaphoreLabel: string | null
  requesterId: string
  requesterLabel: string | null
  availablePermits: number
  permitsRequested: number
}

export interface SemaphoreStateChangedEvent {
  kind: 'SemaphoreStateChanged'
  sessionId: string
  seq: number
  tsNanos: number
  semaphoreId: string
  semaphoreLabel: string | null
  availablePermits: number
  totalPermits: number
  activeHolders: string[]
  activeHolderLabels: (string | null)[]
  waitingCoroutines: string[]
  waitingLabels: (string | null)[]
}

export type SemaphoreEvent =
  | SemaphoreCreatedEvent
  | SemaphoreAcquireRequestedEvent
  | SemaphorePermitAcquiredEvent
  | SemaphorePermitReleasedEvent
  | SemaphoreTryAcquireFailedEvent
  | SemaphoreStateChangedEvent

// ============================================================================
// DEADLOCK TYPES
// ============================================================================

export interface DeadlockInfo {
  involvedCoroutines: CoroutineInfo[]
  involvedMutexes: MutexInfo[]
  cycleDescription: string
  detectedAt: number
}

export interface MutexInfo {
  id: string
  label: string | null
}

export interface DeadlockDetectedEvent {
  kind: 'DeadlockDetected'
  sessionId: string
  seq: number
  tsNanos: number
  involvedCoroutines: string[]
  involvedCoroutineLabels: (string | null)[]
  involvedMutexes: string[]
  involvedMutexLabels: (string | null)[]
  waitGraph: Record<string, string> // coroutineId -> waitingForMutexId
  holdGraph: Record<string, string> // mutexId -> heldByCoroutineId
  cycleDescription: string
}

export interface PotentialDeadlockWarningEvent {
  kind: 'PotentialDeadlockWarning'
  sessionId: string
  seq: number
  tsNanos: number
  coroutineId: string
  coroutineLabel: string | null
  holdingMutex: string
  holdingMutexLabel: string | null
  requestingMutex: string
  requestingMutexLabel: string | null
  recommendation: string
}

export type DeadlockEvent = DeadlockDetectedEvent | PotentialDeadlockWarningEvent

// ============================================================================
// COMBINED SYNC EVENT TYPE
// ============================================================================

export type SyncEvent = MutexEvent | SemaphoreEvent | DeadlockEvent

export function isMutexEvent(event: SyncEvent): event is MutexEvent {
  return event.kind.startsWith('Mutex')
}

export function isSemaphoreEvent(event: SyncEvent): event is SemaphoreEvent {
  return event.kind.startsWith('Semaphore')
}

export function isDeadlockEvent(event: SyncEvent): event is DeadlockEvent {
  return event.kind === 'DeadlockDetected' || event.kind === 'PotentialDeadlockWarning'
}

// ============================================================================
// SYNC SCENARIO API TYPES
// ============================================================================

export interface SyncScenario {
  path: string
  name: string
  type: 'Mutex' | 'Semaphore' | 'Combined'
  description: string
}

export interface SyncScenarioResponse {
  success: boolean
  sessionId: string
  scenario: string
  message: string
  eventCount: number
}

// ============================================================================
// HELPER UTILITIES
// ============================================================================

export function nanosToMs(nanos: number): number {
  return nanos / 1_000_000
}

export function formatDuration(nanos: number): string {
  const ms = nanosToMs(nanos)
  if (ms < 1) {
    return `${(nanos / 1000).toFixed(0)}μs`
  } else if (ms < 1000) {
    return `${ms.toFixed(1)}ms`
  } else {
    return `${(ms / 1000).toFixed(2)}s`
  }
}

export function formatUtilization(utilization: number): string {
  return `${(utilization * 100).toFixed(0)}%`
}

