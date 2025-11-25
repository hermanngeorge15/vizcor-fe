import { useMemo } from 'react'
import { Card, CardBody, Chip } from '@heroui/react'
import { motion } from 'framer-motion'
import type { CoroutineNode, CoroutineState } from '@/types/api'
import { buildCoroutineTree } from '@/lib/utils'
import { FiCircle, FiCheckCircle, FiXCircle, FiPlay, FiClock, FiPause, FiAlertCircle } from 'react-icons/fi'

interface CoroutineTreeProps {
  coroutines: CoroutineNode[]
}

export function CoroutineTree({ coroutines }: CoroutineTreeProps) {
  const tree = useMemo(() => buildCoroutineTree(coroutines), [coroutines])

  if (coroutines.length === 0) {
    return (
      <div className="py-8 text-center text-default-400">
        No coroutines in this session yet.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {tree.map(node => (
        <TreeNode key={node.id} node={node} depth={0} />
      ))}
    </div>
  )
}

interface TreeNodeProps {
  node: CoroutineNode & { children: CoroutineNode[] }
  depth: number
}

function TreeNode({ node, depth }: TreeNodeProps) {
  const stateConfig = getStateConfig(node.state)
  
  // Add pulsing animation for active/waiting states
  const shouldPulse = node.state === 'ACTIVE' || node.state === 'WAITING_FOR_CHILDREN'
  
  // Add shake animation for failed/cancelled states
  const shouldShake = node.state === 'FAILED' || node.state === 'CANCELLED'

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ 
        opacity: 1, 
        x: 0,
        scale: shouldShake ? [1, 1.02, 0.98, 1] : 1
      }}
      transition={{ 
        delay: depth * 0.05,
        scale: shouldShake ? { 
          duration: 0.5, 
          repeat: 2,
          ease: "easeInOut" 
        } : {}
      }}
      style={{ marginLeft: `${depth * 24}px` }}
    >
      <motion.div
        animate={
          shouldPulse 
            ? {
                boxShadow: [
                  '0 0 0 0 rgba(99, 102, 241, 0)',
                  '0 0 0 4px rgba(99, 102, 241, 0.1)',
                  '0 0 0 0 rgba(99, 102, 241, 0)',
                ],
              }
            : {}
        }
        transition={
          shouldPulse
            ? {
                duration: node.state === 'WAITING_FOR_CHILDREN' ? 2.5 : 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : {}
        }
      >
        <Card className="mb-2" shadow="sm">
          <CardBody className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div 
                  className={stateConfig.color}
                  animate={
                    node.state === 'ACTIVE'
                      ? { rotate: 360 }
                      : node.state === 'WAITING_FOR_CHILDREN'
                      ? { scale: [1, 1.1, 1] }
                      : {}
                  }
                  transition={
                    node.state === 'ACTIVE'
                      ? { duration: 2, repeat: Infinity, ease: 'linear' }
                      : node.state === 'WAITING_FOR_CHILDREN'
                      ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                      : {}
                  }
                >
                  {stateConfig.icon}
                </motion.div>
                <div>
                  <div className="font-semibold">
                    {node.label || node.id}
                  </div>
                  <div className="text-xs text-default-500">
                    {node.id} • Job: {node.jobId}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Chip
                  color={stateConfig.chipColor}
                  size="sm"
                  variant="flat"
                  startContent={
                    shouldPulse ? (
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
                      </span>
                    ) : undefined
                  }
                >
                  {node.state}
                </Chip>
                <Chip size="sm" variant="bordered">
                  Scope: {node.scopeId}
                </Chip>
              </div>
            </div>
            
            {/* Add visual indicator for WAITING_FOR_CHILDREN */}
            {node.state === 'WAITING_FOR_CHILDREN' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 rounded-md bg-primary/10 px-3 py-2 text-xs text-primary"
              >
                ⏳ Waiting for {node.children.filter(c => c.state !== 'COMPLETED').length} child coroutine(s) to complete
              </motion.div>
            )}
            
            {/* Add visual indicator for FAILED state */}
            {node.state === 'FAILED' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 rounded-md bg-danger/10 px-3 py-2 text-xs text-danger"
              >
                ⚠️ Exception thrown - will cancel parent and siblings
              </motion.div>
            )}
            
            {/* Add visual indicator for CANCELLED state */}
            {node.state === 'CANCELLED' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 rounded-md bg-warning/10 px-3 py-2 text-xs text-warning"
              >
                🚫 Cancelled due to structured concurrency
              </motion.div>
            )}
          </CardBody>
        </Card>
      </motion.div>

      {node.children.map(child => (
        <TreeNode key={child.id} node={child} depth={depth + 1} />
      ))}
    </motion.div>
  )
}

function getStateConfig(state: string) {
  switch (state as CoroutineState) {
    case 'CREATED':
      return {
        icon: <FiCircle className="h-5 w-5" />,
        color: 'text-default-400',
        chipColor: 'default' as const,
      }
    case 'ACTIVE':
      return {
        icon: <FiPlay className="h-5 w-5" />,
        color: 'text-primary',
        chipColor: 'primary' as const,
      }
    case 'SUSPENDED':
      return {
        icon: <FiPause className="h-5 w-5" />,
        color: 'text-secondary',
        chipColor: 'secondary' as const,
      }
    case 'WAITING_FOR_CHILDREN':
      return {
        icon: <FiClock className="h-5 w-5" />,
        color: 'text-primary',
        chipColor: 'primary' as const,
      }
    case 'COMPLETED':
      return {
        icon: <FiCheckCircle className="h-5 w-5" />,
        color: 'text-success',
        chipColor: 'success' as const,
      }
    case 'CANCELLED':
      return {
        icon: <FiXCircle className="h-5 w-5" />,
        color: 'text-warning',
        chipColor: 'warning' as const,
      }
    case 'FAILED':
      return {
        icon: <FiAlertCircle className="h-5 w-5" />,
        color: 'text-danger',
        chipColor: 'danger' as const,
      }
    default:
      return {
        icon: <FiCircle className="h-5 w-5" />,
        color: 'text-default-400',
        chipColor: 'default' as const,
      }
  }
}

