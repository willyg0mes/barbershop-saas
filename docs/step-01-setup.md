# Passo 1 — Setup e Modelagem do Banco

## Entregáveis

- [x] Laravel 11 em `api/`
- [x] `Dockerfile` + `docker-compose.dev.yml` (PostgreSQL + Redis + API)
- [x] Migrations: `tenants`, `users` (tenant/role), `services`, `business_hours`, `appointments` + pivot
- [x] Seeders com tenant demo **Dom Corte**
- [x] Health: `GET /api/health` + Laravel `/up`
- [x] Testes Feature de schema/seed/health
- [x] Templates de Issue/PR + CI básico

## Critérios de aceitação

- [x] Migrations aplicam sem erro (`migrate:fresh --seed`)
- [x] Seeders populam dados de exemplo
- [x] README com comandos de execução
- [x] PHPUnit verde (5 testes)

## Como testar

```bash
cd api
composer install
cp .env.example .env && php artisan key:generate
touch database/database.sqlite
php artisan migrate:fresh --seed
php artisan test
php artisan serve --port=8080
curl -s http://127.0.0.1:8080/api/health
```

## Rollback

```bash
php artisan migrate:rollback --step=5
# ou
php artisan migrate:fresh
```

## Tag prevista após merge

`v0.1.0`
