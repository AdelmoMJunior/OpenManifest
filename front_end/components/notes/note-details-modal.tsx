"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  Building2,
  Calendar,
  DollarSign,
  Package,
  Truck,
  Download,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { NFe, ManifestationType } from "@/lib/types";
import { formatCurrency, formatDate, sanitizeText } from "@/lib/utils";

interface NoteDetailsModalProps {
  note: NFe | null;
  isOpen: boolean;
  onClose: () => void;
  onManifest: (noteId: string, type: ManifestationType) => void;
  onDownload: (noteId: string, format: "xml" | "pdf") => void;
}

const manifestationLabels: Record<ManifestationType, string> = {
  ciencia: "Ciencia da Operacao",
  confirmacao: "Confirmacao da Operacao",
  desconhecimento: "Desconhecimento da Operacao",
  nao_realizada: "Operacao Nao Realizada",
};

const InfoItem = memo(function InfoItem({
  icon: Icon,
  label,
  value,
  className = "",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="break-words font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
});

export function NoteDetailsModal({
  note,
  isOpen,
  onClose,
  onManifest,
  onDownload,
}: NoteDetailsModalProps) {
  if (!note) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 z-50 m-auto flex max-h-[90vh] max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border p-6">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
                  <FileText className="size-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    NF-e {sanitizeText(note.number)}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Serie {sanitizeText(note.series)} - Chave:{" "}
                    {sanitizeText(note.accessKey.slice(0, 20))}...
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="shrink-0"
              >
                <X className="size-5" />
              </Button>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                {/* Status */}
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-4">
                  {note.manifestationStatus ? (
                    <>
                      <CheckCircle2 className="size-5 text-emerald-400" />
                      <div>
                        <p className="font-medium text-foreground">
                          Manifestacao Registrada
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {
                            manifestationLabels[
                              note.manifestationStatus as ManifestationType
                            ]
                          }
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="size-5 text-amber-400" />
                      <div>
                        <p className="font-medium text-foreground">
                          Aguardando Manifestacao
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Selecione uma acao para manifestar esta nota
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Emitter Info */}
                <div>
                  <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                    Emitente
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InfoItem
                      icon={Building2}
                      label="Razao Social"
                      value={sanitizeText(note.emitterName)}
                    />
                    <InfoItem
                      icon={FileText}
                      label="CNPJ"
                      value={sanitizeText(note.emitterCnpj)}
                    />
                  </div>
                </div>

                {/* Note Info */}
                <div>
                  <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                    Informacoes da Nota
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InfoItem
                      icon={Calendar}
                      label="Data de Emissao"
                      value={formatDate(note.emissionDate)}
                    />
                    <InfoItem
                      icon={DollarSign}
                      label="Valor Total"
                      value={formatCurrency(note.value)}
                    />
                    <InfoItem
                      icon={Package}
                      label="Natureza da Operacao"
                      value={sanitizeText(note.operationType || "Nao informado")}
                    />
                    <InfoItem
                      icon={Truck}
                      label="Tipo de Operacao"
                      value={
                        note.operationType === "1" ? "Saida" : "Entrada"
                      }
                    />
                  </div>
                </div>

                {/* Access Key */}
                <div>
                  <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                    Chave de Acesso
                  </h3>
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <code className="break-all text-sm text-foreground">
                      {sanitizeText(note.accessKey)}
                    </code>
                  </div>
                </div>

                {/* Products */}
                {note.products && note.products.length > 0 && (
                  <div>
                    <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                      Produtos ({note.products.length})
                    </h3>
                    <div className="space-y-2">
                      {note.products.map((product, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-foreground">
                              {sanitizeText(product.name)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Qtd: {product.quantity} {product.unit}
                            </p>
                          </div>
                          <p className="shrink-0 font-semibold text-foreground">
                            {formatCurrency(product.totalValue)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="border-t border-border p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDownload(note.id, "xml")}
                  >
                    <Download className="mr-2 size-4" />
                    XML
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDownload(note.id, "pdf")}
                  >
                    <Download className="mr-2 size-4" />
                    DANFE
                  </Button>
                </div>

                {!note.manifestationStatus && (
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className="cursor-pointer transition-colors hover:bg-blue-500/20 hover:text-blue-400"
                      onClick={() => onManifest(note.id, "ciencia")}
                    >
                      Ciencia
                    </Badge>
                    <Badge
                      variant="outline"
                      className="cursor-pointer transition-colors hover:bg-emerald-500/20 hover:text-emerald-400"
                      onClick={() => onManifest(note.id, "confirmacao")}
                    >
                      Confirmar
                    </Badge>
                    <Badge
                      variant="outline"
                      className="cursor-pointer transition-colors hover:bg-amber-500/20 hover:text-amber-400"
                      onClick={() => onManifest(note.id, "desconhecimento")}
                    >
                      Desconhecer
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
