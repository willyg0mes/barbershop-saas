import { useRouter } from "expo-router";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCallback, useEffect, useState } from "react";
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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = format(new Date(), "yyyy-MM-dd");
  const todayLabel = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });

  const loadAppointments = useCallback(async () => {
    if (!token) return;

    try {
      setError(null);
      const data = await fetchAppointments(token, today);
      setAppointments(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro ao carregar agenda");
    }
  }, [token, today]);

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

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.name.split(" ")[0]}</Text>
          <Text style={styles.date}>{todayLabel}</Text>
        </View>
        <Pressable onPress={signOut} style={styles.logout}>
          <Text style={styles.logoutText}>Sair</Text>
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
              <Text style={styles.emptyTitle}>Nenhum horário hoje</Text>
              <Text style={styles.emptyText}>Puxe para atualizar quando chegar um novo agendamento.</Text>
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
    marginBottom: 20,
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
