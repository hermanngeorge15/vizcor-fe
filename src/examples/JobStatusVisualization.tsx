import { useState, useEffect } from 'react'
import { useEnhancedHierarchy } from '../hooks/use-enhanced-hierarchy'
import { EnhancedCoroutineTreeNode } from '../components/EnhancedCoroutineTreeNode'
import { HierarchyNode, VizEvent } from '../types/api'
import { useEventStream } from '../hooks/use-event-stream'

interface JobStatusVisualizationProps {
  sessionId: string
}

/**
 * Complete example showing job status visualization with
 * waiting-for-children indicators and structured concurrency
 */
export function JobStatusVisualization({ sessionId }: JobStatusVisualizationProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  
  // Stream events from backend
  const { events, isConnected, error } = useEventStream(sessionId)

  // Process events into hierarchy
  const {
    nodes,
    nodesArray,
    getRootNodes,
    getActiveChildrenCount,
    isWaitingForChildren,
  } = useEnhancedHierarchy(events)

  // Statistics
  const stats = {
    total: nodesArray.length,
    active: nodesArray.filter(n => n.state === 'ACTIVE').length,
    waiting: nodesArray.filter(n => n.state === 'WAITING_FOR_CHILDREN').length,
    completed: nodesArray.filter(n => n.state === 'COMPLETED').length,
    failed: nodesArray.filter(n => n.state === 'FAILED').length,
    cancelled: nodesArray.filter(n => n.state === 'CANCELLED').length,
  }

  const rootNodes = getRootNodes()
  const selectedNode = selectedNodeId ? nodes.get(selectedNodeId) : null

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex-none p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Job Status Visualization
        </h2>

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

        {/* Statistics */}
        <div className="grid grid-cols-6 gap-4">
          <StatCard label="Total" value={stats.total} color="gray" />
          <StatCard label="Active" value={stats.active} color="green" />
          <StatCard label="Waiting" value={stats.waiting} color="blue" />
          <StatCard label="Completed" value={stats.completed} color="emerald" />
          <StatCard label="Failed" value={stats.failed} color="red" />
          <StatCard label="Cancelled" value={stats.cancelled} color="orange" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex gap-4 p-4">
        {/* Tree View */}
        <div className="flex-1 overflow-auto">
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
                />
              ))
            )}
          </div>
        </div>

        {/* Details Panel */}
        {selectedNode && (
          <div className="w-96 flex-none bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 overflow-auto">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              Coroutine Details
            </h3>

            <DetailSection label="Coroutine ID" value={selectedNode.id} />
            <DetailSection label="Job ID" value={selectedNode.jobId} />
            <DetailSection label="Label" value={selectedNode.name} />
            <DetailSection label="State" value={selectedNode.state} />
            
            {selectedNode.currentThreadName && (
              <DetailSection label="Thread" value={selectedNode.currentThreadName} />
            )}
            
            {selectedNode.dispatcherName && (
              <DetailSection label="Dispatcher" value={selectedNode.dispatcherName} />
            )}

            {/* Children Info */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Children
              </h4>
              <DetailSection 
                label="Total" 
                value={selectedNode.children.length.toString()} 
              />
              {selectedNode.state === 'WAITING_FOR_CHILDREN' && (
                <>
                  <DetailSection 
                    label="Active" 
                    value={(selectedNode.activeChildrenCount || 0).toString()}
                    highlight
                  />
                  <DetailSection 
                    label="Completed" 
                    value={(selectedNode.children.length - (selectedNode.activeChildrenCount || 0)).toString()} 
                  />
                </>
              )}
            </div>

            {/* Waiting Info */}
            {selectedNode.state === 'WAITING_FOR_CHILDREN' && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
                  ⏳ Waiting for Children
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  This coroutine has finished its body but is waiting for {selectedNode.activeChildrenCount} 
                  {selectedNode.activeChildrenCount === 1 ? ' child' : ' children'} to complete.
                </p>
                {selectedNode.activeChildrenIds && selectedNode.activeChildrenIds.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Active children:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {selectedNode.activeChildrenIds.map(childId => {
                        const child = nodes.get(childId)
                        return child ? (
                          <button
                            key={childId}
                            onClick={() => setSelectedNodeId(childId)}
                            className="px-2 py-1 text-xs font-mono rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800"
                          >
                            {child.name}
                          </button>
                        ) : null
                      })}
                    </div>
                  </div>
                )}
              </div>
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
        )}
      </div>
    </div>
  )
}

// Helper Components
interface StatCardProps {
  label: string
  value: number
  color: 'gray' | 'green' | 'blue' | 'emerald' | 'red' | 'orange'
}

function StatCard({ label, value, color }: StatCardProps) {
  const colors = {
    gray: 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100',
    green: 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100',
    blue: 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100',
    emerald: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100',
    red: 'bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100',
    orange: 'bg-orange-100 text-orange-900 dark:bg-orange-900 dark:text-orange-100',
  }

  return (
    <div className={`rounded-lg p-3 ${colors[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  )
}

interface DetailSectionProps {
  label: string
  value: string
  highlight?: boolean
}

function DetailSection({ label, value, highlight }: DetailSectionProps) {
  return (
    <div className="mb-2">
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
      </div>
      <div className={`text-sm font-mono ${highlight ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-900 dark:text-gray-100'}`}>
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

