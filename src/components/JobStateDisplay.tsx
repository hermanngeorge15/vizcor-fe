import { Card, CardBody, CardHeader, Chip } from '@heroui/react'
import { motion } from 'framer-motion'
import type { JobStateChangedEvent } from '@/types/api'

interface JobStateDisplayProps {
  jobStates: Map<string, JobStateChangedEvent>
}

export function JobStateDisplay({ jobStates }: JobStateDisplayProps) {
  if (jobStates.size === 0) {
    return (
      <div className="py-8 text-center text-default-400">
        No job state information available yet.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {Array.from(jobStates.values()).map((jobState) => (
        <motion.div
          key={jobState.jobId}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card shadow="sm">
            <CardHeader className="pb-2">
              <div className="flex w-full items-center justify-between">
                <div>
                  <div className="font-semibold">
                    {jobState.label || jobState.jobId}
                  </div>
                  <div className="text-xs text-default-500">
                    Job ID: {jobState.jobId}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Chip
                    size="sm"
                    color={jobState.isActive ? 'success' : 'default'}
                    variant="flat"
                  >
                    {jobState.isActive ? '🟢 Active' : '⚫ Inactive'}
                  </Chip>
                  {jobState.isCompleted && (
                    <Chip size="sm" color="success" variant="flat">
                      ✅ Completed
                    </Chip>
                  )}
                  {jobState.isCancelled && (
                    <Chip size="sm" color="warning" variant="flat">
                      🚫 Cancelled
                    </Chip>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-default-500">Coroutine ID</div>
                  <div className="font-mono text-xs">{jobState.coroutineId}</div>
                </div>
                <div>
                  <div className="text-xs text-default-500">Scope ID</div>
                  <div className="font-mono text-xs">{jobState.scopeId}</div>
                </div>
                {jobState.parentCoroutineId && (
                  <div>
                    <div className="text-xs text-default-500">Parent</div>
                    <div className="font-mono text-xs">{jobState.parentCoroutineId}</div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-default-500">Children Count</div>
                  <div className="font-mono text-xs">{jobState.childrenCount}</div>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

