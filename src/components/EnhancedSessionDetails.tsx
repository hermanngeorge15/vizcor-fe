/**
 * Enhanced Session Details with New Features
 * 
 * This is an ENHANCED version showing how to integrate all new components.
 * You can either:
 * 1. Replace SessionDetails.tsx with this
 * 2. Or integrate these features into your existing SessionDetails.tsx
 */

import { useState } from 'react'
import { Card, CardBody, Tabs, Tab } from '@heroui/react'
import { useSession } from '@/hooks/use-sessions'
import { useHierarchyTree, useHierarchyStats } from '@/hooks/use-hierarchy'
import { CoroutineTreeGraph } from './CoroutineTreeGraph'
import { CoroutineTimelineView } from './CoroutineTimelineView'
import { ThreadLanesView } from './ThreadLanesView'
import { DispatcherOverview } from './DispatcherOverview'
import { EventsList } from './EventsList'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorAlert } from './ErrorAlert'
import { FiGitBranch, FiClock, FiCpu, FiLayers, FiList } from 'react-icons/fi'

interface EnhancedSessionDetailsProps {
  sessionId: string
}

export function EnhancedSessionDetails({ sessionId }: EnhancedSessionDetailsProps) {
  const { data: session, isLoading, error } = useSession(sessionId)
  const { data: hierarchyTree } = useHierarchyTree(sessionId)
  const stats = useHierarchyStats(sessionId)
  
  const [selectedTab, setSelectedTab] = useState<string>('hierarchy')
  const [selectedCoroutineId, setSelectedCoroutineId] = useState<string | null>(null)

  if (isLoading) {
    return <LoadingSpinner message="Loading session..." />
  }

  if (error) {
    return <ErrorAlert message={error instanceof Error ? error.message : 'Failed to load session'} />
  }

  if (!session) {
    return <ErrorAlert message="Session not found" />
  }

  return (
    <div className="space-y-6">
      {/* Session Header with Stats */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Session: {sessionId}</h1>
              <p className="text-default-500">
                {session.coroutineCount} coroutines, {session.eventCount} events
              </p>
            </div>
            <div className="flex gap-4">
              <StatBadge label="Total Coroutines" value={stats.total} />
              <StatBadge label="Max Depth" value={stats.maxDepth} />
              <StatBadge 
                label="Active" 
                value={stats.byState['ACTIVE'] || 0} 
                color="success" 
              />
            </div>
          </div>

          {/* State Distribution */}
          {stats.total > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-semibold">State Distribution:</div>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(stats.byState).map(([state, count]) => (
                  <div key={state} className="px-3 py-1 rounded-full bg-default-100 text-sm">
                    <span className="font-semibold">{state}</span>: {count}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Main Content Tabs */}
      <Tabs
        selectedKey={selectedTab}
        onSelectionChange={(key) => setSelectedTab(key as string)}
        size="lg"
        aria-label="Session views"
      >
        <Tab
          key="hierarchy"
          title={
            <div className="flex items-center gap-2">
              <FiGitBranch />
              <span>Hierarchy</span>
            </div>
          }
        >
          <Card className="mt-4">
            <CardBody>
              {hierarchyTree && hierarchyTree.length > 0 ? (
                <CoroutineTreeGraph 
                  coroutines={session.coroutines}
                  onNodeClick={(coroutineId) => {
                    setSelectedCoroutineId(coroutineId)
                    setSelectedTab('timeline')
                  }}
                />
              ) : (
                <div className="text-center text-default-400 py-8">
                  No coroutines in hierarchy yet
                </div>
              )}
            </CardBody>
          </Card>
        </Tab>

        <Tab
          key="timeline"
          title={
            <div className="flex items-center gap-2">
              <FiClock />
              <span>Timeline</span>
            </div>
          }
        >
          <div className="mt-4">
            {selectedCoroutineId ? (
              <CoroutineTimelineView 
                sessionId={sessionId} 
                coroutineId={selectedCoroutineId} 
              />
            ) : (
              <Card>
                <CardBody>
                  <div className="text-center text-default-400 py-8">
                    Select a coroutine from the hierarchy to view its timeline
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </Tab>

        <Tab
          key="threads"
          title={
            <div className="flex items-center gap-2">
              <FiCpu />
              <span>Thread Activity</span>
            </div>
          }
        >
          <div className="mt-4">
            <ThreadLanesView sessionId={sessionId} />
          </div>
        </Tab>

        <Tab
          key="dispatchers"
          title={
            <div className="flex items-center gap-2">
              <FiLayers />
              <span>Dispatchers</span>
            </div>
          }
        >
          <div className="mt-4">
            <DispatcherOverview sessionId={sessionId} />
          </div>
        </Tab>

        <Tab
          key="events"
          title={
            <div className="flex items-center gap-2">
              <FiList />
              <span>Events</span>
            </div>
          }
        >
          <Card className="mt-4">
            <CardBody>
              <EventsList sessionId={sessionId} />
            </CardBody>
          </Card>
        </Tab>
      </Tabs>

      {/* Selected Coroutine Details (Bottom Panel) */}
      {selectedCoroutineId && selectedTab !== 'timeline' && (
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Selected Coroutine: {selectedCoroutineId}</h3>
              <button
                onClick={() => setSelectedTab('timeline')}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                View Full Timeline
              </button>
            </div>
            <CoroutineTimelineView 
              sessionId={sessionId} 
              coroutineId={selectedCoroutineId} 
            />
          </CardBody>
        </Card>
      )}
    </div>
  )
}

function StatBadge({ 
  label, 
  value, 
  color = 'default' 
}: { 
  label: string
  value: number
  color?: 'default' | 'success' | 'warning' | 'danger'
}) {
  const colorClasses = {
    default: 'bg-default-100 text-default-900',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
  }

  return (
    <div className={`px-4 py-2 rounded-lg ${colorClasses[color]}`}>
      <div className="text-xs uppercase tracking-wide opacity-80">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}

