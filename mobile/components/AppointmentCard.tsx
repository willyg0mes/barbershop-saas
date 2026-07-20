import { Pressable, StyleSheet, Text, View } from "react-native";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StatusBadge } from "@/components/StatusBadge";
import type { Appointment } from "@/lib/types";

type AppointmentCardProps = {
  appointment: Appointment;
  onPress: () => void;
};

export function AppointmentCard({ appointment, onPress }: AppointmentCardProps) {
  const time = format(parseISO(appointment.starts_at), "HH:mm", { locale: ptBR });
  const services = appointment.services.map((service) => service.name).join(" + ");

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
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
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#161616",
    borderColor: "#2a2a2a",
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    marginBottom: 12,
    padding: 16,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
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
});
