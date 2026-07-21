import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useEffect, useState } from "react";
import { Screen } from "@/components/Screen";
import { useAuth } from "@/lib/auth";

export default function LoginScreen() {
  const { user, loading, signIn, tenantSlug } = useAuth();
  const router = useRouter();
  const [slug, setSlug] = useState(tenantSlug);
  const [email, setEmail] = useState("barber@domcorte.test");
  const [password, setPassword] = useState("password");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/(app)");
    }
  }, [loading, user, router]);

  if (loading || user) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color="#D4AF37" size="large" />
      </Screen>
    );
  }

  async function handleLogin() {
    setSubmitting(true);
    setError(null);

    try {
      await signIn(slug.trim(), email.trim(), password);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro ao entrar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.wrapper}
      >
        <View style={styles.hero}>
          <Text style={styles.kicker}>BarberShop Staff</Text>
          <Text style={styles.title}>Agenda do barbeiro</Text>
          <Text style={styles.subtitle}>
            Entre com o código da barbearia e suas credenciais.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Código da barbearia</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setSlug}
            placeholder="dom-corte"
            placeholderTextColor="#6b7280"
            style={styles.input}
            value={slug}
          />

          <Text style={styles.label}>E-mail</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="barber@domcorte.test"
            placeholderTextColor="#6b7280"
            style={styles.input}
            value={email}
          />

          <Text style={styles.label}>Senha</Text>
          <TextInput
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#6b7280"
            secureTextEntry
            style={styles.input}
            value={password}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            disabled={submitting}
            onPress={handleLogin}
            style={({ pressed }) => [
              styles.button,
              (pressed || submitting) && styles.buttonPressed,
            ]}
          >
            {submitting ? (
              <ActivityIndicator color="#111" />
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  wrapper: {
    flex: 1,
    justifyContent: "center",
  },
  hero: {
    marginBottom: 32,
  },
  kicker: {
    color: "#D4AF37",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: 15,
    lineHeight: 22,
  },
  form: {
    gap: 8,
  },
  label: {
    color: "#d1d5db",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
  },
  input: {
    backgroundColor: "#161616",
    borderColor: "#2a2a2a",
    borderRadius: 14,
    borderWidth: 1,
    color: "#fff",
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  error: {
    color: "#f87171",
    fontSize: 14,
    marginTop: 8,
  },
  button: {
    alignItems: "center",
    backgroundColor: "#D4AF37",
    borderRadius: 999,
    marginTop: 16,
    paddingVertical: 16,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: "#111",
    fontSize: 16,
    fontWeight: "700",
  },
});
