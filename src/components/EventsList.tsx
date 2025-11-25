import { useMemo, useState } from 'react'
import { Card, CardBody, Chip, Input } from '@heroui/react'
import { motion, AnimatePresence } from 'framer-motion'
import type { VizEvent } from '@/types/api'
import { formatNanoTime, formatRelativeTime } from '@/lib/utils'
import { FiSearch } from 'react-icons/fi'
import { DispatcherBadge } from './DispatcherBadge'

interface EventsListProps {
  events: VizEvent[]
}

export function EventsList({ events }: EventsListProps) {
  const [filter, setFilter] = useState('')

  const filteredEvents = useMemo(() => {
    if (!filter) return events

    const lower = filter.toLowerCase()
    return events.filter(
      e =>
        e.kind.toLowerCase().includes(lower) ||
        e.coroutineId.toLowerCase().includes(lower) ||
        e.label?.toLowerCase().includes(lower)
    )
  }, [events, filter])

  const sortedEvents = useMemo(
    () => [...filteredEvents].sort((a, b) => b.seq - a.seq),
    [filteredEvents]
  )

  if (events.length === 0) {
    return (
      <div className="py-8 text-center text-default-400">
        No events yet. Events will appear here as coroutines are created and executed.
      </div>
    )
  }

  const baseTime = events[0]?.tsNanos || 0

  return (
    <div className="space-y-4">
      <Input
        placeholder="Filter events..."
        value={filter}
        onValueChange={setFilter}
        startContent={<FiSearch />}
        isClearable
        onClear={() => setFilter('')}
      />

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {sortedEvents.map((event, idx) => (
            <motion.div
              key={`${event.sessionId}-${event.seq}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: idx * 0.02 }}
            >
              <Card 
                shadow="sm"
                className={
                  event.kind.includes('failed')
                    ? 'border-l-4 border-danger'
                    : event.kind.includes('cancelled')
                    ? 'border-l-4 border-warning'
                    : event.kind.includes('body-completed')
                    ? 'border-l-4 border-primary/50'
                    : ''
                }
              >
                <CardBody className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="font-mono text-xs text-default-500">
                        #{event.seq}
                      </div>
                      <Chip
                        size="sm"
                        color={getEventColor(event.kind)}
                        variant="flat"
                        startContent={
                          event.kind.includes('failed') ? '⚠️' :
                          event.kind.includes('cancelled') ? '🚫' :
                          event.kind.includes('body-completed') ? '⏳' :
                          undefined
                        }
                      >
                        {event.kind}
                      </Chip>
                      <div>
                        <div className="font-semibold">
                          {event.label || event.coroutineId}
                        </div>
                        <div className="text-xs text-default-500">
                          Coroutine: {event.coroutineId}
                          {event.parentCoroutineId && ` • Parent: ${event.parentCoroutineId}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-xs text-default-400">
                      <div>{formatNanoTime(event.tsNanos)}</div>
                      <div>{formatRelativeTime(event.tsNanos, baseTime)}</div>
                    </div>
                  </div>
                  
                  {/* Add explanation for key events */}
                  {event.kind.includes('body-completed') && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2 rounded-md bg-primary/10 px-3 py-2 text-xs text-primary"
                    >
                      Body finished, waiting for children to complete (structured concurrency)
                    </motion.div>
                  )}
                  
                  {event.kind.includes('failed') && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2 rounded-md bg-danger/10 px-3 py-2 text-xs text-danger"
                    >
                      ⚠️ Exception will propagate to parent and cancel siblings
                    </motion.div>
                  )}
                  
                  {event.kind.includes('cancelled') && event.parentCoroutineId && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2 rounded-md bg-warning/10 px-3 py-2 text-xs text-warning"
                    >
                      Cancelled by structured concurrency (parent or sibling failure)
                    </motion.div>
                  )}
                  
                  {/* Job-related event explanations */}
                  {event.kind === 'JobStateChanged' && 'childrenCount' in event && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2 rounded-md bg-secondary/10 px-3 py-2 text-xs text-secondary"
                    >
                      Job State: {(event as any).isActive ? '🟢 Active' : '⚫ Inactive'} | 
                      {(event as any).isCompleted ? ' ✅ Completed' : ''} 
                      {(event as any).isCancelled ? ' 🚫 Cancelled' : ''} | 
                      Children: {(event as any).childrenCount}
                    </motion.div>
                  )}
                  
                  {event.kind === 'JobCancellationRequested' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2 rounded-md bg-warning/10 px-3 py-2 text-xs text-warning"
                    >
                      🚫 Cancellation requested
                      {'requestedBy' in event && (event as any).requestedBy && 
                        ` by ${(event as any).requestedBy}`}
                      {'cause' in event && (event as any).cause && 
                        `: ${(event as any).cause}`}
                    </motion.div>
                  )}
                  
                  {event.kind === 'JobJoinRequested' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2 rounded-md bg-primary/10 px-3 py-2 text-xs text-primary"
                    >
                      ⏳ Waiting for job to complete
                      {'waitingCoroutineId' in event && (event as any).waitingCoroutineId && 
                        ` (caller: ${(event as any).waitingCoroutineId})`}
                    </motion.div>
                  )}
                  
                  {event.kind === 'JobJoinCompleted' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2 rounded-md bg-success/10 px-3 py-2 text-xs text-success"
                    >
                      ✅ Job wait completed, execution resumed
                    </motion.div>
                  )}
                  
                  {/* Dispatcher events */}
                  {event.kind === 'DispatcherSelected' && 'dispatcherName' in event && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2 flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-xs"
                    >
                      <span className="text-primary">🎯 Dispatcher selected:</span>
                      <DispatcherBadge dispatcherName={(event as any).dispatcherName} />
                      <span className="text-default-500 font-mono text-xs">
                        ID: {(event as any).dispatcherId}
                      </span>
                    </motion.div>
                  )}
                  
                  {event.kind === 'thread.assigned' && 'threadName' in event && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2 flex items-center gap-2 rounded-md bg-success/10 px-3 py-2 text-xs"
                    >
                      <span className="text-success">🧵 Thread assigned:</span>
                      <code className="font-mono text-xs">{(event as any).threadName}</code>
                      {'dispatcherName' in event && (event as any).dispatcherName && (
                        <>
                          <span className="text-default-500">on</span>
                          <DispatcherBadge dispatcherName={(event as any).dispatcherName} />
                        </>
                      )}
                    </motion.div>
                  )}
                  
                  {/* Async/Deferred events */}
                  {event.kind === 'DeferredValueAvailable' && 'deferredId' in event && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2 rounded-md bg-success/10 px-3 py-2 text-xs text-success"
                    >
                      ✅ Async result available: {(event as any).deferredId}
                    </motion.div>
                  )}
                  
                  {event.kind === 'DeferredAwaitStarted' && 'deferredId' in event && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2 rounded-md bg-warning/10 px-3 py-2 text-xs text-warning"
                    >
                      ⏳ Awaiting async result: {(event as any).deferredId}
                      {' by '}
                      {(event as any).awaitingCoroutineId}
                    </motion.div>
                  )}
                  
                  {event.kind === 'DeferredAwaitCompleted' && 'deferredId' in event && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2 rounded-md bg-success/10 px-3 py-2 text-xs text-success"
                    >
                      ✅ Await completed: {(event as any).deferredId}
                    </motion.div>
                  )}
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

function getEventColor(kind: string): 'primary' | 'success' | 'warning' | 'danger' | 'default' | 'secondary' {
  if (kind.includes('created')) return 'default'
  if (kind.includes('started')) return 'primary'
  if (kind.includes('body-completed')) return 'primary'
  if (kind.includes('completed')) return 'success'
  if (kind.includes('failed')) return 'danger'
  if (kind.includes('cancelled')) return 'warning'
  if (kind.includes('suspended')) return 'secondary'
  if (kind.includes('resumed')) return 'primary'
  if (kind === 'DispatcherSelected') return 'primary'
  if (kind === 'thread.assigned') return 'success'
  if (kind === 'DeferredValueAvailable') return 'success'
  if (kind === 'DeferredAwaitStarted') return 'warning'
  if (kind === 'DeferredAwaitCompleted') return 'success'
  if (kind === 'JobStateChanged') return 'secondary'
  if (kind === 'JobCancellationRequested') return 'warning'
  if (kind === 'JobJoinRequested') return 'primary'
  if (kind === 'JobJoinCompleted') return 'success'
  return 'default'
}

