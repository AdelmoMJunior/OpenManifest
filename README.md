# OpenManifest

🚀 **OpenManifest** é uma plataforma gratuita e open source para gestão de Notas Fiscais Eletrônicas (NF-e). 

Com foco em simplicidade e segurança, o projeto permite que empresas visualizem, baixem o XML completo e realizem a manifestação do destinatário de forma automatizada e segura.

## ✨ Principais Recursos

- **Sincronização Automática**: Consulta periódica à SEFAZ via NSU para captar novas notas.
- **Download de XML**: Obtenção do XML completo (procNFe) após a confirmação da operação.
- **Manifestação Legal**: Suporte a Ciência, Confirmação, Desconhecimento e Operação Não Realizada.
- **Multi-Tenant**: Arquitetura preparada para gerenciar múltiplos CNPJs e certificados.
- **Gestão por Selos**: Organize suas notas com etiquetas coloridas personalizáveis.
- **Dashboard Financeiro**: Acompanhe o faturamento mensal e comparativos com o mês anterior.

## 🛠️ Tecnologias Utilizadas

### Backend (API)
- **FastAPI**: Framework moderno e de alta performance.
- **ACBrLib**: Integração nativa com os webservices da SEFAZ via bibliotecas ACBr.
- **SQLAlchemy + PostgreSQL**: Persistência de dados robusta.
- **Docker**: Ambiente isolado e fácil de implantar.

### Frontend (Web)
- **Next.js 15**: O framework React para a web.
- **Tailwind CSS**: Estilização moderna e responsiva.
- **Shadcn/UI**: Componentes de interface de alta qualidade.
- **Framer Motion**: Animações fluidas.

## 🚀 Como Executar

### Pré-requisitos
- Docker e Docker Compose instalado.

### Passo a Passo

1. **Clonar o Repositório**
   ```bash
   git clone https://github.com/seu-usuario/openmanifest.git
   cd openmanifest
   ```

2. **Configurar Variáveis de Ambiente**
   Copie o arquivo `.env.example` para `.env` e preencha as chaves do banco de dados e S3 (Backblaze).

3. **Subir com Docker**
   ```bash
   docker-compose up -d --build
   ```

4. **Acessar a Aplicação**
   A API estará disponível em `http://localhost:8000` e o Frontend em `http://localhost:3000`.

## 📄 Licença

Este projeto está licenciado sob a **Licença MIT**. Sinta-se à vontade para usar, modificar e contribuir!

---
Feito com ❤️ pela comunidade OpenManifest.
