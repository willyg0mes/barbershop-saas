# Passo 4 — App Expo (Barbeiro)

## Entregáveis

- [x] API staff: listar/atualizar agendamentos, resumo financeiro, FCM token
- [x] App Expo com login por tenant slug
- [x] Agenda do dia com pull-to-refresh
- [x] Detalhe do agendamento com transição de status
- [x] Aba financeira (receita concluída do dia)
- [x] Registro de push token via `expo-notifications`
- [ ] Notifee + FCM nativo (build EAS / APK — requer `google-services.json`)
- [ ] Build APK via EAS

## Endpoints staff (`/api/v1`, Bearer Sanctum, role `owner|barber`)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/appointments?date=YYYY-MM-DD` | Agenda do dia (barbeiro: só os seus; owner: todos) |
| GET | `/appointments/{id}` | Detalhe |
| PATCH | `/appointments/{id}` | Atualizar status |
| GET | `/finance/summary?date=YYYY-MM-DD` | Resumo financeiro do dia |
| PATCH | `/auth/fcm-token` | Registrar token push |

### Transições de status

| De | Para |
|----|------|
| `pending` | `confirmed`, `cancelled` |
| `confirmed` | `in_progress`, `cancelled`, `no_show` |
| `in_progress` | `completed`, `cancelled` |

## App mobile

### Variáveis

```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:8080
EXPO_PUBLIC_DEFAULT_TENANT=dom-corte
```

No emulador Android use `http://10.0.2.2:8080`. No device físico, use o IP da máquina na rede local.

### Credenciais demo

| Campo | Valor |
|-------|-------|
| Tenant | `dom-corte` |
| E-mail | `barber@domcorte.test` |
| Senha | `password` |

### Rodar

```bash
# API
cd api && php artisan serve --port=8080

# App
cd mobile
cp .env.example .env
npm install
npm start
```

Escaneie o QR code no **Expo Go** (Android/iOS) ou pressione `a` para emulador Android.

### Typecheck

```bash
cd mobile && npm run typecheck
```

## Push notifications

**Dev / Expo Go:** token Expo registrado em `users.fcm_token` via `expo-notifications`.

**Produção (APK):**

1. Configurar Firebase (`google-services.json`) — ver `.gitignore`
2. Instalar `@notifee/react-native` no dev client / EAS build
3. Secret `FCM_SERVER_KEY` no GitHub para envio server-side (Passo 5)

## Build EAS (futuro)

```bash
cd mobile
npx eas-cli login
npx eas build -p android --profile preview
```

Secret necessário: `EXPO_TOKEN` (ver `docs/secrets.md`).

## Tag prevista após merge

`v0.4.0`
