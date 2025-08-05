"use client"

import { useState, useEffect, Suspense } from "react"
import dynamic from "next/dynamic"
import { useAuth } from "@/contexts/auth-context"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { PropertySelector } from "@/components/dashboard/property-selector"
import { DateRangeFilter } from "@/components/dashboard/date-range-filter"
import { ActivitiesList } from "@/components/dashboard/activities-list"
import { useFirestore } from "@/hooks/use-firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Property, Activity, KPIData } from "@/types"

// Lazy load heavy components
const ActivityModal = dynamic(() => import("@/components/dashboard/activity-modal"), {
  loading: () => <div className="spinner" />,
})

const PDFGenerator = dynamic(() => import("@/components/dashboard/pdf-generator"), {
  loading: () => <div className="spinner" />,
})

export default function ClientDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { getClientProperties, getActivities, getKPIData } = useFirestore()

  const [properties, setProperties] = useState<Property[]>([])
  const [selectedProperty, setSelectedProperty] = useState<string>("")
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  })
  const [activities, setActivities] = useState<Activity[]>([])
  const [kpiData, setKPIData] = useState<KPIData | null>(null)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (user) {
      loadProperties()
    }
  }, [user])

  useEffect(() => {
    if (selectedProperty) {
      loadData()
    }
  }, [selectedProperty, dateRange])

  const loadProperties = async () => {
    try {
      setLoading(true)
      const props = await getClientProperties(user!.uid)
      setProperties(props)
      if (props.length > 0) {
        setSelectedProperty(props[0].id)
      }
    } catch (error) {
      console.error("Error loading properties:", error)
      toast({
        title: "Erro ao carregar propriedades",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadData = async () => {
    if (!selectedProperty) return

    setLoading(true)
    try {
      const [activitiesData, kpiInfo] = await Promise.all([
        getActivities(selectedProperty, dateRange.from, dateRange.to),
        getKPIData(selectedProperty, dateRange.from, dateRange.to),
      ])

      setActivities(activitiesData)
      setKPIData(kpiInfo)
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Erro ao carregar dados",
        description: "Verifique sua conexão e tente novamente",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
    toast({
      title: "Dados atualizados",
      description: "As informações foram atualizadas com sucesso",
    })
  }

  const selectedPropertyData = properties.find((p) => p.id === selectedProperty)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Acompanhe o desempenho da sua propriedade</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-2 bg-transparent"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <Suspense fallback={<div className="spinner" />}>
              <PDFGenerator
                property={selectedPropertyData}
                activities={activities}
                kpiData={kpiData}
                dateRange={dateRange}
              />
            </Suspense>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <PropertySelector
            properties={properties}
            selectedProperty={selectedProperty}
            onPropertyChange={setSelectedProperty}
            loading={loading}
          />
          <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
        </div>

        {/* KPI Cards */}
        <Suspense
          fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          }
        >
          {kpiData && <KPICards data={kpiData} loading={loading} />}
        </Suspense>

        {/* Activities */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Atividades Recentes
            </CardTitle>
            <CardDescription>Histórico de atividades realizadas na propriedade selecionada</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivitiesList activities={activities} loading={loading} onActivityClick={setSelectedActivity} />
          </CardContent>
        </Card>

        {/* Activity Modal */}
        <Suspense fallback={null}>
          <ActivityModal
            activity={selectedActivity}
            open={!!selectedActivity}
            onOpenChange={(open) => !open && setSelectedActivity(null)}
          />
        </Suspense>
      </div>
    </DashboardLayout>
  )
}
