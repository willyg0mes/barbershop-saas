# GitHub Secrets

Nunca commitar valores reais. Configure em **Settings → Secrets and variables → Actions**.

| Secret | Uso | Quando |
|--------|-----|--------|
| `DB_URL` | Connection string PostgreSQL de produção / CI | Passo 2+ / 5 |
| `FCM_SERVER_KEY` | Firebase Cloud Messaging (notificações) | Passo 4 |
| `EXPO_TOKEN` | Build/publish Expo (EAS) | Passo 4 |
| `DOCKER_REGISTRY_CREDENTIALS` | Push de imagens Docker | Passo 5 |
| `VPS_SSH_KEY` | Deploy na VPS | Passo 5 |
| `VPS_HOST` | Host da VPS | Passo 5 |

## Status (Passo 1)

Secrets ainda **não configurados** no repositório. Serão criados nos passos correspondentes e documentados no PR de cada step.

## Checklist local

```bash
# Nunca faça:
git add .env
git add **/credentials.json
git add **/*service-account*.json
```
