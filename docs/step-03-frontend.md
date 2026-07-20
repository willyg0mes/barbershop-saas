# Passo 3 — Web Mobile Next.js (PWA)

## Entregáveis

- [x] Next.js 15 + Tailwind v4 + shadcn/ui
- [x] Tema escuro por padrão
- [x] PWA (`manifest.ts`, service worker via `@ducanh2912/next-pwa`)
- [x] Branding dinâmico por tenant (cores via API)
- [x] Fluxo passo a passo: serviços → barbeiro → horário → confirmar → sucesso
- [x] Export `.ics` + link Google Calendar
- [x] Middleware para subdomínio / domínio customizado
- [x] Testes Vitest para utilitários de calendário

## Rotas

| Rota | Descrição |
|------|-----------|
| `/` | Redireciona para tenant padrão |
| `/{tenant}` | Fluxo de agendamento |
| `/offline` | Fallback PWA offline |

## Variáveis

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8080
NEXT_PUBLIC_DEFAULT_TENANT=dom-corte
API_URL=http://127.0.0.1:8080
```

## Testes

```bash
cd web
npm install
npm run test
npm run build
npm run dev
```

Abrir: http://localhost:3000/dom-corte

### PWA (produção)

```bash
npm run build && npm start
```

No Chrome mobile: menu → "Instalar app" / "Adicionar à tela inicial".

## Tag prevista após merge

Documentada no PR (sem tag semver obrigatória antes do v1.0.0).
