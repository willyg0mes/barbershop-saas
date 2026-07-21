import { useLocalSearchParams, useRouter } from "expo-router";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBadge } from "@/components/StatusBadge";
import { Screen } from "@/components/Screen";
import { fetchAppointment, updateAppointmentStatus } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { showLocalNotification } from "@/lib/notifications";
import type { Appointment, AppointmentStatus } from "@/lib/types";
import { openWhatsApp } from "@/lib/whatsapp";

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
  const { token, tenantSlug } = useAuth();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        const shop = tenantSlug.replace(/-/g, " ");

        if (updated.client_phone) {
          await openWhatsApp(
            updated.client_phone,
            `Olá${firstName ? ` ${firstName}` : ""}! Infelizmente seu horário de ${startsAtLabel} na ${shop} foi cancelado. Podemos remarcar quando quiser.`,
          );
        } else {
          Alert.alert(
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

    Alert.alert(
      "Cancelar horário",
      appointment.client_phone
        ? "O agendamento será cancelado e o WhatsApp abrirá com a mensagem para o cliente."
        : "O agendamento será cancelado. Este cliente não tem telefone cadastrado.",
      [
        { text: "Voltar", style: "cancel" },
        {
          text: "Cancelar horário",
          style: "destructive",
          onPress: () => void applyStatusChange("cancelled"),
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

  if (!appointment) {
    return (
      <Screen style={styles.center}>
        <Text style={styles.error}>{error ?? "Agendamento não encontrado"}</Text>
      </Screen>
    );
  }

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
});
