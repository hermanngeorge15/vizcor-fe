import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNanoTime(nanos: number): string {
  const ms = nanos / 1_000_000
  if (ms < 1000) {
    return `${ms.toFixed(2)}ms`
  }
  return `${(ms / 1000).toFixed(2)}s`
}

export function formatRelativeTime(nanos: number, baseNanos: number): string {
  const deltaMs = (nanos - baseNanos) / 1_000_000
  return `+${deltaMs.toFixed(2)}ms`
}

export function buildCoroutineTree(nodes: Array<{ id: string; parentId: string | null }>) {
  const nodeMap = new Map(nodes.map(n => [n.id, { ...n, children: [] as typeof nodes }]))
  const roots: typeof nodes = []

  nodes.forEach(node => {
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId)?.children.push(nodeMap.get(node.id)!)
    } else {
      roots.push(nodeMap.get(node.id)!)
    }
  })

  return roots
}

