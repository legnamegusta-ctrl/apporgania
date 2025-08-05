export interface Property {
  id: string
  name: string
  location: string
  area: number
  owner: string
  coordinates?: {
    lat: number
    lng: number
  }
  createdAt: Date
  updatedAt: Date
}

export interface Activity {
  id: string
  title: string
  description: string
  type: "soil_analysis" | "management" | "task"
  status: "completed" | "in_progress" | "pending" | "cancelled"
  date: Date
  location: string
  responsible: string
  propertyId: string
  photos?: {
    url: string
    caption?: string
  }[]
  files?: {
    name: string
    url: string
    size: string
    type: string
  }[]
  soilData?: {
    ph: number
    phosphorus: number
    potassium: number
    organicMatter: number
    recommendations?: string
  }
  managementData?: {
    area: number
    product: string
    dosage: string
    method: string
    observations?: string
  }
  taskData?: {
    duration: number
    priority: "low" | "medium" | "high"
    equipment?: string[]
    notes?: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface KPIData {
  totalArea: number
  areaTrend: number
  totalActivities: number
  activitiesTrend: number
  upcomingTasks: number
  tasksTrend: number
  activeIrrigation: number
  irrigationTrend: number
}

export interface User {
  uid: string
  email: string
  name: string
  role: "admin" | "agronomist" | "client" | "operator"
  properties?: string[]
  avatar?: string
  phone?: string
  lastLogin?: Date
}
