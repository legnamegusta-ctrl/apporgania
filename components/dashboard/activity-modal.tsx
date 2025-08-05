"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Calendar,
  MapPin,
  User,
  Clock,
  FileText,
  ImageIcon,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { Activity } from "@/types"
import Image from "next/image"

interface ActivityModalProps {
  activity: Activity | null
  open: boolean
  onOpenChange: (open: boolean) => void
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

export default function ActivityModal({ activity, open, onOpenChange }: ActivityModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  if (!activity) return null

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index)
    setLightboxOpen(true)
  }

  const nextImage = () => {
    if (activity.photos) {
      setSelectedImageIndex((prev) => (prev + 1) % activity.photos!.length)
    }
  }

  const prevImage = () => {
    if (activity.photos) {
      setSelectedImageIndex((prev) => (prev - 1 + activity.photos!.length) % activity.photos!.length)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl font-bold mb-2">{activity.title}</DialogTitle>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{typeLabels[activity.type]}</Badge>
                  <Badge className={statusColors[activity.status]}>{statusLabels[activity.status]}</Badge>
                </div>
                <DialogDescription className="text-base">{activity.description}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">Data:</span>
                  <span className="font-medium">{format(activity.date, "dd/MM/yyyy", { locale: ptBR })}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">Local:</span>
                  <span className="font-medium">{activity.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">Responsável:</span>
                  <span className="font-medium">{activity.responsible}</span>
                </div>
              </div>

              <Separator />

              {/* Detailed Information based on type */}
              {activity.type === "soil_analysis" && activity.soilData && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Análise de Solo
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">pH</div>
                      <div className="text-lg font-semibold">{activity.soilData.ph}</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Fósforo</div>
                      <div className="text-lg font-semibold">{activity.soilData.phosphorus} mg/dm³</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Potássio</div>
                      <div className="text-lg font-semibold">{activity.soilData.potassium} mg/dm³</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Matéria Orgânica</div>
                      <div className="text-lg font-semibold">{activity.soilData.organicMatter}%</div>
                    </div>
                  </div>
                  {activity.soilData.recommendations && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Recomendações:</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                        {activity.soilData.recommendations}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activity.type === "management" && activity.managementData && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Atividade de Manejo
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Área Tratada</div>
                      <div className="text-lg font-semibold">{activity.managementData.area} ha</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Produto Utilizado</div>
                      <div className="text-lg font-semibold">{activity.managementData.product}</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Dosagem</div>
                      <div className="text-lg font-semibold">{activity.managementData.dosage}</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Método</div>
                      <div className="text-lg font-semibold">{activity.managementData.method}</div>
                    </div>
                  </div>
                  {activity.managementData.observations && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Observações:</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-950 p-3 rounded-lg">
                        {activity.managementData.observations}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activity.type === "task" && activity.taskData && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Detalhes da Tarefa
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Duração</div>
                      <div className="text-lg font-semibold">{activity.taskData.duration} horas</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Prioridade</div>
                      <div className="text-lg font-semibold capitalize">{activity.taskData.priority}</div>
                    </div>
                  </div>
                  {activity.taskData.equipment && activity.taskData.equipment.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Equipamentos Utilizados:</h4>
                      <div className="flex flex-wrap gap-2">
                        {activity.taskData.equipment.map((item, index) => (
                          <Badge key={index} variant="secondary">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {activity.taskData.notes && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Notas:</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                        {activity.taskData.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Photos Gallery */}
              {activity.photos && activity.photos.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Fotos ({activity.photos.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {activity.photos.map((photo, index) => (
                      <div
                        key={index}
                        className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                        onClick={() => handleImageClick(index)}
                      >
                        <Image
                          src={photo.url || "/placeholder.svg"}
                          alt={photo.caption || `Foto ${index + 1}`}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Maximize2 className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              {activity.files && activity.files.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Arquivos ({activity.files.length})
                  </h3>
                  <div className="space-y-2">
                    {activity.files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="font-medium">{file.name}</div>
                            <div className="text-sm text-gray-500">
                              {file.size} • {file.type}
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Lightbox for images */}
      {lightboxOpen && activity.photos && (
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 z-10 bg-black/50 text-white hover:bg-black/70"
                onClick={() => setLightboxOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>

              {activity.photos.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}

              <div className="relative aspect-video">
                <Image
                  src={activity.photos[selectedImageIndex].url || "/placeholder.svg"}
                  alt={activity.photos[selectedImageIndex].caption || `Foto ${selectedImageIndex + 1}`}
                  fill
                  className="object-contain"
                />
              </div>

              {activity.photos[selectedImageIndex].caption && (
                <div className="p-4 bg-black/80 text-white text-center">
                  {activity.photos[selectedImageIndex].caption}
                </div>
              )}

              {activity.photos.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {selectedImageIndex + 1} / {activity.photos.length}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
