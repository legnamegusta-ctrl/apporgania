"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Activity, MapPin, Calendar, Droplets, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { KPIData } from "@/types"

interface KPICardsProps {
  data: KPIData
  loading?: boolean
}

export function KPICards({ data, loading }: KPICardsProps) {
  const kpis = [
    {
      title: "Área Total",
      value: `${data.totalArea.toLocaleString("pt-BR")} ha`,
      icon: MapPin,
      trend: data.areaTrend,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      description: "Área total da propriedade",
    },
    {
      title: "Atividades",
      value: data.totalActivities.toString(),
      icon: Activity,
      trend: data.activitiesTrend,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
      description: "Atividades realizadas",
    },
    {
      title: "Próximas Tarefas",
      value: data.upcomingTasks.toString(),
      icon: Calendar,
      trend: data.tasksTrend,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950",
      description: "Tarefas programadas",
    },
    {
      title: "Irrigação Ativa",
      value: `${data.activeIrrigation}%`,
      icon: Droplets,
      trend: data.irrigationTrend,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50 dark:bg-cyan-950",
      description: "Sistemas de irrigação ativos",
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-1"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi, index) => {
        const TrendIcon = kpi.trend > 0 ? TrendingUp : kpi.trend < 0 ? TrendingDown : Minus
        const trendColor = kpi.trend > 0 ? "text-green-600" : kpi.trend < 0 ? "text-red-600" : "text-gray-500"

        return (
          <Card key={index} className="animate-fade-in hover:shadow-lg transition-all duration-200 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">{kpi.title}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
              </div>
              <div className={cn("p-2 rounded-lg transition-colors group-hover:scale-110 duration-200", kpi.bgColor)}>
                <kpi.icon className={cn("h-5 w-5", kpi.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{kpi.value}</div>
              <div className="flex items-center text-xs">
                <TrendIcon className={cn("h-3 w-3 mr-1", trendColor)} />
                <span className={cn("font-medium", trendColor)}>
                  {kpi.trend === 0 ? "0" : `${kpi.trend > 0 ? "+" : ""}${kpi.trend}`}%
                </span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">vs mês anterior</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
