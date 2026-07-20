# BarberShop SaaS

SaaS multi-tenant de agendamento para barbearias.

| Camada | Stack | Pasta |
|--------|--------|-------|
| API | Laravel 11 + PostgreSQL | `api/` |
| Web (cliente) | Next.js + Tailwind + shadcn/ui | `web/` *(Passo 3)* |
| App barbeiro | React Native + Expo | `mobile/` *(Passo 4)* |
| Infra | Docker + Nginx Proxy Manager | `docker-compose.*` |

Repositório remoto: https://github.com/willyg0mes/barbershop-saas

## Status

| Passo | Branch | Tag | Estado |
|-------|--------|-----|--------|
| 1 Setup + DB | `step-01-setup` | `v0.1.0` (após merge) | Em andamento |
| 2 API | `step-02-api` | `v0.2.0` | Pendente |
| 3 Frontend | `step-03-frontend` | — | Pendente |
| 4 App Expo | `step-04-app` | — | Pendente |
| 5 Deploy | `step-05-deploy` | `v1.0.0` | Pendente |

## Pré-requisitos

- PHP 8.3+, Composer 2
- Node 20+ (passos 3/4)
- Docker + Docker Compose (recomendado) **ou** SQLite para API local sem Docker
- Conta GitHub com `gh` autenticado

## Quick start — Passo 1 (API + banco)

### Opção A — SQLite (sem Docker)

```bash
git clone https://github.com/willyg0mes/barbershop-saas.git
cd barbershop-saas
git checkout step-01-setup

cd api
cp .env.example .env
composer install
php artisan key:generate
touch database/database.sqlite
php artisan migrate --seed
php artisan serve --port=8080
```

Verificar:

```bash
curl -s http://127.0.0.1:8080/api/health | jq
php artisan test
```

### Opção B — Docker Compose (PostgreSQL)

```bash
docker compose -f docker-compose.dev.yml up --build -d
docker compose -f docker-compose.dev.yml logs -f api
curl -s http://127.0.0.1:8080/api/health | jq
```

Credenciais demo (após seed):

| Role | Email | Senha |
|------|-------|-------|
| Owner | `owner@domcorte.test` | `password` |
| Barber | `barber@domcorte.test` | `password` |
| Client | `cliente@domcorte.test` | `password` |

Tenant demo: slug `dom-corte`, subdomain `domcorte`.

## Git — fluxo e testes locais

```bash
# Atualizar main
git checkout main && git pull origin main

# Trabalhar em um passo
git checkout step-01-setup
git pull origin step-01-setup

# Rodar testes da API
cd api && php artisan test

# Rollback de migration (dev)
php artisan migrate:rollback
# Recriar do zero
php artisan migrate:fresh --seed
```

### Rollback de deploy (documentação completa no Passo 5)

```bash
# Exemplo futuro
git checkout v0.1.0
# redeploy da tag anterior
```

## Secrets

Ver [docs/secrets.md](docs/secrets.md). **Nunca** commitar `.env` ou chaves.

Secrets previstos: `DB_URL`, `FCM_SERVER_KEY`, `EXPO_TOKEN`, `DOCKER_REGISTRY_CREDENTIALS`.

## Branch protection (main)

Após o primeiro PR, configurar em GitHub:

- Require a pull request before merging
- Require status checks to pass (`API CI`)
- Require approvals (mín. 1)

```bash
# Exemplo (requer admin no repo)
gh api repos/willyg0mes/barbershop-saas/branches/main/protection \
  --method PUT \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["Migrations & Tests"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

## Documentação

- [Arquitetura](docs/architecture.md)
- [Secrets](docs/secrets.md)

## Licença

MIT — ver [LICENSE](LICENSE).
