"use client";

import { useState, useMemo, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import type { NFe, ManifestationType } from "@/lib/types";
import { formatCurrency, formatDate, sanitizeText } from "@/lib/utils";

interface NotesTableProps {
  notes: NFe[];
  selectedNotes: string[];
  onSelectNote: (noteId: string) => void;
  onSelectAll: () => void;
  onManifest: (noteId: string, type: ManifestationType) => void;
  onDownload: (noteId: string, format: "xml" | "pdf") => void;
  onViewDetails: (note: NFe) => void;
  isLoading?: boolean;
}

type SortField = "emissionDate" | "value" | "emitterName" | "status";
type SortDirection = "asc" | "desc";

const manifestationLabels: Record<ManifestationType, string> = {
  ciencia: "Ciencia da Operacao",
  confirmacao: "Confirmacao da Operacao",
  desconhecimento: "Desconhecimento da Operacao",
  nao_realizada: "Operacao Nao Realizada",
};

const manifestationColors: Record<ManifestationType, string> = {
  ciencia: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  confirmacao: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  desconhecimento: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  nao_realizada: "bg-red-500/20 text-red-400 border-red-500/30",
};

const StatusIcon = memo(function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "confirmada":
      return <CheckCircle2 className="size-4 text-emerald-400" />;
    case "desconhecida":
      return <XCircle className="size-4 text-red-400" />;
    case "ciencia":
      return <AlertCircle className="size-4 text-blue-400" />;
    case "nao_realizada":
      return <XCircle className="size-4 text-amber-400" />;
    default:
      return <HelpCircle className="size-4 text-muted-foreground" />;
  }
});

const NoteRow = memo(function NoteRow({
  note,
  isSelected,
  onSelect,
  onManifest,
  onDownload,
  onViewDetails,
}: {
  note: NFe;
  isSelected: boolean;
  onSelect: () => void;
  onManifest: (type: ManifestationType) => void;
  onDownload: (format: "xml" | "pdf") => void;
  onViewDetails: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <motion.tr
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`border-b border-border/50 transition-colors hover:bg-muted/30 ${
          isSelected ? "bg-primary/5" : ""
        }`}
      >
        <td className="p-4">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            aria-label={`Selecionar nota ${note.number}`}
          />
        </td>
        <td className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="size-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {sanitizeText(note.number)}
              </p>
              <p className="text-xs text-muted-foreground">
                Serie {sanitizeText(note.series)}
              </p>
            </div>
          </div>
        </td>
        <td className="p-4">
          <div>
            <p className="font-medium text-foreground">
              {sanitizeText(note.emitterName)}
            </p>
            <p className="text-xs text-muted-foreground">
              {sanitizeText(note.emitterCnpj)}
            </p>
          </div>
        </td>
        <td className="hidden p-4 lg:table-cell">
          <p className="text-foreground">{formatDate(note.emissionDate)}</p>
        </td>
        <td className="p-4">
          <p className="font-semibold text-foreground">
            {formatCurrency(note.value)}
          </p>
        </td>
        <td className="hidden p-4 md:table-cell">
          <div className="flex items-center gap-2">
            <StatusIcon status={note.manifestationStatus || "pendente"} />
            {note.manifestationStatus ? (
              <Badge
                variant="outline"
                className={
                  manifestationColors[
                    note.manifestationStatus as ManifestationType
                  ] || ""
                }
              >
                {manifestationLabels[
                  note.manifestationStatus as ManifestationType
                ] || "Pendente"}
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-muted-foreground/30 text-muted-foreground"
              >
                Pendente
              </Badge>
            )}
          </div>
        </td>
        <td className="p-4">
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={onViewDetails}
                  >
                    <Eye className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Ver detalhes</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <Download className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onDownload("xml")}>
                  Baixar XML
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDownload("pdf")}>
                  Baixar DANFE (PDF)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onManifest("ciencia")}>
                  Ciencia da Operacao
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onManifest("confirmacao")}>
                  Confirmar Operacao
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onManifest("desconhecimento")}>
                  Desconhecer Operacao
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onManifest("nao_realizada")}
                  className="text-destructive"
                >
                  Operacao Nao Realizada
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              className="size-8 md:hidden"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </Button>
          </div>
        </td>
      </motion.tr>

      {/* Mobile expanded row */}
      <AnimatePresence>
        {isExpanded && (
          <motion.tr
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-border/50 bg-muted/20 md:hidden"
          >
            <td colSpan={7} className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Data de Emissao</p>
                  <p className="font-medium">{formatDate(note.emissionDate)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <div className="mt-1 flex items-center gap-2">
                    <StatusIcon status={note.manifestationStatus || "pendente"} />
                    <span className="font-medium">
                      {manifestationLabels[
                        note.manifestationStatus as ManifestationType
                      ] || "Pendente"}
                    </span>
                  </div>
                </div>
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
});

export function NotesTable({
  notes,
  selectedNotes,
  onSelectNote,
  onSelectAll,
  onManifest,
  onDownload,
  onViewDetails,
  isLoading,
}: NotesTableProps) {
  const [sortField, setSortField] = useState<SortField>("emissionDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = useCallback((field: SortField) => {
    setSortField((currentField) => {
      if (currentField === field) {
        setSortDirection((dir) => (dir === "asc" ? "desc" : "asc"));
        return currentField;
      }
      setSortDirection("desc");
      return field;
    });
  }, []);

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "emissionDate":
          comparison =
            new Date(a.emissionDate).getTime() -
            new Date(b.emissionDate).getTime();
          break;
        case "value":
          comparison = a.value - b.value;
          break;
        case "emitterName":
          comparison = a.emitterName.localeCompare(b.emitterName);
          break;
        case "status":
          comparison = (a.manifestationStatus || "").localeCompare(
            b.manifestationStatus || ""
          );
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [notes, sortField, sortDirection]);

  const allSelected =
    notes.length > 0 && selectedNotes.length === notes.length;
  const someSelected = selectedNotes.length > 0 && !allSelected;

  const SortHeader = ({
    field,
    children,
    className = "",
  }: {
    field: SortField;
    children: React.ReactNode;
    className?: string;
  }) => (
    <th className={`p-4 text-left ${className}`}>
      <button
        onClick={() => handleSort(field)}
        className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {children}
        {sortField === field &&
          (sortDirection === "asc" ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          ))}
      </button>
    </th>
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <FileText className="size-8 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium text-foreground">
            Nenhuma nota encontrada
          </p>
          <p className="text-sm text-muted-foreground">
            Sincronize com a SEFAZ para buscar novas notas
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/50 bg-muted/30">
            <th className="p-4 text-left">
              <Checkbox
                checked={allSelected}
                ref={(el) => {
                  if (el) {
                    (el as HTMLButtonElement & { indeterminate?: boolean }).indeterminate = someSelected;
                  }
                }}
                onCheckedChange={onSelectAll}
                aria-label="Selecionar todas as notas"
              />
            </th>
            <SortHeader field="emitterName">Nota</SortHeader>
            <SortHeader field="emitterName">Emitente</SortHeader>
            <SortHeader field="emissionDate" className="hidden lg:table-cell">
              Data
            </SortHeader>
            <SortHeader field="value">Valor</SortHeader>
            <SortHeader field="status" className="hidden md:table-cell">
              Status
            </SortHeader>
            <th className="p-4 text-left">
              <span className="text-sm font-medium text-muted-foreground">
                Acoes
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence mode="popLayout">
            {sortedNotes.map((note) => (
              <NoteRow
                key={note.id}
                note={note}
                isSelected={selectedNotes.includes(note.id)}
                onSelect={() => onSelectNote(note.id)}
                onManifest={(type) => onManifest(note.id, type)}
                onDownload={(format) => onDownload(note.id, format)}
                onViewDetails={() => onViewDetails(note)}
              />
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}
