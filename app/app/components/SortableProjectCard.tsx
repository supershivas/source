'use client'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Importance, Note, Project, Status, Subproject } from '../types'
import ProjectCard from './ProjectCard'

interface SortableProjectCardProps {
  project: Project
  onOpenDetail: () => void
  onChangeStatus: (status: Status) => void
  onChangeSubStatus: (sub: Subproject, status: Status) => void
  onReorderSubprojects: (reordered: Subproject[]) => void
  onChangeImportance: (importance: Importance) => void
  onCopyNumber: () => void
  onEdit: () => void
  onDelete: () => void
  onArchive: () => void
  onDuplicate: () => void
  onAddSubproject: () => void
  onEditSubproject: (sub: Subproject) => void
  onDeleteSubproject: (sub: Subproject) => void
  onArchiveSubproject: (sub: Subproject) => void
  onDuplicateSubproject: (sub: Subproject) => void
  onAddNote: (subprojectId?: string) => void
  onEditNote: (note: Note, subprojectId?: string) => void
  onDeleteNote: (note: Note, subprojectId?: string) => void
}

export default function SortableProjectCard(props: SortableProjectCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.project.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} data-card-id={props.project.id}>
      <ProjectCard {...props} />
    </div>
  )
}
