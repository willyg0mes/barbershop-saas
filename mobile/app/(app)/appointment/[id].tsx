import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBadge } from "@/components/StatusBadge";
import { useDialog } from "@/components/DialogProvider";
import { Screen } from "@/components/Screen";
import { fetchAppointment, rescheduleAppointment, updateAppointmentStatus } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { showLocalNotification } from "@/lib/notifications";
import type { Appointment, AppointmentStatus } from "@/lib/types";
import { openWhatsApp } from "@/lib/whatsapp";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** Monta ISO com offset local a partir dos componentes civis do Date. */
function toApiDateTime(date: Date): string {
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  return (
    `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}` +
    `T${pad2(date.getHours())}:${pad2(date.getMinutes())}:00` +
    `${sign}${pad2(Math.floor(abs / 60))}:${pad2(abs % 60)}`
  );
}

/** Extrai Y-M-D do picker (Android Material costuma devolver meia-noite UTC). */
function civilDateParts(date: Date): { y: number; m: number; d: number } {
  if (Platform.OS === "android" && date.getUTCHours() === 0 && date.getUTCMinutes() === 0) {
    return {
      y: date.getUTCFullYear(),
      m: date.getUTCMonth(),
      d: date.getUTCDate(),
    };
  }

  return {
    y: date.getFullYear(),
    m: date.getMonth(),
    d: date.getDate(),
  };
}

const NEXT_ACTIONS: Partial<Record<AppointmentStatus, { label: string; status: AppointmentStatus }[]>> = {
  pending: [
    { label: "Confirmar", status: "confirmed" },
    { label: "Cancelar", status: "cancelled" },
  ],
  confirmed: [
    { label: "Iniciar atendimento", status: "in_progress" },
    { label: "Não compareceu", status: "no_show" },
    { label: "Cancelar", status: "cancelled" },
  ],
  in_progress: [
    { label: "Concluir", status: "completed" },
    { label: "Cancelar", status: "cancelled" },
  ],
};

export default function AppointmentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, user } = useAuth();
  const dialog = useDialog();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [pickerMode, setPickerMode] = useState<"date" | "time" | null>(null);

  useEffect(() => {
    async function load() {
      if (!token || !id) return;

      try {
        setAppointment(await fetchAppointment(token, Number(id)));
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Erro ao carregar agendamento");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [token, id]);

  const actions = useMemo(
    () => (appointment ? NEXT_ACTIONS[appointment.status] ?? [] : []),
    [appointment],
  );

  async function applyStatusChange(status: AppointmentStatus) {
    if (!token || !appointment) return;

    setUpdating(true);
    setError(null);

    try {
      const updated = await updateAppointmentStatus(token, appointment.id, status);
      setAppointment(updated);
      await showLocalNotification(
        "Status atualizado",
        `${updated.client_name} · ${updated.status}`,
      );

      if (status === "cancelled") {
        const startsAtLabel = format(parseISO(updated.starts_at), "dd/MM 'às' HH:mm", {
          locale: ptBR,
        });
        const firstName = updated.client_name?.split(" ")[0] ?? "";
        const shop = user?.tenant_name ?? "barbearia";

        if (updated.client_phone) {
          await openWhatsApp(
            updated.client_phone,
            `Olá${firstName ? ` ${firstName}` : ""}! Infelizmente seu horário de ${startsAtLabel} na ${shop} foi cancelado. Podemos remarcar quando quiser.`,
          );
        } else {
          dialog.alert(
            "Cancelado",
            "Agendamento cancelado. Este cliente não tem telefone para avisar no WhatsApp.",
          );
        }
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro ao atualizar status");
    } finally {
      setUpdating(false);
    }
  }

  function handleStatusChange(status: AppointmentStatus) {
    if (!appointment) return;

    if (status !== "cancelled") {
      void applyStatusChange(status);
      return;
    }

    void (async () => {
      const ok = await dialog.confirm({
        title: "Cancelar horário",
        message: appointment.client_phone
          ? "O agendamento será cancelado e o WhatsApp abrirá com a mensagem para o cliente."
          : "O agendamento será cancelado. Este cliente não tem telefone cadastrado.",
        confirmText: "Cancelar horário",
        cancelText: "Voltar",
        destructive: true,
      });

      if (ok) {
        await applyStatusChange("cancelled");
      }
    })();
  }

  if (loading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color="#D4AF37" size="large" />
      </Screen>
    );
  }

  if (!appointment) {
    return (
      <Screen style={styles.center}>
        <Text style={styles.error}>{error ?? "Agendamento não encontrado"}</Text>
      </Screen>
    );
  }

  function openReschedule() {
    if (!appointment) return;
    setSelectedDate(parseISO(appointment.starts_at));
    setPickerMode(null);
    setRescheduling(true);
  }

  function onPickerValueChange(_event: unknown, date: Date) {
    const mode = pickerMode;
    if (!mode) return;

    if (Platform.OS === "android") {
      setPickerMode(null);
    }

    setSelectedDate((current) => {
      const next = new Date(current.getTime());

      if (mode === "date") {
        const { y, m, d } = civilDateParts(date);
        next.setFullYear(y, m, d);
        next.setSeconds(0, 0);
        return next;
      }

      next.setHours(date.getHours(), date.getMinutes(), 0, 0);
      return next;
    });
  }

  function onPickerDismiss() {
    setPickerMode(null);
  }

  async function handleReschedule() {
    if (!token || !appointment) return;

    setUpdating(true);
    setError(null);

    try {
      const updated = await rescheduleAppointment(
        token,
        appointment.id,
        toApiDateTime(selectedDate),
      );
      setAppointment(updated);
      setRescheduling(false);
      setPickerMode(null);
      await showLocalNotification("Reagendado", `${updated.client_name} · novo horário`);
      dialog.alert("Pronto", "Horário reagendado com sucesso.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro ao reagendar");
    } finally {
      setUpdating(false);
    }
  }

  const canReschedule = appointment.status === "pending" || appointment.status === "confirmed";
  const startsAt = format(parseISO(appointment.starts_at), "dd/MM 'às' HH:mm", { locale: ptBR });
  const services = appointment.services.map((service) => service.name).join(" + ");

  return (
    <Screen>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>← Voltar</Text>
      </Pressable>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.client}>{appointment.client_name}</Text>
          <StatusBadge status={appointment.status} />
        </View>

        <Text style={styles.time}>{startsAt}</Text>
        <Text style={styles.meta}>
          {services} · {appointment.total_duration_minutes} min · R${" "}
          {(appointment.total_price_cents / 100).toFixed(2).replace(".", ",")}
        </Text>

        {appointment.client_phone ? (
          <View style={styles.contactBlock}>
            <Text style={styles.phoneLabel}>{appointment.client_phone}</Text>
            <View style={styles.contactRow}>
              <Pressable
                onPress={() => void Linking.openURL(`tel:${appointment.client_phone}`)}
                style={({ pressed }) => [styles.linkButton, pressed && styles.actionPressed]}
              >
                <Text style={styles.linkText}>Ligar</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  const firstName = appointment.client_name?.split(" ")[0] ?? "";
                  void openWhatsApp(
                    appointment.client_phone!,
                    `Olá${firstName ? ` ${firstName}` : ""}! Aqui é da barbearia sobre seu horário de ${startsAt}.`,
                  );
                }}
                style={({ pressed }) => [
                  styles.linkButton,
                  styles.whatsappButton,
                  pressed && styles.actionPressed,
                ]}
              >
                <Text style={styles.whatsappText}>WhatsApp</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {appointment.notes ? (
          <View style={styles.notes}>
            <Text style={styles.notesLabel}>Observações</Text>
            <Text style={styles.notesText}>{appointment.notes}</Text>
          </View>
        ) : null}

        {canReschedule && !rescheduling ? (
          <Pressable
            onPress={openReschedule}
            style={({ pressed }) => [styles.rescheduleButton, pressed && styles.actionPressed]}
          >
            <Text style={styles.rescheduleText}>Reagendar</Text>
          </Pressable>
        ) : null}

        {rescheduling ? (
          <View style={styles.rescheduleForm}>
            <Text style={styles.rescheduleTitle}>Novo horário</Text>
            <View style={styles.rescheduleRow}>
              <Pressable
                onPress={() => setPickerMode("date")}
                style={({ pressed }) => [styles.pickerButton, pressed && styles.actionPressed]}
              >
                <Text style={styles.fieldLabel}>Data</Text>
                <Text style={styles.pickerValue}>
                  {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setPickerMode("time")}
                style={({ pressed }) => [styles.pickerButton, pressed && styles.actionPressed]}
              >
                <Text style={styles.fieldLabel}>Hora</Text>
                <Text style={styles.pickerValue}>{format(selectedDate, "HH:mm")}</Text>
              </Pressable>
            </View>

            {pickerMode !== null ? (
              <DateTimePicker
                value={selectedDate}
                mode={pickerMode}
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onValueChange={onPickerValueChange}
                onDismiss={onPickerDismiss}
                minimumDate={new Date()}
                is24Hour
                locale="pt-BR"
                themeVariant="dark"
              />
            ) : null}

            {Platform.OS === "ios" && pickerMode !== null ? (
              <Pressable onPress={() => setPickerMode(null)} style={styles.iosHintChip}>
                <Text style={styles.iosHintText}>Pronto</Text>
              </Pressable>
            ) : null}

            <View style={styles.rescheduleActions}>
              <Pressable
                onPress={() => {
                  setRescheduling(false);
                  setPickerMode(null);
                }}
                style={({ pressed }) => [styles.cancelButton, pressed && styles.actionPressed]}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable
                disabled={updating}
                onPress={() => void handleReschedule()}
                style={({ pressed }) => [
                  styles.confirmButton,
                  (pressed || updating) && styles.actionPressed,
                ]}
              >
                <Text style={styles.confirmButtonText}>
                  {updating ? "Salvando..." : "Confirmar"}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.actions}>
          {actions.map((action) => (
            <Pressable
              key={action.status}
              disabled={updating}
              onPress={() => handleStatusChange(action.status)}
              style={({ pressed }) => [
                styles.actionButton,
                action.status === "cancelled" || action.status === "no_show"
                  ? styles.actionDanger
                  : styles.actionPrimary,
                pressed && styles.actionPressed,
              ]}
            >
              <Text
                style={[
                  styles.actionText,
                  action.status === "cancelled" || action.status === "no_show"
                    ? styles.actionTextDanger
                    : styles.actionTextPrimary,
                ]}
              >
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  back: {
    marginBottom: 12,
    marginTop: 8,
  },
  backText: {
    color: "#D4AF37",
    fontSize: 15,
    fontWeight: "600",
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginBottom: 8,
  },
  client: {
    color: "#fff",
    flex: 1,
    fontSize: 26,
    fontWeight: "800",
  },
  time: {
    color: "#D4AF37",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  meta: {
    color: "#9ca3af",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  contactBlock: {
    marginBottom: 16,
  },
  phoneLabel: {
    color: "#9ca3af",
    fontSize: 13,
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  linkButton: {
    alignSelf: "flex-start",
    backgroundColor: "#161616",
    borderColor: "#2a2a2a",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  linkText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  whatsappButton: {
    backgroundColor: "#0f2a1a",
    borderColor: "#166534",
  },
  whatsappText: {
    color: "#4ade80",
    fontSize: 14,
    fontWeight: "700",
  },
  notes: {
    backgroundColor: "#161616",
    borderRadius: 16,
    marginBottom: 20,
    padding: 16,
  },
  notesLabel: {
    color: "#9ca3af",
    fontSize: 13,
    marginBottom: 6,
  },
  notesText: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    gap: 10,
  },
  actionButton: {
    alignItems: "center",
    borderRadius: 14,
    paddingVertical: 16,
  },
  actionPrimary: {
    backgroundColor: "#D4AF37",
  },
  actionDanger: {
    backgroundColor: "#2a1515",
    borderColor: "#7f1d1d",
    borderWidth: 1,
  },
  actionPressed: {
    opacity: 0.85,
  },
  actionText: {
    fontSize: 15,
    fontWeight: "700",
  },
  actionTextPrimary: {
    color: "#111",
  },
  actionTextDanger: {
    color: "#fca5a5",
  },
  error: {
    color: "#f87171",
    marginTop: 16,
    textAlign: "center",
  },
  rescheduleButton: {
    alignItems: "center",
    backgroundColor: "#161616",
    borderColor: "#2a2a2a",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    paddingVertical: 14,
  },
  rescheduleText: {
    color: "#D4AF37",
    fontSize: 15,
    fontWeight: "700",
  },
  rescheduleForm: {
    backgroundColor: "#161616",
    borderColor: "#2a2a2a",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
  },
  rescheduleTitle: {
    color: "#D4AF37",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  rescheduleRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  pickerButton: {
    backgroundColor: "#111",
    borderColor: "#2a2a2a",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    gap: 6,
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
  },
  iosHintRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  iosHintChip: {
    backgroundColor: "#222",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  iosHintText: {
    color: "#D4AF37",
    fontSize: 13,
    fontWeight: "600",
  },
  rescheduleActions: {
    flexDirection: "row",
    gap: 10,
  },
  cancelButton: {
    alignItems: "center",
    backgroundColor: "#2a1515",
    borderColor: "#7f1d1d",
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: "#fca5a5",
    fontSize: 14,
    fontWeight: "600",
  },
  confirmButton: {
    alignItems: "center",
    backgroundColor: "#D4AF37",
    borderRadius: 999,
    flex: 1,
    paddingVertical: 12,
  },
  confirmButtonText: {
    color: "#111",
    fontSize: 14,
    fontWeight: "700",
  },
});
