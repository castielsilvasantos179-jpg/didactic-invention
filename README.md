# LinkShort - Encurtador de Links Otimizado para Facebook

Um sistema completo de encurtamento de URLs com suporte a Open Graph personalizado, otimizado para passar na verificação do Facebook. Inclui painel de gerenciamento, API REST, analytics em tempo real e configuração pronta para deploy na Vercel.

## Funcionalidades

### 🔗 Encurtamento de Links
- Geração de short codes únicos e aleatórios
- Alias personalizado opcional (validado)
- Suporte a proteção por senha
- Data de expiração configurável
- Metadados Open Graph personalizados (título, descrição, imagem)

### 🤖 Detecção de Facebook Bot
- Detecta automaticamente bots do Facebook, WhatsApp, LinkedIn e Twitter
- Serve Open Graph tags customizadas para bots
- Redireciona usuários reais para URL de destino
- Suporta verificação de link preview do Facebook

### 📊 Analytics em Tempo Real
- Rastreamento de cliques com timestamp
- Geolocalização por IP (país, cidade, coordenadas)
- Detecção de dispositivo (mobile, tablet, desktop)
- Rastreamento de referrer
- Gráficos de cliques por país e dispositivo
- Histórico de últimos cliques com detalhes

### 🎛️ Painel de Gerenciamento
- Dashboard com estatísticas gerais
- Listagem de todos os links criados
- Página de detalhes com analytics completo
- Criação, edição e deleção de links
- Cópia rápida de links
- Geração de QR Code (pronto para implementar)

### 🔐 API REST
- Autenticação via Bearer token
- Endpoints para criar, listar e obter estatísticas de links
- Suporte a gerenciamento de API keys
- Documentação de API completa

### 🚀 Deploy Pronto para Vercel
- Arquivo `vercel.json` configurado
- Variáveis de ambiente pré-configuradas
- Integração com GitHub para CI/CD
- Suporte a banco de dados MySQL/TiDB

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **Backend**: Express.js, tRPC, Node.js
- **Database**: MySQL/TiDB com Drizzle ORM
- **Authentication**: Manus OAuth
- **Hosting**: Vercel
- **Analytics**: Recharts para visualizações

## Instalação Local

### Pré-requisitos
- Node.js 18+
- pnpm
- MySQL/TiDB database

### Setup

1. Clone o repositório:
```bash
git clone <repository-url>
cd linkshort
```

2. Instale as dependências:
```bash
pnpm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env.local
# Edite .env.local com suas credenciais
```

4. Execute as migrations do banco de dados:
```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

5. Inicie o servidor de desenvolvimento:
```bash
pnpm dev
```

O aplicativo estará disponível em `http://localhost:3000`

## Estrutura do Projeto

```
linkshort/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── pages/            # Páginas (Home, Dashboard, LinkDetails)
│   │   ├── components/       # Componentes reutilizáveis
│   │   ├── lib/trpc.ts       # Cliente tRPC
│   │   └── App.tsx           # Roteamento principal
│   └── index.html
├── server/                    # Backend Node.js
│   ├── _core/                # Configuração do servidor
│   ├── db.ts                 # Helpers de banco de dados
│   ├── routers.ts            # Procedures tRPC
│   ├── utils.ts              # Funções utilitárias
│   └── redirect-handler.ts   # Handler de redirecionamento
├── drizzle/                   # Schema e migrations
│   └── schema.ts             # Definição de tabelas
├── shared/                    # Código compartilhado
├── vercel.json               # Configuração Vercel
└── package.json
```

## API Endpoints

### Autenticação
- `POST /api/oauth/callback` - Callback OAuth
- `POST /api/trpc/auth.logout` - Logout

### Links
- `POST /api/trpc/links.create` - Criar novo link
- `GET /api/trpc/links.list` - Listar links do usuário
- `GET /api/trpc/links.get` - Obter detalhes de um link
- `PUT /api/trpc/links.update` - Atualizar link
- `DELETE /api/trpc/links.delete` - Deletar link
- `GET /api/trpc/links.stats` - Obter estatísticas
- `GET /api/trpc/links.recentClicks` - Obter cliques recentes

### API Keys
- `POST /api/trpc/apiKeys.create` - Criar nova API key
- `GET /api/trpc/apiKeys.list` - Listar API keys
- `DELETE /api/trpc/apiKeys.delete` - Deletar API key

### Dashboard
- `GET /api/trpc/dashboard.stats` - Obter estatísticas gerais

### Redirecionamento
- `GET /:shortCode` - Redirecionar para URL original
- `GET /:customAlias` - Redirecionar usando alias personalizado
- `GET /api/link/:code` - Obter informações do link (sem redirecionar)

## Deploy na Vercel

### Via GitHub

1. Push do código para GitHub:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. Conecte o repositório no Vercel:
   - Acesse https://vercel.com
   - Clique em "New Project"
   - Selecione o repositório do GitHub
   - Configure as variáveis de ambiente
   - Clique em "Deploy"

### Variáveis de Ambiente no Vercel

Configure as seguintes variáveis no painel do Vercel:

- `DATABASE_URL` - String de conexão MySQL/TiDB
- `JWT_SECRET` - Secret para assinar JWTs
- `VITE_APP_ID` - ID da aplicação OAuth
- `OAUTH_SERVER_URL` - URL do servidor OAuth
- `VITE_OAUTH_PORTAL_URL` - URL do portal OAuth
- `OWNER_NAME` - Nome do proprietário
- `OWNER_OPEN_ID` - Open ID do proprietário
- `BUILT_IN_FORGE_API_URL` - URL da API interna
- `BUILT_IN_FORGE_API_KEY` - Chave da API interna
- `VITE_FRONTEND_FORGE_API_KEY` - Chave da API para frontend
- `VITE_FRONTEND_FORGE_API_URL` - URL da API para frontend
- `VITE_ANALYTICS_ENDPOINT` - Endpoint de analytics
- `VITE_ANALYTICS_WEBSITE_ID` - ID do website para analytics
- `VITE_APP_TITLE` - Título da aplicação
- `VITE_APP_LOGO` - URL do logo

## Banco de Dados

### Tabelas

#### `users`
- Usuários autenticados via OAuth

#### `links`
- Links encurtados com metadados Open Graph

#### `clicks`
- Registro de cada clique com geolocalização e detecção de dispositivo

#### `dailyAnalytics`
- Agregação diária de cliques para queries mais rápidas

#### `apiKeys`
- Chaves de API para acesso programático

## Detecção de Facebook Bot

O sistema detecta automaticamente os seguintes bots:
- `facebookexternalhit` - Facebook link scraper
- `facebot` - Facebook bot
- `whatsapp` - WhatsApp link preview
- `linkedinbot` - LinkedIn bot
- `twitterbot` - Twitter bot

Quando um bot é detectado, o servidor retorna HTML com Open Graph tags customizadas, permitindo que o link passe na verificação do Facebook.

## Segurança

- Validação de URLs com sanitização
- Proteção por senha com hash SHA-256
- Validação de alias personalizado
- Proteção contra XSS em Open Graph tags
- Headers de segurança configurados no Vercel
- Autenticação OAuth integrada

## Performance

- Índices de banco de dados otimizados
- Queries eficientes com Drizzle ORM
- Cache de analytics diário
- Redirecionamentos com status 301 (permanent)
- Compressão de assets no Vercel

## Próximos Passos

- [ ] Implementar geração de QR Code
- [ ] Adicionar suporte a webhooks
- [ ] Implementar rate limiting
- [ ] Adicionar testes automatizados
- [ ] Implementar dark mode
- [ ] Adicionar exportação de dados (CSV, JSON)
- [ ] Implementar custom domains
- [ ] Adicionar suporte a múltiplos idiomas

## Licença

MIT

## Suporte

Para suporte, abra uma issue no repositório ou entre em contato com o time de desenvolvimento.
