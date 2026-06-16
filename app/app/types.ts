export type Status = 'ready' | 'ongoing' | 'review' | 'sent' | 'done' | 'hold'
export type Importance = 'low' | 'medium' | 'high'
export type Category = 'pro' | 'perso'

export interface Note {
  id: string
  project_id?: string | null
  subproject_id?: string | null
  text: string
  date?: string | null
  created_at: string
}

export interface Subproject {
  id: string
  parent_id: string
  number: string
  name: string
  status: Status
  progress: number | null
  deadline?: string | null
  ended?: string | null
  trashed: boolean
  archived: boolean
  updated_at: string
  notes?: Note[]
}

export interface Project {
  id: string
  number: string
  name: string
  cat: Category
  year: number
  status: Status
  progress: number | null
  importance: Importance
  editor?: string | null
  client?: string | null
  date?: string | null
  deadline?: string | null
  ended?: string | null
  trashed: boolean
  archived: boolean
  sort_order: number
  updated_at: string
  subprojects?: Subproject[]
  notes?: Note[]
}
