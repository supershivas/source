'use client'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Importance, Note, Project, Status, Subproject } from '../types'
import ProjectCard from './ProjectCard'

interface SortableProjectCardProps {
  project: Project
  dimmed?: boolean
  isSelected?: boolean
  isExpanded?: boolean
  onToggleExpand?: () => void
  onToggleSelect?: () => void
  onOpenDetail: () => void
  onChangeStatus: (status: Status) => void
  onChangeImportance: (importance: Importance) => void
  onCopyNumber: () => void
  onEdit: () => void
  onDelete: () => void
  onArchive: () => void
  onDuplicate: () => void
  onAddSubproject: () => void
}

export default function SortableProjectCard({ dimmed, ...props }: SortableProjectCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.project.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'opacity 0.2s',
    opacity: isDragging ? 0.5 : dimmed ? 0.35 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} data-card-id={props.project.id}>
      <ProjectCard {...props} dragHandleProps={{ ...listeners, ...attributes }} />
    </div>
  )
}
