/**
 * QUICK START EXAMPLE
 * 
 * This file shows how to use all the new features together.
 * Copy and adapt this code to your own components.
 */

import { useState } from 'react'
import { Card, CardBody, Button } from '@heroui/react'

// 1. Import the hooks
import { useHierarchyTree, useHierarchyStats } from '@/hooks/use-hierarchy'
import { useCoroutineTimeline } from '@/hooks/use-timeline'
import { useThreadActivity } from '@/hooks/use-thread-activity'

// 2. Import the new components
import { CoroutineTimelineView } from '@/components/CoroutineTimelineView'
import { ThreadLanesView } from '@/components/ThreadLanesView'
import { DispatcherOverview } from '@/components/DispatcherOverview'

// 3. Import utilities
import { formatNanoTime } from '@/lib/utils'
import { getDispatcherColor } from '@/lib/dispatcher-utils'

/**
 * Example 1: Simple Hierarchy Display
 */
export function Example1_SimpleHierarchy() {
  const sessionId = 'session-1'
  const { data: tree, isLoading } = useHierarchyTree(sessionId)

  if (isLoading) return <div>Loading...</div>
  if (!tree) return <div>No data</div>

  return (
    <div>
      <h2>Hierarchy Tree</h2>
      {tree.map(node => (
        <div key={node.id}>
          {node.name} - {node.dispatcherName} dispatcher
        </div>
      ))}
    </div>
  )
}

/**
 * Example 2: Show Statistics
 */
export function Example2_Statistics() {
  const sessionId = 'session-1'
  const stats = useHierarchyStats(sessionId)

  return (
    <Card>
      <CardBody>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-default-500">Total Coroutines</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div>
            <div className="text-sm text-default-500">Max Depth</div>
            <div className="text-2xl font-bold">{stats.maxDepth}</div>
          </div>
          <div>
            <div className="text-sm text-default-500">Active</div>
            <div className="text-2xl font-bold">{stats.byState['ACTIVE'] || 0}</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-sm font-semibold mb-2">By Dispatcher:</div>
          {Object.entries(stats.byDispatcher).map(([dispatcher, count]) => (
            <div key={dispatcher} className="flex justify-between text-sm">
              <span>{dispatcher}</span>
              <span className="font-semibold">{count}</span>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}

/**
 * Example 3: Timeline with Selection
 */
export function Example3_TimelineWithSelection() {
  const sessionId = 'session-1'
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data: tree } = useHierarchyTree(sessionId)

  return (
    <div className="space-y-4">
      {/* Coroutine List */}
      <Card>
        <CardBody>
          <h3 className="font-semibold mb-3">Select a Coroutine:</h3>
          <div className="space-y-2">
            {tree?.map(node => (
              <Button
                key={node.id}
                onPress={() => setSelectedId(node.id)}
                variant={selectedId === node.id ? 'solid' : 'flat'}
                className="w-full justify-start"
              >
                {node.name || node.id}
              </Button>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Timeline */}
      {selectedId && (
        <CoroutineTimelineView 
          sessionId={sessionId} 
          coroutineId={selectedId} 
        />
      )}
    </div>
  )
}

/**
 * Example 4: Complete Dashboard
 */
export function Example4_CompleteDashboard() {
  const sessionId = 'session-1'
  const stats = useHierarchyStats(sessionId)
  const { data: threadActivity } = useThreadActivity(sessionId)

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Coroutines" value={stats.total} />
        <StatCard label="Active" value={stats.byState['ACTIVE'] || 0} color="success" />
        <StatCard label="Max Depth" value={stats.maxDepth} />
        <StatCard 
          label="Threads" 
          value={threadActivity?.threads.length || 0} 
          color="secondary" 
        />
      </div>

      {/* Dispatchers */}
      <DispatcherOverview sessionId={sessionId} />

      {/* Thread Activity */}
      <ThreadLanesView sessionId={sessionId} />
    </div>
  )
}

/**
 * Example 5: Using Mock Data Directly
 */
export function Example5_MockDataTesting() {
  // You can also generate mock data directly for testing
  const [mockData, setMockData] = useState<any>(null)

  const generateMock = async () => {
    // Import dynamically
    const { generateCompleteScenario } = await import('@/mocks/mock-data')
    const data = generateCompleteScenario({
      hierarchyDepth: 3,
      hierarchyBreadth: 2,
      threadCount: 4
    })
    setMockData(data)
  }

  return (
    <div>
      <Button onPress={generateMock}>Generate Mock Data</Button>
      {mockData && (
        <pre className="mt-4 p-4 bg-default-100 rounded overflow-auto text-xs">
          {JSON.stringify(mockData, null, 2)}
        </pre>
      )}
    </div>
  )
}

/**
 * Example 6: Real-time Updates
 */
export function Example6_RealTimeUpdates() {
  const sessionId = 'session-1'
  // This hook auto-refreshes every 2 seconds
  const { data: threadActivity, dataUpdatedAt } = useThreadActivity(sessionId)

  return (
    <div>
      <div className="text-sm text-default-500 mb-4">
        Last updated: {new Date(dataUpdatedAt).toLocaleTimeString()}
      </div>
      <ThreadLanesView sessionId={sessionId} />
    </div>
  )
}

// Helper Component
function StatCard({ 
  label, 
  value, 
  color = 'default' 
}: { 
  label: string
  value: number
  color?: 'default' | 'success' | 'secondary'
}) {
  const colorClasses = {
    default: 'bg-default-100',
    success: 'bg-success/10 text-success',
    secondary: 'bg-secondary/10 text-secondary'
  }

  return (
    <Card>
      <CardBody className={colorClasses[color]}>
        <div className="text-sm opacity-80">{label}</div>
        <div className="text-3xl font-bold">{value}</div>
      </CardBody>
    </Card>
  )
}

/**
 * HOW TO USE THESE EXAMPLES:
 * 
 * 1. Copy the example you need to your component
 * 2. Change the sessionId to your actual session ID
 * 3. Customize the UI to match your design
 * 4. Add error handling and loading states
 * 
 * Remember: All data comes from mock handlers while backend is in development!
 * When backend is ready, just disable MSW and it will use real API.
 */

