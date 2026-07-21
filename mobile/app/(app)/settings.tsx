import { Redirect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Screen } from "@/components/Screen";
import {
  createStaffBarber,
  deactivateStaffBarber,
  fetchBusinessHours,
  fetchStaffBarbers,
  updateBusinessHours,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { BusinessHour, User } from "@/lib/types";

const DAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default function SettingsScreen() {
  const { token, user } = useAuth();
  const [hours, setHours] = useState<BusinessHour[]>([]);
  const [barbers, setBarbers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingHours, setSavingHours] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  const load = useCallback(async () => {
    if (!token) return;

    try {
      setError(null);
      const [nextHours, nextBarbers] = await Promise.all([
        fetchBusinessHours(token),
        fetchStaffBarbers(token),
      ]);
      setHours(nextHours);
      setBarbers(nextBarbers);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro ao carregar configurações");
    }
  }, [token]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  if (user?.role !== "owner") {
    return <Redirect href="/(app)" />;
  }

  function updateDay(dayOfWeek: number, patch: Partial<BusinessHour>) {
    setHours((current) =>
      current.map((day) =>
        day.day_of_week === dayOfWeek ? { ...day, ...patch } : day,
      ),
    );
  }

  async function saveHours() {
    if (!token) return;
    setSavingHours(true);
    setError(null);

    try {
      const saved = await updateBusinessHours(token, hours);
      setHours(saved);
      Alert.alert("Salvo", "Horário de funcionamento atualizado.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro ao salvar horário");
    } finally {
      setSavingHours(false);
    }
  }

  async function handleCreateBarber() {
    if (!token) return;
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Campos obrigatórios", "Informe nome, e-mail e senha.");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      await createStaffBarber(token, {
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
      });
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      await load();
      Alert.alert("Pronto", "Barbeiro adicionado.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro ao adicionar barbeiro");
    } finally {
      setCreating(false);
    }
  }

  function confirmDeactivate(barber: User) {
    Alert.alert(
      "Remover barbeiro",
      `Desativar ${barber.name}? Ele deixa de aparecer na disponibilidade.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Desativar",
          style: "destructive",
          onPress: () => {
            void (async () => {
              if (!token) return;
              try {
                await deactivateStaffBarber(token, barber.id);
                await load();
              } catch (caught) {
                setError(
                  caught instanceof Error ? caught.message : "Erro ao desativar barbeiro",
                );
              }
            })();
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color="#D4AF37" size="large" />
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <Text style={styles.title}>Configurações</Text>
      <Text style={styles.subtitle}>Horário da loja e equipe</Text>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>Horário de funcionamento</Text>
        {hours.map((day) => (
          <View key={day.day_of_week} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayLabel}>{DAY_LABELS[day.day_of_week]}</Text>
              <View style={styles.closedRow}>
                <Text style={styles.closedLabel}>Fechado</Text>
                <Switch
                  value={day.is_closed}
                  onValueChange={(value) =>
                    updateDay(day.day_of_week, {
                      is_closed: value,
                      open_time: value ? null : day.open_time ?? "09:00",
                      close_time: value ? null : day.close_time ?? "19:00",
                    })
                  }
                  trackColor={{ false: "#2a2a2a", true: "#D4AF37" }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            {!day.is_closed ? (
              <View style={styles.timeRow}>
                <View style={styles.timeField}>
                  <Text style={styles.fieldLabel}>Abre</Text>
                  <TextInput
                    value={day.open_time ?? ""}
                    onChangeText={(value) =>
                      updateDay(day.day_of_week, { open_time: value })
                    }
                    placeholder="09:00"
                    placeholderTextColor="#6b7280"
                    style={styles.input}
                    autoCapitalize="none"
                  />
                </View>
                <View style={styles.timeField}>
                  <Text style={styles.fieldLabel}>Fecha</Text>
                  <TextInput
                    value={day.close_time ?? ""}
                    onChangeText={(value) =>
                      updateDay(day.day_of_week, { close_time: value })
                    }
                    placeholder="19:00"
                    placeholderTextColor="#6b7280"
                    style={styles.input}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            ) : null}
          </View>
        ))}

        <Pressable
          disabled={savingHours}
          onPress={() => void saveHours()}
          style={({ pressed }) => [
            styles.primaryButton,
            (pressed || savingHours) && styles.pressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {savingHours ? "Salvando..." : "Salvar horário"}
          </Text>
        </Pressable>

        <Text style={[styles.section, styles.sectionSpaced]}>
          Equipe · {barbers.length} barbeiro{barbers.length === 1 ? "" : "s"}
        </Text>

        {barbers.map((barber) => (
          <View key={barber.id} style={styles.barberCard}>
            <View style={styles.barberInfo}>
              <Text style={styles.barberName}>{barber.name}</Text>
              <Text style={styles.barberMeta}>{barber.email}</Text>
            </View>
            <Pressable onPress={() => confirmDeactivate(barber)} style={styles.dangerChip}>
              <Text style={styles.dangerChipText}>Remover</Text>
            </Pressable>
          </View>
        ))}

        <Text style={[styles.section, styles.sectionSpaced]}>Adicionar barbeiro</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Nome"
          placeholderTextColor="#6b7280"
          style={styles.input}
        />
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="E-mail"
          placeholderTextColor="#6b7280"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="Telefone (opcional)"
          placeholderTextColor="#6b7280"
          keyboardType="phone-pad"
          style={styles.input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Senha inicial"
          placeholderTextColor="#6b7280"
          secureTextEntry
          style={styles.input}
        />

        <Pressable
          disabled={creating}
          onPress={() => void handleCreateBarber()}
          style={({ pressed }) => [
            styles.primaryButton,
            (pressed || creating) && styles.pressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {creating ? "Adicionando..." : "Adicionar barbeiro"}
          </Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: 8,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: 14,
    marginBottom: 16,
    marginTop: 4,
  },
  content: {
    gap: 10,
    paddingBottom: 40,
  },
  section: {
    color: "#D4AF37",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  sectionSpaced: {
    marginTop: 18,
  },
  dayCard: {
    backgroundColor: "#161616",
    borderColor: "#2a2a2a",
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  dayHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayLabel: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  closedRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  closedLabel: {
    color: "#9ca3af",
    fontSize: 13,
  },
  timeRow: {
    flexDirection: "row",
    gap: 10,
  },
  timeField: {
    flex: 1,
    gap: 6,
  },
  fieldLabel: {
    color: "#9ca3af",
    fontSize: 12,
  },
  input: {
    backgroundColor: "#111",
    borderColor: "#2a2a2a",
    borderRadius: 12,
    borderWidth: 1,
    color: "#fff",
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#D4AF37",
    borderRadius: 999,
    marginTop: 6,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: "#111",
    fontSize: 15,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.85,
  },
  barberCard: {
    alignItems: "center",
    backgroundColor: "#161616",
    borderColor: "#2a2a2a",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 14,
  },
  barberInfo: {
    flex: 1,
  },
  barberName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  barberMeta: {
    color: "#9ca3af",
    fontSize: 13,
    marginTop: 2,
  },
  dangerChip: {
    backgroundColor: "#2a1515",
    borderColor: "#7f1d1d",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dangerChipText: {
    color: "#fca5a5",
    fontSize: 13,
    fontWeight: "600",
  },
  error: {
    color: "#f87171",
    marginTop: 8,
    textAlign: "center",
  },
});
