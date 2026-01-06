import { useState } from 'react'
import { useEnhancedHierarchy } from '../hooks/use-enhanced-hierarchy'
import { EnhancedCoroutineTreeNode } from '../components/EnhancedCoroutineTreeNode'
import { JobInfoCard, JobLifecycleExplainer } from '../components/JobInfoCard'
import { HierarchyNode } from '../types/api'
import { useEventStream } from '../hooks/use-event-stream'

interface CoroutineAndJobVisualizationProps {
  sessionId: string
}

/**
 * Complete visualization showing both Coroutine state and Job properties.
 * Demonstrates the relationship between Coroutine lifecycle and Job lifecycle.
 */
export function CoroutineAndJobVisualization({ sessionId }: CoroutineAndJobVisualizationProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [showJobInfo, setShowJobInfo] = useState(true)
  
  // Stream events from backend
  const { events, isConnected, error } = useEventStream(sessionId)

  // Process events into hierarchy
  const { nodes, getRootNodes } = useEnhancedHierarchy(events)

  const rootNodes = getRootNodes()
  const selectedNode = selectedNodeId ? nodes.get(selectedNodeId) : null

  // Calculate job statistics
  const jobStats = calculateJobStats(Array.from(nodes.values()))

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex-none p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Coroutine & Job Visualization
          </h2>
          
          {/* Toggle Job Info */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showJobInfo}
              onChange={(e) => setShowJobInfo(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Show Job Properties
            </span>
          </label>
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          {error && (
            <span className="text-sm text-red-600 dark:text-red-400">
              Error: {error}
            </span>
          )}
        </div>

        {/* Job Statistics */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard 
            label="Total Jobs" 
            value={jobStats.total} 
            icon="📊"
            color="blue" 
          />
          <StatCard 
            label="Active Jobs" 
            value={jobStats.active} 
            icon="▶️"
            color="green" 
          />
          <StatCard 
            label="Waiting for Children" 
            value={jobStats.waiting} 
            icon="⏳"
            color="blue" 
          />
          <StatCard 
            label="Completed Jobs" 
            value={jobStats.completed} 
            icon="✓"
            color="emerald" 
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex gap-4 p-4">
        {/* Tree View */}
        <div className="flex-1 overflow-auto">
          {/* Explainer */}
          {rootNodes.length === 0 && (
            <div className="mb-4">
              <JobLifecycleExplainer />
            </div>
          )}

          <div className="space-y-3">
            {rootNodes.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No coroutines yet. Run a scenario to see the visualization.
              </div>
            ) : (
              rootNodes.map(root => (
                <EnhancedCoroutineTreeNode
                  key={root.id}
                  node={root}
                  allNodes={nodes}
                  selectedNodeId={selectedNodeId || undefined}
                  onNodeClick={(node) => setSelectedNodeId(node.id)}
                  showJobInfo={showJobInfo}
                />
              ))
            )}
          </div>
        </div>

        {/* Details Panel */}
        {selectedNode && (
          <div className="w-96 flex-none space-y-4 overflow-auto">
            {/* Coroutine Details */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                Coroutine Details
              </h3>

              <DetailSection label="Coroutine ID" value={selectedNode.id} />
              <DetailSection label="Label" value={selectedNode.name} />
              <DetailSection label="State" value={selectedNode.state} />
              
              {selectedNode.currentThreadName && (
                <DetailSection label="Thread" value={selectedNode.currentThreadName} />
              )}
              
              {selectedNode.dispatcherName && (
                <DetailSection label="Dispatcher" value={selectedNode.dispatcherName} />
              )}

              {/* Timing */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Timing
                </h4>
                <DetailSection 
                  label="Created" 
                  value={formatTimestamp(selectedNode.createdAtNanos)} 
                />
                {selectedNode.completedAtNanos && (
                  <DetailSection 
                    label="Completed" 
                    value={formatTimestamp(selectedNode.completedAtNanos)} 
                  />
                )}
              </div>
            </div>

            {/* Job Details */}
            <JobInfoCard node={selectedNode} />

            {/* Lifecycle Comparison */}
            <LifecycleComparison node={selectedNode} />
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Side-by-side comparison of Coroutine State vs Job State
 */
function LifecycleComparison({ node }: { node: HierarchyNode }) {
  const jobState = deriveJobState(node.state)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
        Lifecycle Comparison
      </h3>

      <div className="space-y-3">
        {/* Coroutine State */}
        <div>
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
            Coroutine State
          </div>
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {node.state}
          </div>
        </div>

        {/* Job State */}
        <div>
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
            Job State
          </div>
          <div className="flex flex-wrap gap-1">
            {jobState.isActive && (
              <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                ACTIVE
              </span>
            )}
            {jobState.isCompleted && (
              <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                COMPLETED
              </span>
            )}
            {jobState.isCancelled && (
              <span className="px-2 py-1 text-xs font-semibold rounded bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                CANCELLED
              </span>
            )}
          </div>
        </div>

        {/* Special Case: Waiting for Children */}
        {node.state === 'WAITING_FOR_CHILDREN' && (
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
            <div className="text-xs text-blue-800 dark:text-blue-200">
              <div className="font-semibold mb-1">⚠️ Important:</div>
              <div>
                Coroutine body is done (<span className="font-mono">WAITING_FOR_CHILDREN</span>), 
                but Job is still <span className="font-mono font-bold">isActive=true</span> 
                because {node.activeChildrenCount || 0} children are still running!
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper Components
interface StatCardProps {
  label: string
  value: number
  icon: string
  color: 'blue' | 'green' | 'emerald'
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  const colors = {
    blue: 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100',
    green: 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100',
    emerald: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100',
  }

  return (
    <div className={`rounded-lg p-3 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{icon}</span>
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <div className="text-xs opacity-80">{label}</div>
    </div>
  )
}

function DetailSection({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2">
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
      </div>
      <div className="text-sm font-mono text-gray-900 dark:text-gray-100">
        {value}
      </div>
    </div>
  )
}

function formatTimestamp(nanos: number): string {
  const ms = nanos / 1000000
  const date = new Date(ms)
  return date.toLocaleTimeString() + '.' + (ms % 1000).toFixed(0).padStart(3, '0')
}

function deriveJobState(coroutineState: string): { isActive: boolean; isCompleted: boolean; isCancelled: boolean } {
  switch (coroutineState) {
    case 'CREATED':
    case 'ACTIVE':
    case 'SUSPENDED':
    case 'WAITING_FOR_CHILDREN':
      return { isActive: true, isCompleted: false, isCancelled: false }
    case 'COMPLETED':
      return { isActive: false, isCompleted: true, isCancelled: false }
    case 'CANCELLED':
      return { isActive: false, isCompleted: false, isCancelled: true }
    case 'FAILED':
      return { isActive: false, isCompleted: true, isCancelled: false }
    default:
      return { isActive: false, isCompleted: false, isCancelled: false }
  }
}

function calculateJobStats(nodes: HierarchyNode[]) {
  return {
    total: nodes.length,
    active: nodes.filter(n => ['CREATED', 'ACTIVE', 'SUSPENDED', 'WAITING_FOR_CHILDREN'].includes(n.state)).length,
    waiting: nodes.filter(n => n.state === 'WAITING_FOR_CHILDREN').length,
    completed: nodes.filter(n => n.state === 'COMPLETED').length,
  }
}

