# Barbearia API - Backend Node.js

Sistema completo de gestão para barbearias desenvolvido em Node.js com Express.

## 🚀 Funcionalidades

### Autenticação e Usuários
- Sistema de login/registro com JWT
- Diferentes níveis de acesso (Cliente, Barbeiro, Gerente)
- Gestão de perfis e configurações

### Agendamentos
- Criação e gestão de agendamentos
- Sistema de status (pendente, confirmado, em andamento, concluído, cancelado, não compareceu)
- Verificação de disponibilidade
- Reagendamento e cancelamento

### Gestão de Serviços e Produtos
- CRUD completo de serviços
- Gestão de produtos com controle de estoque
- Categorização e preços dinâmicos

### Relatórios e Analytics
- Relatórios de faturamento
- Estatísticas de agendamentos
- Performance dos barbeiros
- Análise de clientes

### Sistema de Notificações
- Notificações em tempo real
- Lembretes de agendamentos
- Alertas de sistema

### IA Assistente
- Sugestões personalizadas
- Análise de tendências
- Recomendações de serviços

### Pagamentos
- Simulação de gateway de pagamento
- Gestão de planos e assinaturas
- Histórico de transações

## 🛠️ Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **JWT** - Autenticação
- **Joi** - Validação de dados
- **Swagger** - Documentação da API
- **Helmet** - Segurança
- **CORS** - Cross-Origin Resource Sharing
- **Morgan** - Logging de requisições
- **Rate Limiting** - Proteção contra spam

## 📦 Instalação

\`\`\`bash
# Navegar para o diretório do backend
cd backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env

# Iniciar o servidor
npm start

# Para desenvolvimento com auto-reload
npm run dev
\`\`\`

## 🔧 Configuração

### Variáveis de Ambiente

\`\`\`env
PORT=3000
JWT_SECRET=seu_jwt_secret_super_seguro
JWT_EXPIRES_IN=7d
NODE_ENV=development
\`\`\`

### Scripts Disponíveis

\`\`\`json
{
  "start": "node server.js",
  "dev": "nodemon server.js",
  "test": "jest",
  "lint": "eslint .",
  "lint:fix": "eslint . --fix"
}
\`\`\`

## 📚 Documentação da API

A documentação completa da API está disponível via Swagger UI:

\`\`\`
http://localhost:3000/api-docs
\`\`\`

### Endpoints Principais

#### Autenticação
- `POST /api/auth/login` - Realizar login
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/refresh` - Renovar token
- `POST /api/auth/logout` - Fazer logout

#### Agendamentos
- `GET /api/appointments` - Listar agendamentos
- `POST /api/appointments` - Criar agendamento
- `PUT /api/appointments/:id` - Atualizar agendamento
- `DELETE /api/appointments/:id` - Cancelar agendamento

#### Serviços
- `GET /api/services` - Listar serviços
- `POST /api/services` - Criar serviço (Gerente)
- `PUT /api/services/:id` - Atualizar serviço (Gerente)
- `DELETE /api/services/:id` - Remover serviço (Gerente)

#### Relatórios
- `GET /api/reports/revenue` - Relatório de faturamento
- `GET /api/reports/appointments` - Estatísticas de agendamentos
- `GET /api/reports/barbers` - Performance dos barbeiros

## 🔐 Autenticação

O sistema utiliza JWT (JSON Web Tokens) para autenticação. Inclua o token no header das requisições:

\`\`\`
Authorization: Bearer <seu_token_jwt>
\`\`\`

### Níveis de Acesso

- **Cliente**: Pode criar agendamentos, visualizar histórico
- **Barbeiro**: Pode gerenciar seus agendamentos, visualizar clientes
- **Gerente**: Acesso completo ao sistema

## 🛡️ Segurança

- Rate limiting (100 requisições por 15 minutos)
- Helmet para headers de segurança
- Validação rigorosa de dados com Joi
- Sanitização de inputs
- Logs de auditoria para operações críticas

## 📊 Monitoramento

### Health Check
\`\`\`
GET /health
\`\`\`

Retorna status do servidor e tempo de atividade.

### Logs
- Logs de requisições com Morgan
- Logs de auditoria para operações sensíveis
- Logs de erro detalhados

## 🧪 Testes

\`\`\`bash
# Executar todos os testes
npm test

# Executar testes com coverage
npm run test:coverage

# Executar testes em modo watch
npm run test:watch
\`\`\`

## 🚀 Deploy

### Desenvolvimento
\`\`\`bash
npm run dev
\`\`\`

### Produção
\`\`\`bash
npm start
\`\`\`

### Docker (Opcional)
\`\`\`dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

## 📝 Estrutura do Projeto

\`\`\`
backend/
├── config/
│   ├── database.js      # Configuração do banco (mock)
│   └── swagger.js       # Configuração do Swagger
├── middlewares/
│   ├── auth.js          # Middleware de autenticação
│   ├── validation.js    # Middleware de validação
│   ├── errorHandler.js  # Tratamento de erros
│   ├── logging.js       # Logs de auditoria
│   └── security.js      # Middlewares de segurança
├── routes/
│   ├── auth.js          # Rotas de autenticação
│   ├── users.js         # Rotas de usuários
│   ├── appointments.js  # Rotas de agendamentos
│   ├── services.js      # Rotas de serviços
│   ├── products.js      # Rotas de produtos
│   ├── barbers.js       # Rotas de barbeiros
│   ├── clients.js       # Rotas de clientes
│   ├── reports.js       # Rotas de relatórios
│   ├── notifications.js # Rotas de notificações
│   ├── ai.js           # Rotas da IA
│   └── payments.js      # Rotas de pagamentos
├── utils/
│   ├── response.js      # Padronização de respostas
│   └── validators.js    # Validadores customizados
├── server.js            # Arquivo principal
├── package.json         # Dependências
└── README.md           # Documentação
\`\`\`

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte técnico, entre em contato:
- Email: suporte@barbearia.com
- Documentação: http://localhost:3000/api-docs
\`\`\`

\`\`\`json file="" isHidden
