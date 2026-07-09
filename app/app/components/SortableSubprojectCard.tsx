'use client'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Status, Subproject } from '../types'
import SubprojectCard from './SubprojectCard'

interface SortableSubprojectCardProps {
  sub: Subproject
  parentId: string
  dimmed?: boolean
  onOpenDetail: () => void
  onChangeStatus: (status: Status) => void
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
}

export default function SortableSubprojectCard({ dimmed, ...props }: SortableSubprojectCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.sub.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'opacity 0.2s',
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} data-card-id={props.sub.id}>
      <SubprojectCard dimmed={dimmed} {...props} dragHandleProps={{ ...listeners, ...attributes }} />
    </div>
  )
}
