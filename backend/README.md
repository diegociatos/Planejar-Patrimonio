# Planejar Patrimônio - Backend API

Backend em Node.js/Express/TypeScript para o sistema de gestão de holdings familiares.

## 🚀 Tecnologias

- **Runtime:** Node.js 20+
- **Framework:** Express.js 4.21
- **Linguagem:** TypeScript 5.7
- **Banco de Dados:** MySQL 8.0
- **Autenticação:** JWT (jsonwebtoken)
- **Criptografia:** bcryptjs
- **Upload:** multer
- **Validação:** express-validator
- **Containerização:** Docker

## 📁 Estrutura do Projeto

```
backend/
├── src/
│   ├── config/           # Configurações (env, database)
│   ├── controllers/      # Controllers das rotas
│   ├── database/         # Schema SQL, migrations, seeds
│   ├── middlewares/      # Auth, upload, validation, errors
│   ├── routes/           # Definição das rotas
│   ├── services/         # Lógica de negócio
│   ├── types/            # Tipos TypeScript
│   ├── utils/            # Funções utilitárias
│   ├── app.ts            # Configuração do Express
│   └── server.ts         # Entry point
├── uploads/              # Diretório de uploads
├── docker-compose.yml    # Docker para produção
├── docker-compose.dev.yml # Docker para desenvolvimento
├── Dockerfile            # Imagem de produção
├── Dockerfile.dev        # Imagem de desenvolvimento
├── package.json
├── tsconfig.json
└── .env.example
```

## 🔧 Instalação

### Pré-requisitos

- Node.js 20+
- MySQL 8.0+ (ou Docker)
- npm ou yarn

### 1. Clone e instale dependências

```bash
cd backend
npm install
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

### 3. Configure o banco de dados

**Opção A: Com Docker (recomendado)**

```bash
# Apenas o banco de dados
docker-compose up -d db

# Aguarde o MySQL iniciar (~10s)
npm run db:migrate
npm run db:seed
```

**Opção B: MySQL local**

```bash
# Crie o banco de dados
mysql -u root -p < src/database/schema.sql

# Execute o seed
npm run db:seed
```

### 4. Inicie o servidor

**Desenvolvimento:**
```bash
npm run dev
```

**Produção:**
```bash
npm run build
npm start
```

## 🐳 Docker

### Desenvolvimento completo

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### Produção

```bash
docker-compose up -d
```

### Acessos

- **API:** http://localhost:3000
- **MySQL:** localhost:3306
- **phpMyAdmin (dev):** http://localhost:8080

## 📡 API Endpoints

### Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Usuário atual |
| POST | `/api/auth/change-password` | Alterar senha |

### Usuários

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/users` | Listar usuários |
| GET | `/api/users/:id` | Buscar usuário |
| POST | `/api/users` | Criar usuário |
| PUT | `/api/users/:id` | Atualizar usuário |
| DELETE | `/api/users/:id` | Deletar usuário |
| PUT | `/api/users/:id/qualification` | Atualizar qualificação |
| POST | `/api/users/:id/documents` | Upload documento |

### Projetos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/projects` | Listar projetos |
| GET | `/api/projects/:id` | Buscar projeto |
| POST | `/api/projects` | Criar projeto |
| PUT | `/api/projects/:id` | Atualizar projeto |
| DELETE | `/api/projects/:id` | Deletar projeto |
| PUT | `/api/projects/:id/phases/:number` | Atualizar fase |
| POST | `/api/projects/:id/advance-phase` | Avançar fase |

### Chat

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/projects/:id/chat/:type` | Listar mensagens |
| POST | `/api/projects/:id/chat/:type` | Enviar mensagem |

### Tarefas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/tasks` | Listar tarefas |
| POST | `/api/tasks` | Criar tarefa |
| PUT | `/api/tasks/:id` | Atualizar tarefa |
| DELETE | `/api/tasks/:id` | Deletar tarefa |

### Documentos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/documents` | Listar documentos |
| POST | `/api/documents/upload` | Upload documento |
| DELETE | `/api/documents/:id` | Deletar documento |

### Notificações

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/notifications` | Listar notificações |
| PUT | `/api/notifications/:id/read` | Marcar como lida |
| PUT | `/api/notifications/read-all` | Marcar todas como lidas |

## 🔐 Autenticação

A API usa JWT (JSON Web Token) para autenticação.

### Headers

```http
Authorization: Bearer <token>
```

### Roles

- **administrator:** Acesso total
- **consultant:** Gerencia projetos e clientes
- **auxiliary:** Suporte ao consultor
- **client:** Acesso apenas aos seus projetos

## 🔐 Credenciais Padrão (Seed)

| Tipo | Email | Senha |
|------|-------|-------|
| Admin | admin@planejar.com | admin123 |
| Consultor | diego.garcia@grupociatos.com.br | 250500 |
| Auxiliar | servicos@grupociatos.com.br | 123456 |
| Cliente | joao.completo@email.com | 123 |
| Cliente | maria.completo@email.com | 123 |

## 📦 Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia em modo desenvolvimento |
| `npm run build` | Compila TypeScript |
| `npm start` | Inicia em produção |
| `npm run db:migrate` | Executa migrations |
| `npm run db:seed` | Popula dados iniciais |
| `npm run lint` | Verifica código |
| `npm test` | Executa testes |

## 🏗️ Arquitetura

```
Request → Routes → Controllers → Services → Database
                        ↓
                   Middlewares (Auth, Validation)
```

### Services

- **UserService:** CRUD de usuários, autenticação, qualificação
- **ProjectService:** Gestão de projetos e fases
- **DocumentService:** Upload e versionamento
- **TaskService:** Gestão de tarefas
- **ChatService:** Mensagens do projeto
- **NotificationService:** Sistema de notificações

## 📄 Licença

Propriedade de Grupo Ciatos.
