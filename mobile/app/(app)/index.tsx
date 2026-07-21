import { useRouter } from "expo-router";
import { addDays, format, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppointmentCard } from "@/components/AppointmentCard";
import { Screen } from "@/components/Screen";
import { fetchAppointments } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Appointment } from "@/lib/types";

export default function AgendaScreen() {
  const router = useRouter();
  const { token, user, signOut } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(() => parseISO(selectedDate), [selectedDate]);
  const today = useMemo(() => new Date(), []);
  const isToday = isSameDay(selected, today);
  const isTomorrow = isSameDay(selected, addDays(today, 1));

  const dateLabel = format(selected, "EEEE, dd 'de' MMMM", { locale: ptBR });

  const loadAppointments = useCallback(async () => {
    if (!token) return;

    try {
      setError(null);
      const data = await fetchAppointments(token, selectedDate);
      setAppointments(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro ao carregar agenda");
    }
  }, [token, selectedDate]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  }, [loadAppointments]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await loadAppointments();
      setLoading(false);
    })();
  }, [loadAppointments]);

  function shiftDay(offset: number) {
    setSelectedDate((current) =>
      format(addDays(parseISO(current), offset), "yyyy-MM-dd"),
    );
  }

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>Olá, {user?.name.split(" ")[0]}</Text>
          <Text style={styles.date}>{dateLabel}</Text>
        </View>
        <Pressable onPress={signOut} style={styles.logout}>
          <Text style={styles.logoutText}>Sair</Text>
        </Pressable>
      </View>

      <View style={styles.dateNav}>
        <Pressable onPress={() => shiftDay(-1)} style={styles.navArrow}>
          <Text style={styles.navArrowText}>‹</Text>
        </Pressable>

        <View style={styles.chips}>
          <Pressable
            onPress={() => setSelectedDate(format(today, "yyyy-MM-dd"))}
            style={[styles.chip, isToday && styles.chipActive]}
          >
            <Text style={[styles.chipText, isToday && styles.chipTextActive]}>Hoje</Text>
          </Pressable>
          <Pressable
            onPress={() => setSelectedDate(format(addDays(today, 1), "yyyy-MM-dd"))}
            style={[styles.chip, isTomorrow && styles.chipActive]}
          >
            <Text style={[styles.chipText, isTomorrow && styles.chipTextActive]}>Amanhã</Text>
          </Pressable>
        </View>

        <Pressable onPress={() => shiftDay(1)} style={styles.navArrow}>
          <Text style={styles.navArrowText}>›</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color="#D4AF37" size="large" style={styles.loader} />
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#D4AF37" />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                {isToday ? "Nenhum horário hoje" : "Nenhum horário neste dia"}
              </Text>
              <Text style={styles.emptyText}>
                {isToday
                  ? "Novos agendamentos em outros dias aparecem em Amanhã ou nas setas."
                  : "Puxe para atualizar ou mude a data."}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <AppointmentCard
              appointment={item}
              onPress={() => router.push(`/(app)/appointment/${item.id}`)}
            />
          )}
          contentContainerStyle={appointments.length === 0 ? styles.emptyList : undefined}
        />
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: 8,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  greeting: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
  },
  date: {
    color: "#9ca3af",
    fontSize: 14,
    marginTop: 4,
    textTransform: "capitalize",
  },
  logout: {
    backgroundColor: "#161616",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  logoutText: {
    color: "#d1d5db",
    fontSize: 13,
    fontWeight: "600",
  },
  dateNav: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  navArrow: {
    alignItems: "center",
    backgroundColor: "#161616",
    borderColor: "#2a2a2a",
    borderRadius: 12,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  navArrowText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
    lineHeight: 28,
  },
  chips: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    alignItems: "center",
    backgroundColor: "#161616",
    borderColor: "#2a2a2a",
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10,
  },
  chipActive: {
    backgroundColor: "rgba(212, 175, 55, 0.18)",
    borderColor: "#D4AF37",
  },
  chipText: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#D4AF37",
  },
  loader: {
    marginTop: 40,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
  },
  empty: {
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  error: {
    color: "#f87171",
    marginTop: 12,
    textAlign: "center",
  },
});
