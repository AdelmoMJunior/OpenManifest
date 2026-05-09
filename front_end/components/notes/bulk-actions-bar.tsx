"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Download,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ManifestationType } from "@/lib/types";

interface BulkActionsBarProps {
  selectedCount: number;
  onClear: () => void;
  onBulkManifest: (type: ManifestationType) => void;
  onBulkDownload: (format: "xml" | "pdf") => void;
  isLoading?: boolean;
}

export const BulkActionsBar = memo(function BulkActionsBar({
  selectedCount,
  onClear,
  onBulkManifest,
  onBulkDownload,
  isLoading,
}: BulkActionsBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-4xl rounded-2xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur-xl md:inset-x-auto md:bottom-8"
        >
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClear}
                className="size-8"
              >
                <X className="size-4" />
              </Button>
              <span className="font-medium text-foreground">
                {selectedCount} {selectedCount === 1 ? "nota selecionada" : "notas selecionadas"}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  <span>Processando...</span>
                </div>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onBulkManifest("ciencia")}
                    className="gap-2"
                  >
                    <AlertCircle className="size-4 text-blue-400" />
                    <span className="hidden sm:inline">Ciencia</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onBulkManifest("confirmacao")}
                    className="gap-2"
                  >
                    <CheckCircle2 className="size-4 text-emerald-400" />
                    <span className="hidden sm:inline">Confirmar</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onBulkManifest("desconhecimento")}
                    className="gap-2"
                  >
                    <XCircle className="size-4 text-amber-400" />
                    <span className="hidden sm:inline">Desconhecer</span>
                  </Button>
                  <div className="mx-2 hidden h-6 w-px bg-border sm:block" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onBulkDownload("xml")}
                    className="gap-2"
                  >
                    <Download className="size-4" />
                    <span className="hidden sm:inline">XML</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onBulkDownload("pdf")}
                    className="gap-2"
                  >
                    <Download className="size-4" />
                    <span className="hidden sm:inline">DANFE</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
