import { StyleSheet, Text, View } from "react-native";
import type { AppointmentStatus } from "@/lib/types";

const LABELS: Record<AppointmentStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  in_progress: "Em atendimento",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

const COLORS: Record<AppointmentStatus, string> = {
  pending: "#f59e0b",
  confirmed: "#22c55e",
  in_progress: "#3b82f6",
  completed: "#64748b",
  cancelled: "#ef4444",
  no_show: "#a855f7",
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <View style={[styles.badge, { backgroundColor: `${COLORS[status]}22` }]}>
      <Text style={[styles.text, { color: COLORS[status] }]}>{LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
});
