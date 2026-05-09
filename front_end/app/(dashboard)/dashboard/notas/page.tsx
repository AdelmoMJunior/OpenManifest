"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw, FileText, AlertTriangle, Loader2, Download, Filter, Plus, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, getAccessToken } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { toast } from "sonner";
import type { NotaFiscal, NotasFilters, Selo } from "@/lib/types";
import { formatCurrency, formatDate, getManifestacaoLabel, getManifestacaoColor } from "@/lib/types";

export default function NotasPage() {
  const { user, config } = useAuthStore();

  const [notes, setNotes] = useState<NotaFiscal[]>([]);
  const [selos, setSelos] = useState<Selo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [filters, setFilters] = useState<NotasFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({ pendentes: 0, completas: 0 });
  const [isManifesting, setIsManifesting] = useState<string | null>(null);

  // Dialog states
  const [downloadConfirmNota, setDownloadConfirmNota] = useState<NotaFiscal | null>(null);
  const [isDownloadingXml, setIsDownloadingXml] = useState(false);
  const [newSeloDialog, setNewSeloDialog] = useState(false);
  const [newSeloForm, setNewSeloForm] = useState({ nome: "", cor_hex: "#3b82f6" });
  const [isCreatingSelo, setIsCreatingSelo] = useState(false);
  const [editingSelo, setEditingSelo] = useState<Selo | null>(null);

  const fetchNotes = useCallback(async () => {
    if (!user?.tenant_cnpj) return;
    setIsLoading(true);
    try {
      const resp = await api.getNotas(user.tenant_cnpj, { page, limit, ...filters });
      setNotes(resp.items || []);
      setTotal(resp.total || 0);
    } catch (err) {
      console.error("Erro ao buscar notas:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.tenant_cnpj, page, limit, filters]);

  const fetchSelos = useCallback(async () => {
    if (!user?.tenant_cnpj) return;
    try {
      const resp = await api.getSelos(user.tenant_cnpj);
      setSelos(resp || []);
    } catch (err) {
      console.error("Erro ao buscar selos:", err);
    }
  }, [user?.tenant_cnpj]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    fetchSelos();
  }, [fetchSelos]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.tenant_cnpj) return;
      try {
        const s = await api.getDashboardStats(user.tenant_cnpj);
        setStats({ pendentes: s.pendentes, completas: s.completas });
      } catch (e) {}
    };
    fetchStats();
  }, [user?.tenant_cnpj, notes]); // Refresh stats when notes change (e.g. sync/manifest)

  const handleSync = useCallback(async () => {
    if (!user?.tenant_cnpj || !config?.uf) return;
    setIsSyncing(true);
    try {
      const result = await api.syncNotas(user.tenant_cnpj, config.uf || "SP");
      toast.success("Sincronização concluída", {
        description: `NSU atual: ${result.nsu_atual}`,
      });
      fetchNotes();
    } catch (err: unknown) {
      const error = err as { detail?: string; status?: number };
      if (error.status === 409) {
        toast.warning("Sincronização em andamento", {
          description: error.detail || "O servidor já está sincronizando suas notas.",
        });
      } else if (error.status === 429) {
        toast.error("Limite da SEFAZ", {
          description: error.detail || "Aguarde antes de consultar novamente.",
        });
      } else if (error.status === 400) {
        toast.error("Certificado expirado", {
          description: error.detail || "Atualize seu certificado nas configurações.",
        });
      } else {
        toast.error("Erro na sincronização", {
          description: error.detail || "Não foi possível sincronizar com a SEFAZ.",
        });
      }
    } finally {
      setIsSyncing(false);
    }
  }, [user?.tenant_cnpj, config?.uf, fetchNotes]);

  const handleManifest = useCallback(
    async (chave: string, tipo: "ciencia" | "confirmacao" | "desconhecimento" | "nao_realizada") => {
      if (!user?.tenant_cnpj) return;
      setIsManifesting(chave);
      try {
        if (tipo === "ciencia") await api.manifestarCiencia(user.tenant_cnpj, chave);
        else if (tipo === "confirmacao") await api.manifestarConfirmacao(user.tenant_cnpj, chave);
        else if (tipo === "desconhecimento") await api.manifestarDesconhecimento(user.tenant_cnpj, chave);
        else if (tipo === "nao_realizada") {
           const just = prompt("Informe a justificativa (min 15 caracteres):");
           if (!just || just.length < 15) {
             toast.error("Justificativa muito curta.");
             return;
           }
           await api.manifestarNaoRealizada(user.tenant_cnpj, chave, just);
        }
        
        toast.success("Manifestação registrada!");
        fetchNotes();
      } catch (err: any) {
        toast.error(err.detail || "Erro ao manifestar nota.");
      } finally {
        setIsManifesting(null);
      }
    },
    [user?.tenant_cnpj, fetchNotes]
  );

  const performDownload = async (chave: string) => {
    try {
      const token = getAccessToken();
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const resp = await fetch(`${baseUrl}/api/notas/${chave}/xml`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!resp.ok) {
        let msg = "Erro ao baixar XML.";
        try {
          const err = await resp.json();
          if (err.detail) msg = err.detail;
        } catch (e) {}
        toast.error(msg);
        return;
      }
      
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${chave}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Erro ao baixar XML.");
    }
  };

  const handleDownloadXml = useCallback(
    async (nota: NotaFiscal) => {
      if (!nota.is_completa || !nota.xml_url) {
        setDownloadConfirmNota(nota);
        return;
      }
      await performDownload(nota.chave_acesso);
    },
    []
  );

  const confirmDownloadAndManifest = async () => {
    if (!downloadConfirmNota || !user?.tenant_cnpj) return;
    setIsDownloadingXml(true);
    try {
      // 1. Confirm operation to get the full XML
      await api.manifestarConfirmacao(user.tenant_cnpj, downloadConfirmNota.chave_acesso);
      toast.success("Confirmação enviada. Buscando XML na SEFAZ...");
      
      // 2. Fetch notes to update UI
      fetchNotes();
      
      // 3. Try to download it right away. The backend will attempt to fetch it.
      await performDownload(downloadConfirmNota.chave_acesso);
    } catch {
      toast.error("Erro ao tentar baixar o XML completo.");
    } finally {
      setIsDownloadingXml(false);
      setDownloadConfirmNota(null);
    }
  };

  const handleCreateSelo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.tenant_cnpj || !newSeloForm.nome) return;
    setIsCreatingSelo(true);
    try {
      if (editingSelo) {
        await api.atualizarSelo(editingSelo.id, newSeloForm);
        toast.success("Selo atualizado!");
      } else {
        await api.criarSelo(user.tenant_cnpj, newSeloForm);
        toast.success("Selo criado!");
      }
      setNewSeloForm({ nome: "", cor_hex: "#3b82f6" });
      setEditingSelo(null);
      fetchSelos();
      fetchNotes();
    } catch {
      toast.error("Erro ao processar selo.");
    } finally {
      setIsCreatingSelo(false);
    }
  };

  const handleDeleteSelo = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este selo?")) return;
    try {
      await api.deletarSelo(id);
      toast.success("Selo removido!");
      fetchSelos();
      fetchNotes();
    } catch {
      toast.error("Erro ao excluir selo.");
    }
  };

  const handleChangeNotaSelo = async (chave: string, seloId: string) => {
    if (seloId === "new") {
      setNewSeloDialog(true);
      return;
    }
    
    try {
      const id = seloId === "none" ? 0 : parseInt(seloId);
      const token = getAccessToken();
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const resp = await fetch(`${baseUrl}/api/notas/${chave}/selo?selo_id=${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error();
      toast.success("Selo atualizado!");
      fetchNotes();
    } catch {
      toast.error("Erro ao atualizar selo da nota.");
    }
  };

  const totalPages = Math.ceil(total / limit);

  // Se não tem certificado, mostra aviso
  if (!config?.tem_certificado) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
        <AlertTriangle className="size-12 text-amber-400" />
        <div>
          <p className="font-medium text-foreground">Configure seu certificado digital</p>
          <p className="text-sm text-muted-foreground">
            Vá para as Configurações e envie seu arquivo .pfx para começar a receber notas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">
              Notas Fiscais
            </h1>
            <p className="text-muted-foreground">
              {total} notas encontradas
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="size-4" />
              Filtros
            </Button>
            <Button
              onClick={handleSync}
              disabled={isSyncing}
              className="gap-2"
            >
              {isSyncing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Sincronizar SEFAZ
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
              <FileText className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{total}</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
              <AlertTriangle className="size-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : stats.pendentes}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completas</CardTitle>
              <FileText className="size-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                 {isLoading ? <Loader2 className="size-4 animate-spin" /> : stats.completas}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Página</CardTitle>
              <FileText className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{page}/{totalPages || 1}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm p-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">CNPJ Emitente</label>
                <Input
                  placeholder="00.000.000/0000-00"
                  value={filters.emitente_cnpj || ""}
                  onChange={(e) => setFilters({ ...filters, emitente_cnpj: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Manifestação</label>
                <Select
                  value={filters.manifestacao || "all"}
                  onValueChange={(val) => setFilters({ ...filters, manifestacao: val === "all" ? undefined : val as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="sem_manifestacao">Sem Manifestação</SelectItem>
                    <SelectItem value="ciencia_operacao">Ciência</SelectItem>
                    <SelectItem value="confirmacao_operacao">Confirmação</SelectItem>
                    <SelectItem value="desconhecimento_operacao">Desconhecimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Status XML</label>
                <Select
                  value={filters.is_completa === undefined ? "all" : filters.is_completa ? "true" : "false"}
                  onValueChange={(val) => {
                    if (val === "all") setFilters({ ...filters, is_completa: undefined });
                    else setFilters({ ...filters, is_completa: val === "true" });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="true">Completo</SelectItem>
                    <SelectItem value="false">Apenas Resumo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 lg:mt-6">
                <Button className="flex-1" onClick={() => { setPage(1); fetchNotes(); }}>
                  Filtrar
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => { setFilters({}); setPage(1); setTimeout(fetchNotes, 0); }}>
                  Limpar
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Table */}
        <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : notes.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-4 text-center p-6">
              <FileText className="size-12 text-muted-foreground opacity-50" />
              <div>
                <p className="font-medium text-foreground">Nenhuma nota encontrada</p>
                <p className="text-sm text-muted-foreground">
                  Clique em &quot;Sincronizar SEFAZ&quot; para buscar notas novas.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border/50 bg-muted/30">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-20">Nº</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fornecedor</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Valor</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Manifestação</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Selo</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {notes.map((nota) => {
                    const seloAtual = selos.find(s => s.id === nota.selo_id);
                    
                    return (
                      <tr
                        key={nota.chave_acesso}
                        className="hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-3 text-muted-foreground font-medium">
                          {nota.numero ? nota.numero : "—"}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground truncate max-w-[200px]">
                          <div>{nota.emitente_razao_social || nota.emitente_nome || "—"}</div>
                          <div className="text-xs text-muted-foreground font-mono">{nota.emitente_cnpj || "—"}</div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-foreground">
                          {nota.valor_total ? formatCurrency(nota.valor_total) : "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {nota.data_emissao ? formatDate(nota.data_emissao) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getManifestacaoColor(nota.manifestacao || "sem_manifestacao")}`}>
                            {getManifestacaoLabel(nota.manifestacao || "sem_manifestacao")}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Select
                            value={nota.selo_id ? nota.selo_id.toString() : "none"}
                            onValueChange={(val) => handleChangeNotaSelo(nota.chave_acesso, val)}
                          >
                            <SelectTrigger className="w-[130px] h-8 text-xs border-dashed">
                              <SelectValue placeholder="Adicionar selo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sem selo</SelectItem>
                              {selos.map(s => (
                                <SelectItem key={s.id} value={s.id.toString()}>
                                  <div className="flex items-center gap-2">
                                    <div className="size-3 rounded-full" style={{ backgroundColor: s.cor_hex || "#ccc" }} />
                                    <span>{s.nome}</span>
                                  </div>
                                </SelectItem>
                              ))}
                              <SelectItem value="new" className="text-primary font-medium border-t border-border mt-1">
                                <div className="flex items-center gap-1">
                                  <Plus className="size-3" /> Criar novo selo
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleDownloadXml(nota)}
                              title={nota.is_completa ? "Baixar XML Completo" : "Solicitar XML (Requer Confirmação)"}
                              className="h-8 gap-1"
                            >
                              <Download className="size-3.5" />
                              XML
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-8 gap-1"
                                  disabled={isManifesting === nota.chave_acesso || (nota.manifestacao !== "sem_manifestacao" && nota.manifestacao !== undefined)}
                                >
                                  {isManifesting === nota.chave_acesso ? (
                                    <Loader2 className="size-3 animate-spin" />
                                  ) : (
                                    <>Manifestar <ChevronDown className="size-3" /></>
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleManifest(nota.chave_acesso, "ciencia")}>
                                  Ciência da Operação
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleManifest(nota.chave_acesso, "confirmacao")} className="text-green-500">
                                  Confirmar Operação
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleManifest(nota.chave_acesso, "desconhecimento")} className="text-orange-500">
                                  Desconhecimento
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleManifest(nota.chave_acesso, "nao_realizada")} className="text-red-500">
                                  Operação Não Realizada
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/50 px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Mostrando {(page - 1) * limit + 1}–{Math.min(page * limit, total)} de {total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Dialog for downloading incomplete XML */}
      <Dialog open={!!downloadConfirmNota} onOpenChange={(open) => {
        if (isDownloadingXml) return; // Prevent closing while downloading
        if (!open) setDownloadConfirmNota(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atenção: XML Incompleto</DialogTitle>
            <DialogDescription>
              Você possui apenas o resumo desta nota. Para obter o XML completo, é necessário enviar o evento de <strong>Confirmação da Operação</strong> para a SEFAZ.
              <br /><br />
              Tem certeza que deseja confirmar esta operação agora?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDownloadConfirmNota(null)} disabled={isDownloadingXml}>Cancelar</Button>
            <Button onClick={confirmDownloadAndManifest} disabled={isDownloadingXml}>
              {isDownloadingXml ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              {isDownloadingXml ? "Baixando..." : "Confirmar e Baixar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for Managing Selos */}
      <Dialog open={newSeloDialog} onOpenChange={(open) => {
        setNewSeloDialog(open);
        if (!open) {
          setEditingSelo(null);
          setNewSeloForm({ nome: "", cor_hex: "#3b82f6" });
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gerenciar Selos</DialogTitle>
            <DialogDescription>
              Crie, edite ou remova etiquetas para organizar suas notas.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* List of existing selos */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
               {selos.length === 0 ? (
                 <p className="text-sm text-center py-4 text-muted-foreground italic">Nenhum selo criado ainda.</p>
               ) : (
                 selos.map(s => (
                   <div key={s.id} className="flex items-center justify-between p-2 rounded-md bg-secondary/30 group border border-transparent hover:border-border transition-all">
                     <div className="flex items-center gap-2">
                       <div className="size-4 rounded-full shadow-sm" style={{ backgroundColor: s.cor_hex || "#ccc" }} />
                       <span className="font-medium text-sm">{s.nome}</span>
                     </div>
                     <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Button variant="ghost" size="icon" className="size-8" onClick={() => {
                          setEditingSelo(s);
                          setNewSeloForm({ nome: s.nome, cor_hex: s.cor_hex || "#3b82f6" });
                       }}>
                          <Pencil className="size-3.5" />
                       </Button>
                       <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteSelo(s.id)}>
                          <Trash2 className="size-3.5" />
                       </Button>
                     </div>
                   </div>
                 ))
               )}
            </div>

            <form onSubmit={handleCreateSelo} className="space-y-4 pt-4 border-t border-border/50">
               <div className="flex items-center justify-between">
                 <h4 className="text-sm font-semibold">{editingSelo ? "Editar Selo" : "Criar Novo Selo"}</h4>
                 {editingSelo && (
                   <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => {
                     setEditingSelo(null);
                     setNewSeloForm({ nome: "", cor_hex: "#3b82f6" });
                   }}>
                     Cancelar Edição
                   </Button>
                 )}
               </div>
               <div className="space-y-2">
                 <label className="text-xs font-medium text-muted-foreground">Nome do Selo</label>
                 <Input
                   required
                   value={newSeloForm.nome}
                   onChange={(e) => setNewSeloForm({ ...newSeloForm, nome: e.target.value })}
                   placeholder="Ex: Contabilidade, Prioridade, Revisar..."
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-xs font-medium text-muted-foreground">Cor</label>
                 <div className="flex gap-2">
                   <Input
                     type="color"
                     className="w-16 h-10 p-1 cursor-pointer"
                     value={newSeloForm.cor_hex}
                     onChange={(e) => setNewSeloForm({ ...newSeloForm, cor_hex: e.target.value })}
                   />
                   <Input
                     type="text"
                     value={newSeloForm.cor_hex}
                     onChange={(e) => setNewSeloForm({ ...newSeloForm, cor_hex: e.target.value })}
                     pattern="^#[0-9A-Fa-f]{6}$"
                     className="flex-1 font-mono uppercase"
                   />
                 </div>
               </div>
               <DialogFooter className="pt-2">
                 <Button type="submit" className="w-full" disabled={isCreatingSelo}>
                   {isCreatingSelo ? <Loader2 className="size-4 animate-spin" /> : (editingSelo ? "Salvar Alterações" : "Criar Selo")}
                 </Button>
               </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
