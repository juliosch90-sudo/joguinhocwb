# 🚀 Deploy no Render.com - Passo a Passo

## Passo 1: Criar Repositório no GitHub

1. Vá para https://github.com e faça login
2. Clique em "New Repository" (botão verde)
3. Nome do repositório: `mmorpg-game`
4. Descrição: `Browser-based MMORPG with Babylon.js`
5. Deixe como **Public**
6. **NÃO** marque "Add README" (já temos um)
7. Clique em "Create repository"

## Passo 2: Fazer Upload do Código para o GitHub

Abra o terminal/prompt de comando na pasta do projeto:

```bash
cd C:\Users\Julio\mmorpg

# Inicializar Git
git init

# Adicionar todos os arquivos
git add .

# Fazer commit
git commit -m "Initial commit - MMORPG game"

# Conectar ao GitHub (substitua SEU_USUARIO pelo seu usuário do GitHub)
git remote add origin https://github.com/SEU_USUARIO/mmorpg-game.git

# Fazer push
git branch -M main
git push -u origin main
```

**Se pedir usuário/senha:**
- Use seu usuário do GitHub
- Para senha, use um **Personal Access Token** (não a senha normal)
- Como criar token: GitHub → Settings → Developer Settings → Personal Access Tokens → Generate New Token

## Passo 3: Configurar Banco de Dados no Render

### Opção A: Usar Banco MySQL Gratuito (Recomendado)

1. No Render dashboard, clique em "New +"
2. Selecione "PostgreSQL" (gratuito) ou use serviço externo
3. **OU** use o banco InfinityFree que você já tem (já está configurado)

### Opção B: Usar o Banco do InfinityFree (Já Configurado)

O código já está configurado para usar seu banco do InfinityFree:
- Host: sql300.infinityfree.com
- User: if0_40696061
- Pass: 7lJY57xSZtHl
- Database: if0_40696061_enfermagem_quiz

**IMPORTANTE:** Execute o schema SQL no banco:

1. Acesse phpMyAdmin do InfinityFree
2. Selecione o banco `if0_40696061_enfermagem_quiz`
3. Vá em "SQL"
4. Copie e cole o conteúdo de `server/database/schema.sql`
5. Clique em "Go"

## Passo 4: Criar Web Service no Render

1. Vá para https://dashboard.render.com
2. Clique em "New +" → "Web Service"
3. Conecte seu repositório GitHub:
   - Clique em "Connect account" se necessário
   - Selecione o repositório `mmorpg-game`
4. Configure o serviço:

   **Name:** `mmorpg-game`

   **Environment:** `Node`

   **Build Command:** `npm install`

   **Start Command:** `node server/index.js`

   **Plan:** Selecione **Free**

5. **Environment Variables** (Variáveis de Ambiente):

   Clique em "Advanced" e adicione:

   ```
   DB_HOST = sql300.infinityfree.com
   DB_USER = if0_40696061
   DB_PASSWORD = 7lJY57xSZtHl
   DB_NAME = if0_40696061_enfermagem_quiz
   ```

6. Clique em **"Create Web Service"**

## Passo 5: Aguardar Deploy

- O Render vai automaticamente:
  - Fazer download do código
  - Instalar dependências (npm install)
  - Iniciar o servidor (node server/index.js)

- Acompanhe os logs na tela
- Quando aparecer "✓ WebSocket server listening on port XXXX", está pronto!

## Passo 6: Obter URL do Servidor

Após o deploy, você receberá uma URL tipo:
```
https://mmorpg-game-XXXX.onrender.com
```

Copie essa URL!

## Passo 7: Atualizar Cliente para Conectar ao Servidor

Agora precisamos atualizar o cliente para conectar ao servidor do Render.

### No arquivo local: `C:\Users\Julio\mmorpg\client\js\network.js`

Encontre a linha:
```javascript
connect(url = 'ws://localhost:3000') {
```

Substitua por (use a URL que o Render forneceu):
```javascript
connect(url = 'wss://mmorpg-game-XXXX.onrender.com') {
```

**IMPORTANTE:** Use `wss://` (WebSocket Secure) ao invés de `ws://`

### Fazer upload do cliente atualizado

```bash
cd C:\Users\Julio\mmorpg

# Commit da mudança
git add client/js/network.js
git commit -m "Update WebSocket URL for production"
git push

# O Render vai fazer redeploy automaticamente!
```

## Passo 8: Testar o Jogo!

1. Acesse: `https://mmorpg-game-XXXX.onrender.com` (URL do Render)
2. Digite um nome de personagem
3. Clique em "Join Game"
4. **Jogue!** 🎮

## ⚠️ Avisos Importantes

### Plano Free do Render:
- **Servidor hiberna** após 15 minutos sem uso
- Primeira conexão pode demorar ~30 segundos para "acordar"
- Após acordar, funciona normalmente
- **Solução:** Upgrade para plano pago ($7/mês) ou use serviço de "ping" para manter ativo

### WebSocket no Free Plan:
- Funciona perfeitamente!
- Sem limitações

### Database:
- Usando InfinityFree MySQL (gratuito)
- Pode ter limitações de conexões simultâneas
- Para produção séria, considere usar PostgreSQL do próprio Render

## 🎉 Pronto!

Seu MMORPG está online e funcionando!

**URL do Jogo:** https://mmorpg-game-XXXX.onrender.com

**Compartilhe com amigos e joguem juntos!**

## Troubleshooting

### "WebSocket connection failed"
- Verifique se usou `wss://` ao invés de `ws://`
- Confirme que a URL está correta
- Aguarde 30 segundos (servidor pode estar acordando)

### "Database connection failed"
- Verifique as variáveis de ambiente no Render
- Confirme que executou o schema.sql no banco
- Teste conexão ao banco MySQL do InfinityFree

### "Cannot find module"
- Verifique se o `package.json` está no repositório
- Confirme que o Build Command está correto: `npm install`

---

**Precisa de ajuda?** Manda mensagem!
