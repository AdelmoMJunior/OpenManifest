'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import type { NotasFilters, ManifestacaoStatus } from '@/lib/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Filter, X, CalendarIcon } from 'lucide-react'

interface NotesFiltersProps {
  filters: NotasFilters
  onFiltersChange: (filters: NotasFilters) => void
}

const manifestacaoOptions: { value: ManifestacaoStatus | ''; label: string }[] = [
  { value: '', label: 'Todas' },
  { value: 'sem_manifestacao', label: 'Sem Manifestação' },
  { value: 'ciencia_operacao', label: 'Ciência da Operação' },
  { value: 'confirmacao_operacao', label: 'Confirmação' },
  { value: 'desconhecimento_operacao', label: 'Desconhecimento' },
  { value: 'operacao_nao_realizada', label: 'Não Realizada' },
]

export function NotesFilters({ filters, onFiltersChange }: NotesFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState<NotasFilters>(filters)

  const hasActiveFilters =
    filters.manifestacao ||
    filters.data_inicio ||
    filters.data_fim ||
    filters.is_completa !== undefined

  const handleApply = () => {
    onFiltersChange(localFilters)
    setIsOpen(false)
  }

  const handleClear = () => {
    const clearedFilters: NotasFilters = {
      page: 1,
      limit: filters.limit,
    }
    setLocalFilters(clearedFilters)
    onFiltersChange(clearedFilters)
    setIsOpen(false)
  }

  const formatDateRange = () => {
    if (filters.data_inicio && filters.data_fim) {
      return `${format(new Date(filters.data_inicio), 'dd/MM/yy', { locale: ptBR })} - ${format(new Date(filters.data_fim), 'dd/MM/yy', { locale: ptBR })}`
    }
    if (filters.data_inicio) {
      return `A partir de ${format(new Date(filters.data_inicio), 'dd/MM/yy', { locale: ptBR })}`
    }
    if (filters.data_fim) {
      return `Até ${format(new Date(filters.data_fim), 'dd/MM/yy', { locale: ptBR })}`
    }
    return null
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtros
          {hasActiveFilters && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
              !
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Filtros</h4>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-auto p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>

          {/* Manifestação */}
          <div className="space-y-2">
            <Label>Status da Manifestação</Label>
            <Select
              value={localFilters.manifestacao || ''}
              onValueChange={(value) =>
                setLocalFilters((f) => ({
                  ...f,
                  manifestacao: value as ManifestacaoStatus | undefined,
                  page: 1,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                {manifestacaoOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value || 'all'}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data Início */}
          <div className="space-y-2">
            <Label>Data Inicial</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {localFilters.data_inicio
                    ? format(new Date(localFilters.data_inicio), 'dd/MM/yyyy', {
                        locale: ptBR,
                      })
                    : 'Selecionar data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={
                    localFilters.data_inicio
                      ? new Date(localFilters.data_inicio)
                      : undefined
                  }
                  onSelect={(date) =>
                    setLocalFilters((f) => ({
                      ...f,
                      data_inicio: date
                        ? format(date, 'yyyy-MM-dd')
                        : undefined,
                      page: 1,
                    }))
                  }
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Data Fim */}
          <div className="space-y-2">
            <Label>Data Final</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {localFilters.data_fim
                    ? format(new Date(localFilters.data_fim), 'dd/MM/yyyy', {
                        locale: ptBR,
                      })
                    : 'Selecionar data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={
                    localFilters.data_fim
                      ? new Date(localFilters.data_fim)
                      : undefined
                  }
                  onSelect={(date) =>
                    setLocalFilters((f) => ({
                      ...f,
                      data_fim: date ? format(date, 'yyyy-MM-dd') : undefined,
                      page: 1,
                    }))
                  }
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Somente Completas */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_completa"
              checked={localFilters.is_completa === true}
              onCheckedChange={(checked) =>
                setLocalFilters((f) => ({
                  ...f,
                  is_completa: checked ? true : undefined,
                  page: 1,
                }))
              }
            />
            <Label htmlFor="is_completa" className="cursor-pointer">
              Somente notas completas (com XML)
            </Label>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleApply}>
              Aplicar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
