import DateTimePicker from "@react-native-community/datetimepicker";
import { addDays, differenceInCalendarDays, format, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useDialog } from "@/components/DialogProvider";
import { Screen } from "@/components/Screen";
import {
  createTimeBlock,
  deleteTimeBlock,
  fetchStaffBarbers,
  fetchTimeBlocks,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { TimeBlock, User } from "@/lib/types";

type BlockMode = "hours" | "period";
type PickerField = "day" | "startTime" | "endTime" | "periodStart" | "periodEnd" | null;

function toApiDateTime(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

function formatBlockRange(block: TimeBlock): string {
  const start = parseISO(block.starts_at);
  const end = parseISO(block.ends_at);

  if (isSameDay(start, end)) {
    return `${format(start, "dd/MM")} · ${format(start, "HH:mm")} – ${format(end, "HH:mm")}`;
  }

  const fullDays =
    format(start, "HH:mm") === "00:00" &&
    (format(end, "HH:mm") === "23:59" || format(end, "HH:mm") === "00:00");

  if (fullDays) {
    return `${format(start, "dd/MM")} → ${format(end, "dd/MM")}`;
  }

  return `${format(start, "dd/MM HH:mm")} → ${format(end, "dd/MM HH:mm")}`;
}

export default function BlocksScreen() {
  const { token, user } = useAuth();
  const dialog = useDialog();
  const [mode, setMode] = useState<BlockMode>("hours");
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [barbers, setBarbers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [selectedBarberId, setSelectedBarberId] = useState<number | undefined>();
  const [pickerField, setPickerField] = useState<PickerField>(null);

  const [day, setDay] = useState(() => {
    const d = new Date();
    d.setSeconds(0, 0);
    return d;
  });
  const [startTime, setStartTime] = useState(() => {
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return d;
  });
  const [endTime, setEndTime] = useState(() => {
    const d = new Date();
    d.setHours(10, 0, 0, 0);
    return d;
  });
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [periodEnd, setPeriodEnd] = useState(() => {
    const d = addDays(new Date(), 2);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const periodDays = useMemo(
    () => Math.max(1, differenceInCalendarDays(periodEnd, periodStart) + 1),
    [periodStart, periodEnd],
  );

  const load = useCallback(async () => {
    if (!token) return;

    try {
      setError(null);
      const [nextBlocks, nextBarbers] = await Promise.all([
        fetchTimeBlocks(token),
        user?.role === "owner" ? fetchStaffBarbers(token) : Promise.resolve([]),
      ]);
      const upcoming = nextBlocks.filter((block) => parseISO(block.ends_at) >= new Date());
      setBlocks(upcoming);
      setBarbers(nextBarbers);
      if (!selectedBarberId && user) {
        setSelectedBarberId(user.id);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro ao carregar bloqueios");
    }
  }, [token, user, selectedBarberId]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  function onPickerValueChange(_event: unknown, date: Date) {
    const field = pickerField;
    if (Platform.OS === "android") {
      setPickerField(null);
    }
    if (!field) return;

    if (field === "day") {
      setDay(date);
      return;
    }
    if (field === "startTime") {
      setStartTime(date);
      return;
    }
    if (field === "endTime") {
      setEndTime(date);
      return;
    }
    if (field === "periodStart") {
      setPeriodStart(date);
      if (date > periodEnd) {
        setPeriodEnd(date);
      }
      return;
    }
    setPeriodEnd(date < periodStart ? periodStart : date);
  }

  async function handleCreate() {
    if (!token) return;

    setCreating(true);
    setError(null);

    try {
      let startsAt: string;
      let endsAt: string;
      let finalReason = reason.trim();

      if (mode === "hours") {
        const start = new Date(day);
        start.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
        const end = new Date(day);
        end.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

        if (end <= start) {
          dialog.alert("Horário inválido", "O horário de fim precisa ser depois do início.");
          setCreating(false);
          return;
        }

        startsAt = toApiDateTime(start);
        endsAt = toApiDateTime(end);
      } else {
        if (periodEnd < periodStart) {
          dialog.alert("Período inválido", "A data final precisa ser depois da inicial.");
          setCreating(false);
          return;
        }

        const start = new Date(periodStart);
        start.setHours(0, 0, 0, 0);
        const end = new Date(periodEnd);
        end.setHours(23, 59, 0, 0);

        startsAt = toApiDateTime(start);
        endsAt = toApiDateTime(end);
        if (!finalReason) {
          finalReason = periodDays >= 3 ? "Férias" : "Ausência";
        }
      }

      await createTimeBlock(token, {
        barber_id: user?.role === "owner" ? selectedBarberId : undefined,
        starts_at: startsAt,
        ends_at: endsAt,
        reason: finalReason || undefined,
      });

      setReason("");
      setPickerField(null);
      await load();
      dialog.alert(
        "Pronto",
        mode === "period"
          ? `Período de ${periodDays} dia${periodDays > 1 ? "s" : ""} bloqueado.`
          : "Bloqueio criado.",
      );
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Erro ao criar bloqueio";
      setError(message);
      dialog.alert("Erro ao bloquear", message);
    } finally {
      setCreating(false);
    }
  }

  function confirmDelete(block: TimeBlock) {
    void (async () => {
      const ok = await dialog.confirm({
        title: "Remover bloqueio",
        message: `Excluir ${formatBlockRange(block)}?`,
        confirmText: "Excluir",
        destructive: true,
      });

      if (!ok || !token) return;

      try {
        await deleteTimeBlock(token, block.id);
        await load();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Erro ao excluir bloqueio");
      }
    })();
  }

  const pickerValue =
    pickerField === "day"
      ? day
      : pickerField === "startTime"
        ? startTime
        : pickerField === "endTime"
          ? endTime
          : pickerField === "periodStart"
            ? periodStart
            : periodEnd;

  return (
    <Screen style={styles.screen}>
      <Text style={styles.title}>Bloqueios</Text>
      <Text style={styles.subtitle}>Indisponibilidade na agenda — horário ou período/férias</Text>

      {loading ? (
        <ActivityIndicator color="#D4AF37" size="large" style={styles.loader} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.section}>
            Próximos · {blocks.length} {blocks.length === 1 ? "item" : "itens"}
          </Text>

          {blocks.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum bloqueio futuro.</Text>
          ) : (
            blocks.map((block) => (
              <View key={block.id} style={styles.blockCard}>
                <View style={styles.blockInfo}>
                  <Text style={styles.blockTime}>{formatBlockRange(block)}</Text>
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

          <View style={styles.modeRow}>
            <Pressable
              onPress={() => setMode("hours")}
              style={[styles.modeChip, mode === "hours" && styles.modeChipActive]}
            >
              <Text style={[styles.modeChipText, mode === "hours" && styles.modeChipTextActive]}>
                Horário
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setMode("period")}
              style={[styles.modeChip, mode === "period" && styles.modeChipActive]}
            >
              <Text style={[styles.modeChipText, mode === "period" && styles.modeChipTextActive]}>
                Período / Férias
              </Text>
            </Pressable>
          </View>

          {user?.role === "owner" && barbers.length > 0 ? (
            <View style={styles.barberSelector}>
              {barbers.map((barber) => (
                <Pressable
                  key={barber.id}
                  onPress={() => setSelectedBarberId(barber.id)}
                  style={[
                    styles.barberChip,
                    selectedBarberId === barber.id && styles.barberChipActive,
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

          {mode === "hours" ? (
            <>
              <Pressable onPress={() => setPickerField("day")} style={styles.pickerButton}>
                <Text style={styles.fieldLabel}>Dia</Text>
                <Text style={styles.pickerValue}>
                  {format(day, "EEEE, dd/MM", { locale: ptBR })}
                </Text>
              </Pressable>
              <View style={styles.timeRow}>
                <Pressable
                  onPress={() => setPickerField("startTime")}
                  style={[styles.pickerButton, styles.timeField]}
                >
                  <Text style={styles.fieldLabel}>Início</Text>
                  <Text style={styles.pickerValue}>{format(startTime, "HH:mm")}</Text>
                </Pressable>
                <Pressable
                  onPress={() => setPickerField("endTime")}
                  style={[styles.pickerButton, styles.timeField]}
                >
                  <Text style={styles.fieldLabel}>Fim</Text>
                  <Text style={styles.pickerValue}>{format(endTime, "HH:mm")}</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.hint}>
                Bloqueia o dia inteiro de cada data — ideal para folga, viagem ou férias.
              </Text>
              <View style={styles.timeRow}>
                <Pressable
                  onPress={() => setPickerField("periodStart")}
                  style={[styles.pickerButton, styles.timeField]}
                >
                  <Text style={styles.fieldLabel}>De</Text>
                  <Text style={styles.pickerValue}>
                    {format(periodStart, "dd/MM/yyyy")}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setPickerField("periodEnd")}
                  style={[styles.pickerButton, styles.timeField]}
                >
                  <Text style={styles.fieldLabel}>Até</Text>
                  <Text style={styles.pickerValue}>
                    {format(periodEnd, "dd/MM/yyyy")}
                  </Text>
                </Pressable>
              </View>
              <Text style={styles.periodSummary}>
                {periodDays === 1 ? "1 dia bloqueado" : `${periodDays} dias bloqueados`}
              </Text>
            </>
          )}

          {pickerField ? (
            <DateTimePicker
              value={pickerValue}
              mode={
                pickerField === "startTime" || pickerField === "endTime" ? "time" : "date"
              }
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onValueChange={onPickerValueChange}
              onDismiss={() => setPickerField(null)}
              minimumDate={new Date()}
              locale="pt-BR"
              themeVariant="dark"
              is24Hour
            />
          ) : null}

          {Platform.OS === "ios" && pickerField ? (
            <Pressable onPress={() => setPickerField(null)} style={styles.doneChip}>
              <Text style={styles.doneChipText}>Pronto</Text>
            </Pressable>
          ) : null}

          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder={mode === "period" ? "Motivo (ex: Férias)" : "Motivo (opcional)"}
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
              {creating
                ? "Salvando..."
                : mode === "period"
                  ? `Bloquear ${periodDays} dia${periodDays > 1 ? "s" : ""}`
                  : "Criar bloqueio"}
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
    marginVertical: 12,
    textAlign: "center",
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
  modeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  modeChip: {
    backgroundColor: "#161616",
    borderColor: "#2a2a2a",
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 12,
  },
  modeChipActive: {
    backgroundColor: "rgba(212, 175, 55, 0.18)",
    borderColor: "#D4AF37",
  },
  modeChipText: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  modeChipTextActive: {
    color: "#D4AF37",
  },
  hint: {
    color: "#9ca3af",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  barberSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
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
  },
  pickerButton: {
    backgroundColor: "#111",
    borderColor: "#2a2a2a",
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  fieldLabel: {
    color: "#9ca3af",
    fontSize: 12,
  },
  pickerValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  periodSummary: {
    color: "#D4AF37",
    fontSize: 13,
    fontWeight: "600",
  },
  doneChip: {
    alignSelf: "flex-start",
    backgroundColor: "#222",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  doneChipText: {
    color: "#D4AF37",
    fontSize: 13,
    fontWeight: "600",
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
