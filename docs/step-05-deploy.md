# Passo 5 — Deploy em Produção

## Domínios (wynext.online)

| Domínio | Serviço | Uso |
|---------|---------|-----|
| `barber.wynext.online` | API Laravel | App barbeiro (Expo) + endpoints REST |
| `app.wynext.online` | Next.js PWA | Agendamento cliente (default tenant) |
| `*.wynext.online` | Next.js PWA | Tenants por subdomínio (ex: `domcorte.wynext.online`) |

### App mobile barbeiro

Produção usa:
```env
EXPO_PUBLIC_API_URL=https://barber.wynext.online
```

Arquivo: `mobile/.env.production` e `mobile/eas.json`.

## Infraestrutura

```
┌─────────────┐     ┌─────────┐     ┌──────────┐
│ Nginx Proxy │────▶│  nginx  │────▶│   web    │  app.wynext.online
│ Manager SSL │     │ (compose)│────▶│ Next.js  │  *.wynext.online
└─────────────┘     │         │────▶│   api    │  barber.wynext.online
                    └─────────┘     └────┬─────┘
                                         │
                                    postgres + redis
```

SSL recomendado via **Nginx Proxy Manager** na VPS, apontando para a porta exposta pelo compose (`HTTP_PORT`, padrão 80).

## Pré-requisitos VPS

- Ubuntu 22.04+ / Debian 12+
- Docker + Docker Compose v2
- DNS apontando para a VPS:
  - `A barber.wynext.online → IP`
  - `A app.wynext.online → IP`
  - `A *.wynext.online → IP` (wildcard) ou CNAME por tenant

## Deploy manual

```bash
git clone https://github.com/willyg0mes/barbershop-saas.git ~/barbershop-saas
cd ~/barbershop-saas
git checkout main

cp .env.production.example .env.production
# Edite: POSTGRES_PASSWORD, APP_KEY (php artisan key:generate --show)

chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

Verificar:
```bash
curl -s https://barber.wynext.online/api/health | jq
curl -I https://app.wynext.online/dom-corte
```

## GitHub Actions

| Workflow | Trigger | Função |
|----------|---------|--------|
| `api-ci.yml` | push/PR em `api/` | PHPUnit |
| `web-ci.yml` | push/PR em `web/` | Vitest + build |
| `deploy.yml` | tag `v*.*.*` ou manual | SSH deploy na VPS |

### Secrets necessários

| Secret | Descrição |
|--------|-----------|
| `VPS_HOST` | IP ou hostname da VPS |
| `VPS_SSH_KEY` | Chave privada SSH |
| `VPS_USER` | Usuário SSH (opcional, default `deploy`) |

Ver [docs/secrets.md](secrets.md).

## Rollback

```bash
cd ~/barbershop-saas
git checkout v0.4.0   # tag anterior
./deploy/deploy.sh
```

## Tag de release

Após merge do Passo 5: **`v1.0.0`**

```bash
git tag v1.0.0
git push origin v1.0.0
```

Dispara deploy automático (se secrets configurados).

## Checklist pós-deploy

- [ ] `GET /api/health` retorna OK
- [ ] PWA cliente em `https://app.wynext.online/dom-corte`
- [ ] App barbeiro conecta em `https://barber.wynext.online`
- [ ] SSL ativo (NPM ou certbot)
- [ ] Backups PostgreSQL agendados
- [ ] `APP_DEBUG=false` em produção
