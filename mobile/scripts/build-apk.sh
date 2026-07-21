#!/usr/bin/env bash
# Build APK localmente (sem EAS cloud).
# Requisitos: JDK 17+, Android SDK (ANDROID_HOME), Node 20+
#
# Uso:
#   ./scripts/build-apk.sh          # debug (instala direto no celular)
#   ./scripts/build-apk.sh release  # release (precisa keystore — ver docs)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

VARIANT="${1:-debug}"

export EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL:-https://barber.wynext.online}"
export EXPO_PUBLIC_DEFAULT_TENANT="${EXPO_PUBLIC_DEFAULT_TENANT:-dom-corte}"

if [[ -z "${ANDROID_HOME:-}" ]]; then
  echo "Defina ANDROID_HOME (ex: export ANDROID_HOME=\$HOME/Android/Sdk)"
  exit 1
fi

echo "==> API: $EXPO_PUBLIC_API_URL"
echo "==> Variant: $VARIANT"

if [[ ! -d android ]]; then
  echo "==> Gerando projeto nativo (expo prebuild)..."
  npx expo prebuild --platform android --no-install
fi

cd android
chmod +x gradlew

if [[ "$VARIANT" == "release" ]]; then
  if [[ ! -f keystore.properties ]]; then
    echo ""
    echo "Release exige assinatura. Crie o keystore:"
    echo "  keytool -genkeypair -v -storetype PKCS12 \\"
    echo "    -keystore barbershop-release.keystore -alias barbershop \\"
    echo "    -keyalg RSA -keysize 2048 -validity 10000"
    echo ""
    echo "Depois crie android/keystore.properties:"
    echo "  storeFile=../barbershop-release.keystore"
    echo "  storePassword=SUA_SENHA"
    echo "  keyAlias=barbershop"
    echo "  keyPassword=SUA_SENHA"
    echo ""
    echo "Para teste rápido, use: ./scripts/build-apk.sh debug"
    exit 1
  fi
  ./gradlew assembleRelease
  SRC="app/build/outputs/apk/release/app-release.apk"
else
  ./gradlew assembleDebug
  SRC="app/build/outputs/apk/debug/app-debug.apk"
fi

mkdir -p ../dist
OUT="../dist/barbershop-staff-${VARIANT}.apk"
cp "$SRC" "$OUT"

echo ""
echo "✔ APK gerado:"
echo "  $(realpath "$OUT")"
echo "  $(du -h "$OUT" | cut -f1)"
