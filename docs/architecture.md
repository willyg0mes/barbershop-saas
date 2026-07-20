# Arquitetura

## Visão geral

SaaS multi-tenant de agendamento para barbearias com:

| Camada | Stack |
|--------|--------|
| API | Laravel 11 + PostgreSQL |
| Web cliente | Next.js + TailwindCSS + shadcn/ui (PWA) |
| App barbeiro | React Native + Expo |
| Infra | Docker + Nginx Proxy Manager + GitHub Actions |

## Multi-tenancy

Estratégia: **single-database com `tenant_id`**.

- Cada barbearia é um registro em `tenants` (slug, domínio/subdomínio, branding).
- Tabelas de domínio (`users`, `services`, `business_hours`, `appointments`) carregam `tenant_id`.
- Resolução de tenant no futuro via subdomain / custom domain no middleware (Passo 2/3).

## Modelo de dados (Passo 1)

```
tenants
  └── users (roles: owner | barber | client)
  └── services
  └── business_hours
  └── appointments
        └── appointment_service (pivot)
```

## Segurança (baseline)

- Eloquent / query builder (proteção a SQL injection)
- Roles no model `User`
- Rate limiting e auth Sanctum no Passo 2
- Secrets apenas via GitHub Secrets / `.env` local (nunca commitados)

## Observabilidade

- Health: `GET /up` (Laravel) e `GET /api/health` (app readiness)
- Logs estruturados JSON a partir do Passo 2/5
