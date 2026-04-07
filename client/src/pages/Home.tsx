import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link as WouterLink } from "wouter";
import { Copy, Plus, BarChart3 } from "lucide-react";
import { toast } from "sonner";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [originalUrl, setOriginalUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const createLinkMutation = trpc.links.create.useMutation();
  const linksQuery = trpc.links.list.useQuery({ limit: 50 });

  const handleCreateLink = async () => {
    if (!originalUrl) {
      toast.error("Por favor, insira uma URL");
      return;
    }

    setIsCreating(true);
    try {
      const result = await createLinkMutation.mutateAsync({
        originalUrl,
        customAlias: customAlias || undefined,
        ogTitle: ogTitle || undefined,
        ogDescription: ogDescription || undefined,
      });

      toast.success("Link criado com sucesso!");
      setOriginalUrl("");
      setCustomAlias("");
      setOgTitle("");
      setOgDescription("");
      linksQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar link");
    } finally {
      setIsCreating(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">LinkShort</CardTitle>
              <CardDescription>Encurtador de links otimizado para Facebook</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                Crie links encurtados com Open Graph personalizado que passam na verificação do Facebook.
              </p>
              <Button asChild className="w-full" size="lg">
                <a href={getLoginUrl()}>Fazer Login</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              L
            </div>
            <h1 className="text-2xl font-bold text-gray-900">LinkShort</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name}</span>
            <WouterLink href="/dashboard">
              <Button variant="outline" size="sm">
                Dashboard
              </Button>
            </WouterLink>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Create Link Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Criar Novo Link</CardTitle>
                <CardDescription>Encurte sua URL e personalize com Open Graph</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="url">URL Original *</Label>
                  <Input
                    id="url"
                    placeholder="https://example.com/very-long-url"
                    value={originalUrl}
                    onChange={(e) => setOriginalUrl(e.target.value)}
                    type="url"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alias">Alias Personalizado (opcional)</Label>
                  <Input
                    id="alias"
                    placeholder="meu-link"
                    value={customAlias}
                    onChange={(e) => setCustomAlias(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">Apenas letras, números, hífens e underscores (3-50 caracteres)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Título Open Graph (opcional)</Label>
                  <Input
                    id="title"
                    placeholder="Título que aparecerá no Facebook"
                    value={ogTitle}
                    onChange={(e) => setOgTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição Open Graph (opcional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Descrição que aparecerá no Facebook"
                    value={ogDescription}
                    onChange={(e) => setOgDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button onClick={handleCreateLink} disabled={isCreating || !originalUrl} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  {isCreating ? "Criando..." : "Criar Link"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Stats Card */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Total de Links</p>
                  <p className="text-3xl font-bold text-blue-600">{linksQuery.data?.length || 0}</p>
                </div>
                <Button asChild variant="outline" className="w-full">
                  <WouterLink href="/dashboard">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Ver Dashboard
                  </WouterLink>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Links */}
        {linksQuery.data && linksQuery.data.length > 0 && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Links Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {linksQuery.data.slice(0, 5).map((link) => (
                    <div key={link.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {link.customAlias || link.shortCode}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{link.originalUrl}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {link.totalClicks} cliques
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const url = `${window.location.origin}/${link.customAlias || link.shortCode}`;
                            navigator.clipboard.writeText(url);
                            toast.success("Link copiado!");
                          }}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
