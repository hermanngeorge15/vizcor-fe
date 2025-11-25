import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { CoroutineNode } from '@/types/api'
import { buildCoroutineTree } from '@/lib/utils'
import { FiCircle, FiCheckCircle, FiXCircle, FiLoader, FiArrowDown, FiClock, FiPause, FiAlertCircle } from 'react-icons/fi'

interface CoroutineTreeGraphProps {
  coroutines: CoroutineNode[]
}

interface TreeNode extends CoroutineNode {
  children: TreeNode[]
}

// Helper function to check if a coroutine is running
const isRunning = (state: string) => state === 'ACTIVE' || state === 'WAITING_FOR_CHILDREN'

export function CoroutineTreeGraph({ coroutines }: CoroutineTreeGraphProps) {
  const tree = useMemo(() => buildCoroutineTree(coroutines), [coroutines])
  const activeCount = useMemo(
    () => coroutines.filter(c => isRunning(c.state)).length,
    [coroutines]
  )

  if (coroutines.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-default-400">
        No coroutines in this session yet.
      </div>
    )
  }

  return (
    <div className="min-h-[600px] overflow-auto p-8">
      {/* Real-time activity indicator */}
      {activeCount > 0 && (
        <motion.div
          className="mb-6 flex items-center justify-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <motion.div
            className="h-2 w-2 rounded-full bg-primary"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <span>{activeCount} coroutine{activeCount > 1 ? 's' : ''} actively running</span>
        </motion.div>
      )}
      
      <div className="flex flex-col items-center gap-16">
        <AnimatePresence mode="popLayout">
          {tree.map((node, index) => (
            <TreeNodeComponent 
              key={`${node.id}-${node.state}`} 
              node={node} 
              isRoot 
              level={0} 
              siblingIndex={index} 
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

interface TreeNodeComponentProps {
  node: TreeNode
  isRoot?: boolean
  level: number
  siblingIndex: number
}

function TreeNodeComponent({ node, isRoot = false, level, siblingIndex }: TreeNodeComponentProps) {
  const stateConfig = getStateConfig(node.state)
  const hasChildren = node.children.length > 0
  const parentConfig = getStateConfig(node.state)

  return (
    <div className="flex flex-col items-center">
      {/* Connection line from parent with arrow */}
      {!isRoot && (
        <div className="relative flex flex-col items-center">
          <motion.div
            className={`h-12 w-0.5 ${parentConfig.lineColor}`}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: level * 0.1, duration: 0.3 }}
          />
          {/* Arrow indicator */}
          <motion.div
            className={`absolute top-10 flex h-6 w-6 items-center justify-center rounded-full ${parentConfig.arrowBg} ${parentConfig.iconColor}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: level * 0.1 + 0.2, duration: 0.2 }}
          >
            <FiArrowDown className="h-3 w-3" />
          </motion.div>
          {/* Animated flow particles for running states */}
          {isRunning(node.state) && (
            <motion.div
              className="absolute left-1/2 h-2 w-2 rounded-full bg-primary"
              style={{ marginLeft: '-4px' }}
              animate={{
                y: [0, 48],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: node.state === 'WAITING_FOR_CHILDREN' ? 2.5 : 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
        </div>
      )}

      {/* Node Card */}
      <motion.div
        key={`card-${node.id}-${node.state}`}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{
          delay: level * 0.1 + siblingIndex * 0.05,
          type: 'spring',
          stiffness: 200,
          damping: 20,
        }}
        className="relative z-10"
      >
        <motion.div
          className={`
            relative rounded-2xl border-2 bg-content1 p-6 shadow-lg
            transition-all hover:shadow-2xl
            ${stateConfig.borderColor}
          `}
          whileHover={{ scale: 1.05 }}
          animate={
            isRunning(node.state)
              ? {
                  boxShadow: [
                    '0 10px 40px -12px rgba(99, 102, 241, 0.3)',
                    '0 10px 40px -12px rgba(99, 102, 241, 0.6)',
                    '0 10px 40px -12px rgba(99, 102, 241, 0.3)',
                  ],
                }
              : {}
          }
          transition={
            isRunning(node.state)
              ? {
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
              : {}
          }
          style={{ minWidth: '280px' }}
        >
          {/* Animated Background for Running States */}
          {isRunning(node.state) && (
            <motion.div
              className="absolute inset-0 rounded-2xl bg-primary/5"
              animate={{
                opacity: node.state === 'WAITING_FOR_CHILDREN' ? [0.2, 0.4, 0.2] : [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: node.state === 'WAITING_FOR_CHILDREN' ? 3 : 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}

          <div className="relative z-10">
            {/* Header with Icon and Label */}
            <div className="mb-3 flex items-center gap-3">
              <motion.div
                className={`${stateConfig.iconColor} flex h-10 w-10 items-center justify-center rounded-full ${stateConfig.iconBg}`}
                animate={
                  node.state === 'ACTIVE'
                    ? {
                        rotate: 360,
                        scale: [1, 1.1, 1],
                      }
                    : node.state === 'WAITING_FOR_CHILDREN'
                    ? {
                        scale: [1, 1.15, 1],
                      }
                    : {}
                }
                transition={
                  node.state === 'ACTIVE'
                    ? {
                        rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
                        scale: { duration: 1, repeat: Infinity, ease: 'easeInOut' },
                      }
                    : {}
                }
              >
                {stateConfig.icon}
              </motion.div>
              <div className="flex-1">
                <div className="text-lg font-bold">{node.label || node.id}</div>
                <div className="text-xs text-default-500">
                  {node.state}
                  {node.state === 'ACTIVE' && (
                    <motion.span
                      className="ml-2 inline-block"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      ●
                    </motion.span>
                  )}
                </div>
              </div>
            </div>

            {/* Details */}
            <motion.div 
              className="space-y-1 text-sm"
              key={`details-${node.id}-${node.state}`}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-2 text-default-600">
                <span className="font-semibold">ID:</span>
                <span className="font-mono text-xs">{node.id}</span>
              </div>
              <div className="flex items-center gap-2 text-default-600">
                <span className="font-semibold">Job:</span>
                <span className="font-mono text-xs">{node.jobId}</span>
              </div>
              <div className="flex items-center gap-2 text-default-600">
                <span className="font-semibold">Scope:</span>
                <span className="font-mono text-xs">{node.scopeId}</span>
              </div>
              {node.parentId && (
                <div className="flex items-center gap-2 text-default-600">
                  <span className="font-semibold">Parent:</span>
                  <span className="font-mono text-xs">{node.parentId}</span>
                </div>
              )}
            </motion.div>

            {/* Progress Bar for Active State */}
            {node.state === 'ACTIVE' && (
              <motion.div className="mt-3 h-1 overflow-hidden rounded-full bg-default-200">
                <motion.div
                  className="h-full bg-primary"
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  style={{ width: '50%' }}
                />
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Children */}
      {hasChildren && (
        <>
          {/* Connector line down with label */}
          <div className="relative flex flex-col items-center">
            <motion.div
              className={`h-12 w-0.5 ${stateConfig.lineColor}`}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: (level + 1) * 0.1, duration: 0.3 }}
            />
            {/* Relationship label */}
            <motion.div
              className="absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-default-100 px-2 py-1 text-xs font-semibold text-default-600"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (level + 1) * 0.1 + 0.3 }}
            >
              spawns {node.children.length} child{node.children.length > 1 ? 'ren' : ''}
            </motion.div>
            {/* Animated flow particles for ACTIVE parent waiting for children */}
            {node.state === 'ACTIVE' && hasChildren && (
              <motion.div
                className="absolute left-1/2 h-2 w-2 rounded-full bg-primary"
                style={{ marginLeft: '-4px' }}
                animate={{
                  y: [0, 48],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.5,
                }}
              />
            )}
          </div>

          {/* Branching point */}
          {node.children.length > 1 && (
            <motion.div
              className="relative h-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: (level + 1) * 0.1 }}
            >
              {/* Horizontal branching line with gradient */}
              <motion.div
                className={`absolute top-0 h-1 rounded-full ${stateConfig.branchBg}`}
                style={{
                  left: '50%',
                  right: '50%',
                  width: `${(node.children.length - 1) * 320}px`,
                  transform: 'translateX(-50%)',
                }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: (level + 1) * 0.1 + 0.2, duration: 0.4 }}
              />
              
              {/* Junction point */}
              <motion.div
                className={`absolute left-1/2 top-0 -translate-x-1/2 h-3 w-3 rounded-full ${stateConfig.iconBg} ${stateConfig.iconColor} border-2`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: (level + 1) * 0.1 + 0.3, type: 'spring' }}
              />
              
              {/* Vertical lines down to children with arrows */}
              <div className="flex" style={{ width: `${node.children.length * 320}px` }}>
                {node.children.map((child, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-center">
                    <motion.div
                      className={`h-12 w-0.5 ${getStateConfig(child.state).lineColor}`}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ delay: (level + 1) * 0.1 + 0.4 + i * 0.05 }}
                    />
                    {/* Arrow for each child */}
                    <motion.div
                      className={`absolute bottom-0 flex h-6 w-6 items-center justify-center rounded-full ${getStateConfig(child.state).arrowBg} ${getStateConfig(child.state).iconColor}`}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: (level + 1) * 0.1 + 0.5 + i * 0.05 }}
                    >
                      <FiArrowDown className="h-3 w-3" />
                    </motion.div>
                    {/* Flow animation for active children */}
                    {child.state === 'ACTIVE' && (
                      <motion.div
                        className="absolute h-2 w-2 rounded-full bg-primary"
                        style={{ top: 0 }}
                        animate={{
                          y: [0, 48],
                          opacity: [0, 1, 0],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: i * 0.3,
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Child nodes */}
          <div className="flex gap-8">
            <AnimatePresence mode="popLayout">
              {node.children.map((child, index) => (
                <div key={`${child.id}-${child.state}`} className="relative">
                  {/* Parent-child relationship indicator */}
                  <motion.div
                    className="absolute -top-16 left-1/2 -translate-x-1/2 flex items-center gap-2 whitespace-nowrap rounded-lg bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (level + 1) * 0.1 + 0.6 + index * 0.05 }}
                  >
                    <span>Child of</span>
                    <span className="font-mono text-[10px]">{node.label || node.id}</span>
                  </motion.div>
                  <TreeNodeComponent
                    key={`${child.id}-${child.state}`}
                    node={child}
                    level={level + 1}
                    siblingIndex={index}
                  />
                </div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  )
}

function getStateConfig(state: string) {
  switch (state) {
    case 'CREATED':
      return {
        icon: <FiCircle className="h-5 w-5" />,
        iconColor: 'text-default-600',
        iconBg: 'bg-default-100',
        borderColor: 'border-default-300',
        lineColor: 'bg-gradient-to-b from-default-300 to-default-200',
        arrowBg: 'bg-default-200',
        branchBg: 'bg-gradient-to-r from-transparent via-default-300 to-transparent',
      }
    case 'ACTIVE':
      return {
        icon: <FiLoader className="h-5 w-5" />,
        iconColor: 'text-primary',
        iconBg: 'bg-primary/10',
        borderColor: 'border-primary',
        lineColor: 'bg-gradient-to-b from-primary via-primary/60 to-primary/30',
        arrowBg: 'bg-primary/20',
        branchBg: 'bg-gradient-to-r from-transparent via-primary/40 to-transparent',
      }
    case 'SUSPENDED':
      return {
        icon: <FiPause className="h-5 w-5" />,
        iconColor: 'text-secondary',
        iconBg: 'bg-secondary/10',
        borderColor: 'border-secondary',
        lineColor: 'bg-gradient-to-b from-secondary via-secondary/60 to-secondary/30',
        arrowBg: 'bg-secondary/20',
        branchBg: 'bg-gradient-to-r from-transparent via-secondary/40 to-transparent',
      }
    case 'WAITING_FOR_CHILDREN':
      return {
        icon: <FiClock className="h-5 w-5" />,
        iconColor: 'text-primary',
        iconBg: 'bg-primary/10',
        borderColor: 'border-primary/60',
        lineColor: 'bg-gradient-to-b from-primary/60 via-primary/40 to-primary/20',
        arrowBg: 'bg-primary/15',
        branchBg: 'bg-gradient-to-r from-transparent via-primary/30 to-transparent',
      }
    case 'COMPLETED':
      return {
        icon: <FiCheckCircle className="h-5 w-5" />,
        iconColor: 'text-success',
        iconBg: 'bg-success/10',
        borderColor: 'border-success',
        lineColor: 'bg-gradient-to-b from-success via-success/60 to-success/30',
        arrowBg: 'bg-success/20',
        branchBg: 'bg-gradient-to-r from-transparent via-success/40 to-transparent',
      }
    case 'CANCELLED':
      return {
        icon: <FiXCircle className="h-5 w-5" />,
        iconColor: 'text-warning',
        iconBg: 'bg-warning/10',
        borderColor: 'border-warning',
        lineColor: 'bg-gradient-to-b from-warning via-warning/60 to-warning/30',
        arrowBg: 'bg-warning/20',
        branchBg: 'bg-gradient-to-r from-transparent via-warning/40 to-transparent',
      }
    case 'FAILED':
      return {
        icon: <FiAlertCircle className="h-5 w-5" />,
        iconColor: 'text-danger',
        iconBg: 'bg-danger/10',
        borderColor: 'border-danger',
        lineColor: 'bg-gradient-to-b from-danger via-danger/60 to-danger/30',
        arrowBg: 'bg-danger/20',
        branchBg: 'bg-gradient-to-r from-transparent via-danger/40 to-transparent',
      }
    default:
      return {
        icon: <FiCircle className="h-5 w-5" />,
        iconColor: 'text-default-600',
        iconBg: 'bg-default-100',
        borderColor: 'border-default-300',
        lineColor: 'bg-gradient-to-b from-default-300 to-default-200',
        arrowBg: 'bg-default-200',
        branchBg: 'bg-gradient-to-r from-transparent via-default-300 to-transparent',
      }
  }
}

