"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Loader2 } from "lucide-react"
import type { Property } from "@/types"

interface PropertySelectorProps {
  properties: Property[]
  selectedProperty: string
  onPropertyChange: (propertyId: string) => void
  loading?: boolean
}

export function PropertySelector({ properties, selectedProperty, onPropertyChange, loading }: PropertySelectorProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-600 dark:text-gray-400">Carregando propriedades...</span>
      </div>
    )
  }

  if (properties.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
        <MapPin className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-600 dark:text-gray-400">Nenhuma propriedade encontrada</span>
      </div>
    )
  }

  return (
    <Select value={selectedProperty} onValueChange={onPropertyChange}>
      <SelectTrigger className="w-full sm:w-64">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-400" />
          <SelectValue placeholder="Selecione uma propriedade" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {properties.map((property) => (
          <SelectItem key={property.id} value={property.id}>
            <div className="flex flex-col">
              <span className="font-medium">{property.name}</span>
              <span className="text-xs text-gray-500">
                {property.area} ha • {property.location}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
