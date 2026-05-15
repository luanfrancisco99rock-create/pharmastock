# PharmaStock 💊

> Sistema integrado de gestão de estoque e endereçamento farmacêutico com sincronização em nuvem

## 🎯 Características

✅ **Gestão de Estoque** - Controle total de produtos com alertas  
✅ **Endereçamento Inteligente** - Sistema Baias + Paletes  
✅ **Movimentações em Tempo Real** - Entrada e saída de produtos  
✅ **Firebase Sync** - Sincroniza dados na nuvem automaticamente  
✅ **Importação em Lote** - PDF, CSV, Excel com IA  
✅ **Armazenamento Local** - Funciona sem internet  
✅ **100% Responsivo** - Mobile-first design  

## 🚀 Começar

### Opção 1: Use direto no GitHub Pages (Sem Firebase)

1. Acesse: **https://seu-usuario.github.io/pharmastock**
2. Clique em "Usar apenas armazenamento local"
3. Pronto! Os dados ficam salvos no navegador

### Opção 2: Configure Firebase (Recomendado)

#### Passo 1: Criar Firebase Project
1. Vá para [firebase.google.com](https://firebase.google.com)
2. Clique em **"Ir para console"** (no canto superior direito)
3. Clique em **"Criar projeto"**
4. Nome: `pharmastock` (ou outro)
5. Desmarque "Ativar Google Analytics"
6. Clique em **"Criar projeto"**

#### Passo 2: Ativar Realtime Database
1. No menu esquerdo, vá para **"Build"** → **"Realtime Database"**
2. Clique em **"Criar Banco de Dados"**
3. Região: `us-central1` (ou a mais próxima)
4. Modo: **Comece no modo de teste**
5. Clique em **"Ativar"**

#### Passo 3: Pegar as Credenciais
1. Clique no ícone de **engrenagem** (Project Settings) no canto superior esquerdo
2. Vá para a aba **"Aplicativos"**
3. Clique em **"Adicionar aplicativo"** → **Web** (ícone `</>`)<br/>
4. Dê um nome: `PharmaStock Web`
5. Copie o objeto `firebaseConfig`:

```javascript
{
  "apiKey": "AIza...",
  "authDomain": "seu-projeto.firebaseapp.com",
  "databaseURL": "https://seu-projeto.firebaseio.com",
  "projectId": "seu-projeto-123",
  // ... outros campos
}
```

#### Passo 4: Configurar no App
1. Abra o PharmaStock
2. Aparecerá um modal pedindo as credenciais
3. Preencha:
   - **API Key**: `AIza...`
   - **Project ID**: `seu-projeto-123`
   - **Database URL**: `https://seu-projeto.firebaseio.com`
4. Clique em **"Salvar configurações"**

**Pronto!** Seus dados agora sincronizam na nuvem ☁️

## 📱 Como Usar

### Dashboard
- **Métricas** - Total de produtos, alertas, baias/paletes livres
- **Alertas** - Produtos com estoque baixo/crítico
- **Histórico** - Últimas 5 movimentações

### Produtos
- Busca por nome, SKU ou endereço
- Visualiza status (normal/baixo/crítico)
- Barra de progresso do estoque

### Movimentações
- Registre entradas e saídas
- Quantidade + Lote/Observação
- Histórico completo do dia

### Baias
- Visualize posições por coluna
- Vejo: N001 · B3 · P2
- Cores: Verde (ok), Laranja (alerta), Cinza (vazio)

### Paletes
- PP1: 32 posições (embarque)
- PP2: 26 posições (embarque)
- Visualização em grid

### Importar
- **Upload de arquivo** - PDF, CSV, Excel com IA
- **Entrada manual** - Um produto por vez
- Conversão automática de endereços

## 🔄 Sincronização de Dados

### Local Storage (Padrão)
- ✅ Funciona sem internet
- ✅ Rápido
- ❌ Dados só no navegador

### Firebase (Recomendado)
- ✅ Acessa de qualquer lugar
- ✅ Sincroniza com múltiplos usuários
- ✅ Backup automático
- ❌ Precisa de internet

**Nota**: Se configurar Firebase, o app salva em **AMBOS** (local + cloud)

## 🛠️ Técnico

### Estrutura
```
pharmastock/
├── index.html      (UI + Estilos)
├── app.js          (Lógica + Firebase)
├── .nojekyll       (GitHub Pages config)
└── README.md       (Este arquivo)
```

### Stack
- **HTML5** - Semântico
- **CSS3** - Design system + responsividade
- **JavaScript Vanilla** - Sem dependências
- **Firebase Realtime DB** - Sincronização
- **Tabler Icons** - ~4500 ícones

### APIs Externas
- `firebase.googleapis.com` - Realtime Database
- `anthropic.com` - Claude IA (para PDFs)

## 📊 Modelo de Dados

```javascript
{
  "pharmastock": {
    "produtos": [
      {
        "sku": "10042",
        "desc": "Paracetamol 750mg Cx100",
        "ean": "7891234567890",
        "qtd": 150,
        "min": 50,
        "addr": "N001 · B3 · P2",
        "col": 1,
        "band": 3,
        "baia": 2
      }
    ],
    "baias": {
      "1-3-2": { /* produto completo */ }
    },
    "paletes": {
      "pp1": { "1": { /* produto */ } },
      "pp2": { }
    },
    "historico": [
      {
        "tipo": "in",
        "desc": "Paracetamol 750mg Cx100",
        "addr": "N001 · B3 · P2",
        "qtd": 50,
        "hora": "14:30",
        "lote": "LOT2024-01"
      }
    ],
    "lastUpdate": "2026-05-14T19:35:00Z"
  }
}
```

## 🔒 Segurança Firebase

**IMPORTANTE**: Configure as regras de segurança:

```json
{
  "rules": {
    "pharmastock": {
      ".read": true,
      ".write": true
    }
  }
}
```

Para produção, implemente autenticação:
```json
{
  "rules": {
    "pharmastock": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

## 🐛 Troubleshooting

### Dados não sincronizam
- ✅ Verifique internet
- ✅ Confira credenciais Firebase
- ✅ Veja console do navegador (F12)

### Upload de PDF não funciona
- ✅ Precisa de chave Claude (add em Firebase)
- ✅ Tente CSV/Excel como alternativa

### GitHub Pages não carrega
- ✅ Aguarde 1-2 minutos após commit
- ✅ Limpe cache (Ctrl+Shift+Delete)

## 📝 Endereçamento

### Formato Antigo
```
Rua · Coluna · Bandeja · Baia
R01 · C03 · B02 · P1
```

### Formato Novo
```
Coluna · Bandeja · Posição
N001 · B2 · P1
```

**Conversão automática:**
- Rua (R) → Coluna (N)
- Coluna (C) → Ignorada
- Bandeja (B) → Bandeja (B)
- Baia (P) → Posição (P)

## 📚 Recursos

- [Firebase Docs](https://firebase.google.com/docs)
- [GitHub Pages](https://pages.github.com)
- [Tabler Icons](https://tabler-icons.io)

## 📄 Licença

MIT - Livre para usar e modificar

---

**Versão:** 2.0  
**Última atualização:** 14 de Maio de 2026  
**Status:** ✅ Produção
