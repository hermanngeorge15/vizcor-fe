import { useState, useCallback } from 'react'
import type { SyncScenario, SyncScenarioResponse } from '../types/sync'

const API_BASE = 'http://localhost:8080'

/**
 * Hook for interacting with synchronization scenario APIs
 */
export function useSyncScenarios() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scenarios, setScenarios] = useState<SyncScenario[]>([])
  const [lastResult, setLastResult] = useState<SyncScenarioResponse | null>(null)

  /**
   * Fetch available sync scenarios
   */
  const fetchScenarios = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_BASE}/api/sync/scenarios`)
      if (!response.ok) {
        throw new Error(`Failed to fetch scenarios: ${response.statusText}`)
      }
      const data = await response.json()
      setScenarios(data)
      return data as SyncScenario[]
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Run a specific sync scenario
   */
  const runScenario = useCallback(async (scenarioPath: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_BASE}/api/sync/${scenarioPath}`)
      if (!response.ok) {
        throw new Error(`Failed to run scenario: ${response.statusText}`)
      }
      const data = await response.json() as SyncScenarioResponse
      setLastResult(data)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Run a scenario by its full definition
   */
  const runScenarioByDefinition = useCallback(async (scenario: SyncScenario) => {
    return runScenario(scenario.path)
  }, [runScenario])

  return {
    loading,
    error,
    scenarios,
    lastResult,
    fetchScenarios,
    runScenario,
    runScenarioByDefinition
  }
}

/**
 * Predefined scenarios for quick access
 */
export const SYNC_SCENARIOS = {
  // Mutex scenarios
  MUTEX_COUNTER: 'mutex/counter',
  MUTEX_BANK_TRANSFER: 'mutex/bank-transfer',
  MUTEX_CACHE: 'mutex/cache',
  MUTEX_DEADLOCK: 'mutex/deadlock-demo',
  
  // Semaphore scenarios
  SEMAPHORE_CONNECTION_POOL: 'semaphore/connection-pool',
  SEMAPHORE_RATE_LIMITER: 'semaphore/rate-limiter',
  SEMAPHORE_FILE_PROCESSOR: 'semaphore/file-processor',
  SEMAPHORE_RESOURCE_TIMEOUT: 'semaphore/resource-timeout',
  SEMAPHORE_PRODUCER_CONSUMER: 'semaphore/producer-consumer',
  
  // Combined scenarios
  COMBINED_ECOMMERCE: 'combined/ecommerce'
} as const

export type SyncScenarioKey = keyof typeof SYNC_SCENARIOS

export default useSyncScenarios


