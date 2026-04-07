import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Copy, Trash2, Edit2, BarChart3, Plus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [selectedLinkId, setSelectedLinkId] = useState<number | null>(null);

  const linksQuery = trpc.links.list.useQuery({ limit: 100 });
  const dashboardStatsQuery = trpc.dashboard.stats.useQuery();
  const deleteMutation = trpc.links.delete.useMutation();

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  const handleDelete = async (linkId: number) => {
    if (!confirm("Tem certeza que deseja deletar este link?")) return;

    try {
      await deleteMutation.mutateAsync({ id: linkId });
      toast.success("Link deletado com sucesso!");
      linksQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao deletar link");
    }
  };

  const handleCopyLink = (shortCode: string, customAlias?: string) => {
    const url = `${window.location.origin}/${customAlias || shortCode}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          </div>
          <Button onClick={() => navigate("/")} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Novo Link
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total de Links</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{dashboardStatsQuery.data?.totalLinks || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total de Cliques</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{dashboardStatsQuery.data?.totalClicks || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Links Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">
                {linksQuery.data?.filter((l) => !l.expiresAt || new Date(l.expiresAt) > new Date()).length || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Links Table */}
        <Card>
          <CardHeader>
            <CardTitle>Meus Links</CardTitle>
            <CardDescription>Gerencie seus links encurtados</CardDescription>
          </CardHeader>
          <CardContent>
            {linksQuery.isLoading ? (
              <div className="text-center py-8 text-gray-500">Carregando...</div>
            ) : linksQuery.data && linksQuery.data.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Link Curto</TableHead>
                      <TableHead>URL Original</TableHead>
                      <TableHead>Cliques</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linksQuery.data.map((link) => (
                      <TableRow key={link.id}>
                        <TableCell className="font-mono text-sm">
                          {link.customAlias || link.shortCode}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm text-gray-600">
                          {link.originalUrl}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {link.totalClicks || 0}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(link.createdAt).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyLink(link.shortCode, link.customAlias || undefined)}
                              title="Copiar link"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/link/${link.id}`)}
                              title="Ver estatísticas"
                            >
                              <BarChart3 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(link.id)}
                              title="Deletar link"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Nenhum link criado ainda</p>
                <Button onClick={() => navigate("/")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Link
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
