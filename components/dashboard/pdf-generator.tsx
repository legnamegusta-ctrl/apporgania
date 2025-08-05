"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { FileText, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { Property, Activity, KPIData } from "@/types"

interface PDFGeneratorProps {
  property?: Property
  activities: Activity[]
  kpiData: KPIData | null
  dateRange: {
    from: Date
    to: Date
  }
}

export default function PDFGenerator({ property, activities, kpiData, dateRange }: PDFGeneratorProps) {
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()

  const generatePDF = async () => {
    if (!property || !kpiData) {
      toast({
        title: "Dados insuficientes",
        description: "Selecione uma propriedade para gerar o relatório",
        variant: "destructive",
      })
      return
    }

    setGenerating(true)
    setProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Dynamic import for jsPDF to reduce bundle size
      const { default: jsPDF } = await import("jspdf")

      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.width
      const pageHeight = doc.internal.pageSize.height
      let yPosition = 20

      // Header
      doc.setFontSize(20)
      doc.setFont("helvetica", "bold")
      doc.text("AppOrgania - Relatório da Propriedade", pageWidth / 2, yPosition, { align: "center" })
      yPosition += 15

      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      doc.text(
        `Período: ${format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}`,
        pageWidth / 2,
        yPosition,
        { align: "center" },
      )
      yPosition += 20

      // Property Information
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text("Informações da Propriedade", 20, yPosition)
      yPosition += 10

      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      doc.text(`Nome: ${property.name}`, 20, yPosition)
      yPosition += 7
      doc.text(`Localização: ${property.location}`, 20, yPosition)
      yPosition += 7
      doc.text(`Área Total: ${property.area} hectares`, 20, yPosition)
      yPosition += 15

      // KPIs
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text("Indicadores de Performance", 20, yPosition)
      yPosition += 10

      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      doc.text(`• Área Total: ${kpiData.totalArea} ha`, 25, yPosition)
      yPosition += 7
      doc.text(`• Total de Atividades: ${kpiData.totalActivities}`, 25, yPosition)
      yPosition += 7
      doc.text(`• Próximas Tarefas: ${kpiData.upcomingTasks}`, 25, yPosition)
      yPosition += 7
      doc.text(`• Irrigação Ativa: ${kpiData.activeIrrigation}%`, 25, yPosition)
      yPosition += 15

      // Activities Summary
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text("Resumo de Atividades", 20, yPosition)
      yPosition += 10

      const activityTypes = activities.reduce(
        (acc, activity) => {
          acc[activity.type] = (acc[activity.type] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      const typeLabels = {
        soil_analysis: "Análises de Solo",
        management: "Atividades de Manejo",
        task: "Tarefas",
      }

      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      Object.entries(activityTypes).forEach(([type, count]) => {
        doc.text(`• ${typeLabels[type as keyof typeof typeLabels] || type}: ${count}`, 25, yPosition)
        yPosition += 7
      })

      yPosition += 10

      // Activities List
      if (activities.length > 0) {
        doc.setFontSize(16)
        doc.setFont("helvetica", "bold")
        doc.text("Atividades Detalhadas", 20, yPosition)
        yPosition += 10

        activities.slice(0, 10).forEach((activity, index) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage()
            yPosition = 20
          }

          doc.setFontSize(12)
          doc.setFont("helvetica", "bold")
          doc.text(`${index + 1}. ${activity.title}`, 20, yPosition)
          yPosition += 7

          doc.setFont("helvetica", "normal")
          doc.text(`   Data: ${format(activity.date, "dd/MM/yyyy", { locale: ptBR })}`, 20, yPosition)
          yPosition += 5
          doc.text(`   Local: ${activity.location}`, 20, yPosition)
          yPosition += 5
          doc.text(`   Responsável: ${activity.responsible}`, 20, yPosition)
          yPosition += 5

          // Wrap description text
          const description = activity.description
          const maxWidth = pageWidth - 40
          const lines = doc.splitTextToSize(`   Descrição: ${description}`, maxWidth)
          doc.text(lines, 20, yPosition)
          yPosition += lines.length * 5 + 5
        })

        if (activities.length > 10) {
          doc.text(`... e mais ${activities.length - 10} atividades`, 20, yPosition)
        }
      }

      // Footer
      const totalPages = doc.internal.pages.length - 1
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: "center" })
        doc.text(
          `Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`,
          pageWidth - 20,
          pageHeight - 10,
          { align: "right" },
        )
      }

      clearInterval(progressInterval)
      setProgress(100)

      // Save PDF
      const fileName = `relatorio-${property.name.toLowerCase().replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.pdf`
      doc.save(fileName)

      toast({
        title: "Relatório gerado com sucesso!",
        description: `O arquivo ${fileName} foi baixado`,
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Erro ao gerar relatório",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
      setProgress(0)
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={generatePDF} disabled={generating || !property || !kpiData} className="gap-2">
        {generating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Gerando...
          </>
        ) : (
          <>
            <FileText className="h-4 w-4" />
            Gerar Relatório PDF
          </>
        )}
      </Button>

      {generating && (
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <p className="text-xs text-gray-600 dark:text-gray-400">Gerando relatório... {progress}%</p>
        </div>
      )}
    </div>
  )
}
