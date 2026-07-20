# Passo 2 — API e Lógica de Negócio

## Endpoints (`/api/v1`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/tenants/{slug}/branding` | — | Identidade visual do tenant |
| GET | `/tenants/{slug}/services` | — | Serviços ativos |
| GET | `/tenants/{slug}/barbers` | — | Barbeiros disponíveis |
| GET | `/tenants/{slug}/availability` | — | Slots contínuos por duração ou `service_ids[]` |
| POST | `/tenants/{slug}/appointments` | opcional | Criar agendamento |
| POST | `/tenants/{slug}/auth/login` | — | Login Sanctum (token Bearer) |
| GET | `/auth/me` | Bearer | Perfil autenticado |
| POST | `/auth/logout` | Bearer | Revogar token atual |
| PATCH | `/auth/fcm-token` | Bearer (staff) | Registrar token push |
| GET | `/appointments?date=` | Bearer (staff) | Agenda do dia |
| GET | `/appointments/{id}` | Bearer (staff) | Detalhe do agendamento |
| PATCH | `/appointments/{id}` | Bearer (staff) | Atualizar status |
| GET | `/finance/summary?date=` | Bearer (staff) | Resumo financeiro do dia |

## Disponibilidade

O serviço soma a duração dos serviços selecionados (ou usa `duration_minutes`) e retorna apenas horários onde existe **bloco contínuo** livre:

- respeita `business_hours` (tenant ou barbeiro)
- exclui agendamentos ativos (`pending`, `confirmed`, `in_progress`)
- aplica `booking_lead_minutes` e `slot_interval_minutes` do tenant
- não permite slot que ultrapasse o horário de fechamento

### Exemplo

```bash
curl -s "http://127.0.0.1:8080/api/v1/tenants/dom-corte/availability?date=2026-07-21&service_ids[]=1&service_ids[]=2&barber_id=2" | jq
```

## Testes

```bash
cd api
php artisan test --filter=Availability
php artisan test
```

## Rollback

Revert migrations Sanctum se necessário:

```bash
php artisan migrate:rollback --step=1
```

Tag prevista após merge: `v0.2.0`
