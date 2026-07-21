import { addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Screen } from "@/components/Screen";
import {
  createTimeBlock,
  deleteTimeBlock,
  fetchStaffBarbers,
  fetchTimeBlocks,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { TimeBlock, User } from "@/lib/types";

export default function BlocksScreen() {
  const { token, user } = useAuth();
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [barbers, setBarbers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [selectedBarberId, setSelectedBarberId] = useState<number | undefined>();

  const load = useCallback(async () => {
    if (!token) return;

    try {
      setError(null);
      const [nextBlocks, nextBarbers] = await Promise.all([
        fetchTimeBlocks(token, date),
        user?.role === "owner" ? fetchStaffBarbers(token) : Promise.resolve([]),
      ]);
      setBlocks(nextBlocks);
      setBarbers(nextBarbers);
      if (!selectedBarberId && user) {
        setSelectedBarberId(user.id);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro ao carregar bloqueios");
    }
  }, [token, date, user, selectedBarberId]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  async function handleCreate() {
    if (!token) return;
    if (!startTime.trim() || !endTime.trim()) {
      Alert.alert("Campos obrigatórios", "Informe horário de início e fim.");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const startsAt = `${date}T${startTime.trim()}:00`;
      const endsAt = `${date}T${endTime.trim()}:00`;

      await createTimeBlock(token, {
        barber_id: user?.role === "owner" ? selectedBarberId : undefined,
        starts_at: startsAt,
        ends_at: endsAt,
        reason: reason.trim() || undefined,
      });

      setStartTime("");
      setEndTime("");
      setReason("");
      await load();
      Alert.alert("Pronto", "Bloqueio criado.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro ao criar bloqueio");
    } finally {
      setCreating(false);
    }
  }

  function confirmDelete(block: TimeBlock) {
    Alert.alert(
      "Remover bloqueio",
      `Excluir o bloqueio das ${format(new Date(block.starts_at), "HH:mm")}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            void (async () => {
              if (!token) return;
              try {
                await deleteTimeBlock(token, block.id);
                await load();
              } catch (caught) {
                setError(caught instanceof Error ? caught.message : "Erro ao excluir bloqueio");
              }
            })();
          },
        },
      ],
    );
  }

  const dateLabel = format(new Date(date), "dd/MM", { locale: ptBR });
  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");

  return (
    <Screen style={styles.screen}>
      <Text style={styles.title}>Bloqueios</Text>
      <Text style={styles.subtitle}>Horários indisponíveis na agenda</Text>

      <View style={styles.dateRow}>
        <Pressable
          onPress={() => setDate(format(new Date(), "yyyy-MM-dd"))}
          style={({ pressed }) => [
            styles.dateButton,
            date === format(new Date(), "yyyy-MM-dd") && styles.dateButtonActive,
            pressed && styles.pressed,
          ]}
        >
          <Text
            style={[
              styles.dateButtonText,
              date === format(new Date(), "yyyy-MM-dd") && styles.dateButtonTextActive,
            ]}
          >
            Hoje
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setDate(tomorrow)}
          style={({ pressed }) => [
            styles.dateButton,
            date === tomorrow && styles.dateButtonActive,
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.dateButtonText, date === tomorrow && styles.dateButtonTextActive]}>
            Amanhã
          </Text>
        </Pressable>
        <Text style={styles.dateCurrent}>{dateLabel}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#D4AF37" size="large" style={styles.loader} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.section}>
            Bloqueios · {blocks.length} {blocks.length === 1 ? "item" : "itens"}
          </Text>

          {blocks.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum bloqueio neste dia.</Text>
          ) : (
            blocks.map((block) => (
              <View key={block.id} style={styles.blockCard}>
                <View style={styles.blockInfo}>
                  <Text style={styles.blockTime}>
                    {format(new Date(block.starts_at), "HH:mm")} -{" "}
                    {format(new Date(block.ends_at), "HH:mm")}
                  </Text>
                  <Text style={styles.blockBarber}>{block.barber_name}</Text>
                  {block.reason ? <Text style={styles.blockReason}>{block.reason}</Text> : null}
                </View>
                {block.barber_id === user?.id || user?.role === "owner" ? (
                  <Pressable onPress={() => confirmDelete(block)} style={styles.dangerChip}>
                    <Text style={styles.dangerChipText}>Excluir</Text>
                  </Pressable>
                ) : null}
              </View>
            ))
          )}

          <Text style={[styles.section, styles.sectionSpaced]}>Novo bloqueio</Text>

          {user?.role === "owner" && barbers.length > 0 ? (
            <View style={styles.barberSelector}>
              {barbers.map((barber) => (
                <Pressable
                  key={barber.id}
                  onPress={() => setSelectedBarberId(barber.id)}
                  style={({ pressed }) => [
                    styles.barberChip,
                    selectedBarberId === barber.id && styles.barberChipActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.barberChipText,
                      selectedBarberId === barber.id && styles.barberChipTextActive,
                    ]}
                  >
                    {barber.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <Text style={styles.fieldLabel}>Início (HH:mm)</Text>
              <TextInput
                value={startTime}
                onChangeText={setStartTime}
                placeholder="09:00"
                placeholderTextColor="#6b7280"
                style={styles.input}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.timeField}>
              <Text style={styles.fieldLabel}>Fim (HH:mm)</Text>
              <TextInput
                value={endTime}
                onChangeText={setEndTime}
                placeholder="10:00"
                placeholderTextColor="#6b7280"
                style={styles.input}
                autoCapitalize="none"
              />
            </View>
          </View>

          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Motivo (opcional)"
            placeholderTextColor="#6b7280"
            style={styles.input}
          />

          <Pressable
            disabled={creating}
            onPress={() => void handleCreate()}
            style={({ pressed }) => [
              styles.primaryButton,
              (pressed || creating) && styles.pressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {creating ? "Criando..." : "Criar bloqueio"}
            </Text>
          </Pressable>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: 8,
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
  dateRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  dateButton: {
    backgroundColor: "#161616",
    borderColor: "#2a2a2a",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  dateButtonActive: {
    backgroundColor: "#D4AF37",
    borderColor: "#D4AF37",
  },
  dateButtonText: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "600",
  },
  dateButtonTextActive: {
    color: "#111",
  },
  dateCurrent: {
    color: "#D4AF37",
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
  },
  loader: {
    marginTop: 40,
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
  emptyText: {
    color: "#6b7280",
    fontSize: 14,
    textAlign: "center",
    marginVertical: 20,
  },
  blockCard: {
    alignItems: "center",
    backgroundColor: "#161616",
    borderColor: "#2a2a2a",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 14,
  },
  blockInfo: {
    flex: 1,
  },
  blockTime: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  blockBarber: {
    color: "#D4AF37",
    fontSize: 13,
    marginTop: 2,
  },
  blockReason: {
    color: "#9ca3af",
    fontSize: 13,
    marginTop: 4,
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
  barberSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  barberChip: {
    backgroundColor: "#161616",
    borderColor: "#2a2a2a",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  barberChipActive: {
    backgroundColor: "#D4AF37",
    borderColor: "#D4AF37",
  },
  barberChipText: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "600",
  },
  barberChipTextActive: {
    color: "#111",
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
  error: {
    color: "#f87171",
    marginTop: 8,
    textAlign: "center",
  },
});
