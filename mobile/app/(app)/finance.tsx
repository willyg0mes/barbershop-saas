import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Screen } from "@/components/Screen";
import { fetchFinanceSummary } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { FinanceSummary } from "@/lib/types";

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={[styles.cardValue, accent ? { color: accent } : null]}>{value}</Text>
    </View>
  );
}

export default function FinanceScreen() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = format(new Date(), "yyyy-MM-dd");
  const todayLabel = format(new Date(), "dd/MM/yyyy", { locale: ptBR });

  const loadSummary = useCallback(async () => {
    if (!token) return;

    try {
      setError(null);
      setSummary(await fetchFinanceSummary(token, today));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro ao carregar financeiro");
    }
  }, [token, today]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await loadSummary();
      setLoading(false);
    })();
  }, [loadSummary]);

  async function refresh() {
    setRefreshing(true);
    await loadSummary();
    setRefreshing(false);
  }

  return (
    <Screen style={styles.screen}>
      <Text style={styles.title}>Financeiro</Text>
      <Text style={styles.subtitle}>Resumo de hoje · {todayLabel}</Text>

      {loading ? (
        <ActivityIndicator color="#D4AF37" size="large" style={styles.loader} />
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#D4AF37" />
          }
        >
          <StatCard
            accent="#D4AF37"
            label="Receita concluída"
            value={`R$ ${summary?.total_revenue_formatted ?? "0,00"}`}
          />
          <StatCard label="Atendimentos concluídos" value={String(summary?.completed_count ?? 0)} />
          <StatCard label="Pendentes / confirmados" value={String(summary?.pending_count ?? 0)} />
          <StatCard label="Cancelados / faltas" value={String(summary?.cancelled_count ?? 0)} />

          {summary?.by_barber && summary.by_barber.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Por barbeiro</Text>
              {summary.by_barber.map((item) => (
                <View key={item.barber_id} style={styles.barberCard}>
                  <Text style={styles.barberName}>{item.barber_name}</Text>
                  <View style={styles.barberStats}>
                    <Text style={styles.barberRevenue}>
                      Receita: R$ {item.revenue_formatted}
                    </Text>
                    {item.commission_formatted ? (
                      <Text style={styles.barberCommission}>
                        Comissão: R$ {item.commission_formatted}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </>
          ) : null}
        </ScrollView>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: 8,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: 14,
    marginBottom: 20,
    marginTop: 4,
  },
  loader: {
    marginTop: 40,
  },
  card: {
    backgroundColor: "#161616",
    borderColor: "#2a2a2a",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    padding: 18,
  },
  cardLabel: {
    color: "#9ca3af",
    fontSize: 13,
    marginBottom: 8,
  },
  cardValue: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
  },
  error: {
    color: "#f87171",
    marginTop: 12,
    textAlign: "center",
  },
  sectionTitle: {
    color: "#D4AF37",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 16,
    textTransform: "uppercase",
  },
  barberCard: {
    backgroundColor: "#161616",
    borderColor: "#2a2a2a",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  barberName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  barberStats: {
    gap: 4,
  },
  barberRevenue: {
    color: "#9ca3af",
    fontSize: 14,
  },
  barberCommission: {
    color: "#D4AF37",
    fontSize: 14,
    fontWeight: "600",
  },
});
