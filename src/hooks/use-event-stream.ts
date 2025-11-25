import { useEffect, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { VizEvent } from '@/types/api'

export function useEventStream(sessionId: string | undefined, enabled = true) {
  const [events, setEvents] = useState<VizEvent[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const clearEvents = useCallback(() => {
    setEvents([])
  }, [])

  useEffect(() => {
    if (!sessionId || !enabled) {
      setIsConnected(false)
      return
    }

    let eventSource: EventSource | null = null

    try {
      eventSource = apiClient.createEventSource(sessionId)

      eventSource.onopen = () => {
        setIsConnected(true)
        setError(null)
      }

      eventSource.onerror = () => {
        setIsConnected(false)
        setError('Connection lost')
      }

      // Listen for all event types
      const eventTypes = [
        'coroutine.created',
        'coroutine.started',
        'coroutine.suspended',
        'coroutine.resumed',
        'coroutine.body-completed',
        'coroutine.completed',
        'coroutine.cancelled',
        'coroutine.failed',
        'thread.assigned',
        'JobStateChanged',
        'JobCancellationRequested',
        'JobJoinRequested',
        'JobJoinCompleted',
      ]

      eventTypes.forEach(eventType => {
        eventSource?.addEventListener(eventType, (e: Event) => {
          const messageEvent = e as MessageEvent
          try {
            const event: VizEvent = JSON.parse(messageEvent.data)
            setEvents(prev => [...prev, event])
            
            // Invalidate session queries to update UI
            queryClient.invalidateQueries({ queryKey: ['sessions', sessionId] })
          } catch (err) {
            console.error('Failed to parse event:', err)
          }
        })
      })

      // Also listen for error events from server
      eventSource.addEventListener('error', (e: Event) => {
        const messageEvent = e as MessageEvent
        if (messageEvent.data) {
          try {
            const errorData = JSON.parse(messageEvent.data)
            setError(errorData.error || 'Unknown error')
          } catch {
            // ignore
          }
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect')
      setIsConnected(false)
    }

    return () => {
      if (eventSource) {
        eventSource.close()
        setIsConnected(false)
      }
    }
  }, [sessionId, enabled, queryClient])

  return {
    events,
    isConnected,
    error,
    clearEvents,
  }
}

