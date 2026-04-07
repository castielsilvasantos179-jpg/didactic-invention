import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { QRCodeSVG as QRCode } from "qrcode.react";
import { useRef } from "react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function LinkDetails() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/link/:id");
  const { isAuthenticated } = useAuth();
  const linkId = params?.id ? parseInt(params.id) : null;

  const linkQuery = trpc.links.get.useQuery({ id: linkId! }, { enabled: !!linkId });
  const statsQuery = trpc.links.stats.useQuery({ id: linkId! }, { enabled: !!linkId });
  const recentClicksQuery = trpc.links.recentClicks.useQuery(
    { id: linkId!, limit: 20 },
    { enabled: !!linkId }
  );

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  if (!match || !linkId) {
    navigate("/dashboard");
    return null;
  }

  const link = linkQuery.data;
  const stats = statsQuery.data;
  const recentClicks = recentClicksQuery.data;

  const handleCopyLink = () => {
    if (link) {
      const url = `${window.location.origin}/${link.customAlias || link.shortCode}`;
      navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Detalhes do Link</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {linkQuery.isLoading ? (
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        ) : link ? (
          <>
            {/* Link Info */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Informações do Link</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Link Curto</p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="bg-gray-100 px-3 py-2 rounded text-sm font-mono flex-1 truncate">
                        {window.location.origin}/{link.customAlias || link.shortCode}
                      </code>
                      <Button variant="outline" size="sm" onClick={handleCopyLink}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">URL Original</p>
                    <p className="text-sm font-mono bg-gray-100 px-3 py-2 rounded mt-1 truncate">
                      {link.originalUrl}
                    </p>
                  </div>
                </div>

                {link.ogTitle && (
                  <div>
                    <p className="text-sm text-gray-600">Título Open Graph</p>
                    <p className="text-sm mt-1">{link.ogTitle}</p>
                  </div>
                )}

                {link.ogDescription && (
                  <div>
                    <p className="text-sm text-gray-600">Descrição Open Graph</p>
                    <p className="text-sm mt-1">{link.ogDescription}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Criado em</p>
                    <p className="text-sm font-medium mt-1">
                      {new Date(link.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  {link.expiresAt && (
                    <div>
                      <p className="text-sm text-gray-600">Expira em</p>
                      <p className="text-sm font-medium mt-1">
                        {new Date(link.expiresAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* QR Code */}
            {link && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>QR Code</CardTitle>
                  <CardDescription>Escaneie para acessar o link</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                  <QRCodeDisplay link={link} />
                </CardContent>
              </Card>
            )}

            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total de Cliques</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-blue-600">{stats.totalClicks}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">IPs Únicos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-green-600">{stats.uniqueIps}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Último Clique</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium">
                      {stats.lastClick
                        ? new Date(stats.lastClick).toLocaleDateString("pt-BR")
                        : "Nenhum clique"}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {stats && stats.byCountry && stats.byCountry.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Cliques por País</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={stats.byCountry}
                          dataKey="count"
                          nameKey="country"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          {stats.byCountry.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {stats && stats.byDevice && stats.byDevice.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Cliques por Dispositivo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stats.byDevice}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="deviceType" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Recent Clicks */}
            {recentClicks && recentClicks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Cliques Recentes</CardTitle>
                  <CardDescription>Últimos 20 cliques no seu link</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b">
                        <tr>
                          <th className="text-left py-2 px-4">Data/Hora</th>
                          <th className="text-left py-2 px-4">País</th>
                          <th className="text-left py-2 px-4">Dispositivo</th>
                          <th className="text-left py-2 px-4">Browser</th>
                          <th className="text-left py-2 px-4">IP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentClicks.map((click) => (
                          <tr key={click.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-4">
                              {new Date(click.createdAt).toLocaleString("pt-BR")}
                            </td>
                            <td className="py-2 px-4">{click.countryName || "-"}</td>
                            <td className="py-2 px-4">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {click.deviceType}
                              </span>
                            </td>
                            <td className="py-2 px-4">{click.browser || "-"}</td>
                            <td className="py-2 px-4 font-mono text-xs">{click.ipAddress || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">Link não encontrado</div>
        )}
      </main>
    </div>
  );
}

function QRCodeDisplay({ link }: { link: any }) {
  const qrRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    if (qrRef.current) {
      const canvas = qrRef.current.querySelector('canvas');
      if (canvas) {
        const url = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `qrcode-${link.customAlias || link.shortCode}.png`;
        downloadLink.click();
        toast.success('QR Code baixado!');
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div ref={qrRef} className="border-4 border-gray-200 rounded-lg p-4 bg-white">
        <QRCode
          value={`${window.location.origin}/${link.customAlias || link.shortCode}`}
          size={256}
          level="H"
          includeMargin={true}
        />
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
      >
        <Download className="w-4 h-4 mr-2" />
        Baixar QR Code
      </Button>
    </div>
  );
}
