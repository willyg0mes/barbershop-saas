import { Pressable, StyleSheet, Text, View } from "react-native";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StatusBadge } from "@/components/StatusBadge";
import type { Appointment, AppointmentStatus } from "@/lib/types";

type QuickAction = {
  label: string;
  status: AppointmentStatus;
};

const QUICK_ACTIONS: Partial<Record<AppointmentStatus, QuickAction>> = {
  pending: { label: "Confirmar", status: "confirmed" },
  confirmed: { label: "Iniciar", status: "in_progress" },
  in_progress: { label: "Concluir", status: "completed" },
};

type AppointmentCardProps = {
  appointment: Appointment;
  onPress: () => void;
  onQuickAction?: (status: AppointmentStatus) => void;
  updating?: boolean;
};

export function AppointmentCard({
  appointment,
  onPress,
  onQuickAction,
  updating = false,
}: AppointmentCardProps) {
  const time = format(parseISO(appointment.starts_at), "HH:mm", { locale: ptBR });
  const services = appointment.services.map((service) => service.name).join(" + ");
  const quickAction = QUICK_ACTIONS[appointment.status];

  return (
    <View style={styles.card}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.body, pressed && styles.pressed]}
      >
        <View style={styles.row}>
          <Text style={styles.time}>{time}</Text>
          <StatusBadge status={appointment.status} />
        </View>
        <Text style={styles.client}>{appointment.client_name}</Text>
        <Text style={styles.meta}>
          {services} · {appointment.total_duration_minutes} min · R${" "}
          {(appointment.total_price_cents / 100).toFixed(2).replace(".", ",")}
        </Text>
      </Pressable>

      {quickAction && onQuickAction ? (
        <Pressable
          disabled={updating}
          onPress={() => onQuickAction(quickAction.status)}
          style={({ pressed }) => [
            styles.quickButton,
            (pressed || updating) && styles.quickPressed,
          ]}
        >
          <Text style={styles.quickButtonText}>
            {updating ? "Atualizando..." : quickAction.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#161616",
    borderColor: "#2a2a2a",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },
  body: {
    gap: 6,
    padding: 16,
    paddingBottom: 12,
  },
  pressed: {
    opacity: 0.92,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  time: {
    color: "#D4AF37",
    fontSize: 18,
    fontWeight: "700",
  },
  client: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  meta: {
    color: "#9ca3af",
    fontSize: 13,
  },
  quickButton: {
    alignItems: "center",
    backgroundColor: "rgba(212, 175, 55, 0.16)",
    borderTopColor: "#2a2a2a",
    borderTopWidth: 1,
    paddingVertical: 12,
  },
  quickPressed: {
    opacity: 0.75,
  },
  quickButtonText: {
    color: "#D4AF37",
    fontSize: 14,
    fontWeight: "700",
  },
});
