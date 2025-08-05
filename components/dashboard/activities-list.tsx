"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, Search, Filter, Calendar, MapPin, User, Leaf, Beaker, Wrench, Clock } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { Activity } from "@/types"

interface ActivitiesListProps {
  activities: Activity[]
  loading?: boolean
  onActivityClick: (activity: Activity) => void
}

const activityIcons = {
  soil_analysis: Beaker,
  management: Wrench,
  task: Leaf,
}

const activityColors = {
  soil_analysis: "text-purple-600 bg-purple-50 dark:bg-purple-950",
  management: "text-blue-600 bg-blue-50 dark:bg-blue-950",
  task: "text-green-600 bg-green-50 dark:bg-green-950",
}

const statusColors = {
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  pending: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

const statusLabels = {
  completed: "Concluída",
  in_progress: "Em Andamento",
  pending: "Pendente",
  cancelled: "Cancelada",
}

const typeLabels = {
  soil_analysis: "Análise de Solo",
  management: "Manejo",
  task: "Tarefa",
}

export function ActivitiesList({ activities, loading, onActivityClick }: ActivitiesListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      const matchesSearch =
        activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.responsible.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "all" || activity.status === statusFilter
      const matchesType = typeFilter === "all" || activity.type === typeFilter

      return matchesSearch && matchesStatus && matchesType
    })
  }, [activities, searchTerm, statusFilter, typeFilter])

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 animate-pulse">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div>
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
                </div>
              </div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
              </div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar atividades..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="completed">Concluída</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="soil_analysis">Análise de Solo</SelectItem>
            <SelectItem value="management">Manejo</SelectItem>
            <SelectItem value="task">Tarefa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>
          {filteredActivities.length} de {activities.length} atividades
        </span>
        {(searchTerm || statusFilter !== "all" || typeFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm("")
              setStatusFilter("all")
              setTypeFilter("all")
            }}
            className="text-xs"
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Activities List */}
      {filteredActivities.length === 0 ? (
        <div className="text-center py-12">
          <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhuma atividade encontrada</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || statusFilter !== "all" || typeFilter !== "all"
              ? "Tente ajustar os filtros ou o termo de busca"
              : "Não há atividades registradas para este período"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredActivities.map((activity) => {
            const Icon = activityIcons[activity.type] || Leaf
            const isOverdue = activity.status === "pending" && activity.date < new Date()

            return (
              <div
                key={activity.id}
                className={cn(
                  "border rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800 group cursor-pointer",
                  isOverdue && "border-red-200 bg-red-50 dark:bg-red-950/20",
                )}
                onClick={() => onActivityClick(activity)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn("p-2 rounded-lg flex-shrink-0", activityColors[activity.type])}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">{activity.title}</h3>
                        {isOverdue && (
                          <Badge variant="destructive" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Atrasada
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{activity.description}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {typeLabels[activity.type]}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Badge className={cn("flex-shrink-0", statusColors[activity.status])}>
                    {statusLabels[activity.status]}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span className={cn(isOverdue && "text-red-600 font-medium")}>
                        {format(activity.date, "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate max-w-32">{activity.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span className="truncate max-w-32">{activity.responsible}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation()
                      onActivityClick(activity)
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
