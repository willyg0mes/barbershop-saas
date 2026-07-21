import { Redirect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Screen } from "@/components/Screen";
import {
  createClosedDate,
  createScheduleBreak,
  createService,
  createStaffBarber,
  deactivateStaffBarber,
  updateStaffBarber,
  deleteClosedDate,
  deleteScheduleBreak,
  deleteService,
  fetchBusinessHours,
  fetchClosedDates,
  fetchScheduleBreaks,
  fetchServices,
  fetchSettings,
  fetchStaffBarbers,
  updateBusinessHours,
  updateSettings,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { BusinessHour, ClosedDate, ScheduleBreak, Service, Settings, User } from "@/lib/types";

const DAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default function SettingsScreen() {
  const { token, user } = useAuth();
  const [hours, setHours] = useState<BusinessHour[]>([]);
  const [barbers, setBarbers] = useState<User[]>([]);
  const [scheduleBreaks, setScheduleBreaks] = useState<ScheduleBreak[]>([]);
  const [closedDates, setClosedDates] = useState<ClosedDate[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingHours, setSavingHours] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  const [breakLabel, setBreakLabel] = useState("");
  const [breakStart, setBreakStart] = useState("");
  const [breakEnd, setBreakEnd] = useState("");

  const [closedDate, setClosedDate] = useState("");
  const [closedReason, setClosedReason] = useState("");

  const [serviceName, setServiceName] = useState("");
  const [serviceDuration, setServiceDuration] = useState("");
  const [servicePrice, setServicePrice] = useState("");

  const load = useCallback(async () => {
    if (!token) return;

    try {
      setError(null);
      const [nextHours, nextBarbers, nextBreaks, nextDates, nextServices, nextSettings] =
        await Promise.all([
          fetchBusinessHours(token),
          fetchStaffBarbers(token),
          fetchScheduleBreaks(token),
          fetchClosedDates(token),
          fetchServices(token),
          fetchSettings(token),
        ]);
      setHours(nextHours);
      setBarbers(nextBarbers);
      setScheduleBreaks(nextBreaks);
      setClosedDates(nextDates);
      setServices(nextServices);
      setSettings(nextSettings);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro ao carregar configurações");
    }
  }, [token]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  if (user?.role !== "owner") {
    return <Redirect href="/(app)" />;
  }

  function updateDay(dayOfWeek: number, patch: Partial<BusinessHour>) {
    setHours((current) =>
      current.map((day) =>
        day.day_of_week === dayOfWeek ? { ...day, ...patch } : day,
      ),
    );
  }

  async function saveHours() {
    if (!token) return;
    setSavingHours(true);
    setError(null);

    try {
      const saved = await updateBusinessHours(token, hours);
      setHours(saved);
      Alert.alert("Salvo", "Horário de funcionamento atualizado.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro ao salvar horário");
    } finally {
      setSavingHours(false);
    }
  }

  async function handleCreateBarber() {
    if (!token) return;
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Campos obrigatórios", "Informe nome, e-mail e senha.");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      await createStaffBarber(token, {
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
      });
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      await load();
      Alert.alert("Pronto", "Barbeiro adicionado.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro ao adicionar barbeiro");
    } finally {
      setCreating(false);
    }
  }

  function confirmDeactivate(barber: User) {
    Alert.alert(
      "Remover barbeiro",
      `Desativar ${barber.name}? Ele deixa de aparecer na disponibilidade.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Desativar",
          style: "destructive",
          onPress: () => {
            void (async () => {
              if (!token) return;
              try {
                await deactivateStaffBarber(token, barber.id);
                await load();
              } catch (caught) {
                setError(
                  caught instanceof Error ? caught.message : "Erro ao desativar barbeiro",
                );
              }
            })();
          },
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

  return (
    <Screen style={styles.screen}>
      <Text style={styles.title}>Configurações</Text>
      <Text style={styles.subtitle}>Horário da loja e equipe</Text>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>Horário de funcionamento</Text>
        {hours.map((day) => (
          <View key={day.day_of_week} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayLabel}>{DAY_LABELS[day.day_of_week]}</Text>
              <View style={styles.closedRow}>
                <Text style={styles.closedLabel}>Fechado</Text>
                <Switch
                  value={day.is_closed}
                  onValueChange={(value) =>
                    updateDay(day.day_of_week, {
                      is_closed: value,
                      open_time: value ? null : day.open_time ?? "09:00",
                      close_time: value ? null : day.close_time ?? "19:00",
                    })
                  }
                  trackColor={{ false: "#2a2a2a", true: "#D4AF37" }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            {!day.is_closed ? (
              <>
                <View style={styles.timeRow}>
                  <View style={styles.timeField}>
                    <Text style={styles.fieldLabel}>Abre</Text>
                    <TextInput
                      value={day.open_time ?? ""}
                      onChangeText={(value) =>
                        updateDay(day.day_of_week, { open_time: value })
                      }
                      placeholder="09:00"
                      placeholderTextColor="#6b7280"
                      style={styles.input}
                      autoCapitalize="none"
                    />
                  </View>
                  <View style={styles.timeField}>
                    <Text style={styles.fieldLabel}>Fecha</Text>
                    <TextInput
                      value={day.close_time ?? ""}
                      onChangeText={(value) =>
                        updateDay(day.day_of_week, { close_time: value })
                      }
                      placeholder="19:00"
                      placeholderTextColor="#6b7280"
                      style={styles.input}
                      autoCapitalize="none"
                    />
                  </View>
                </View>
                <View style={styles.timeRow}>
                  <View style={styles.timeField}>
                    <Text style={styles.fieldLabel}>Pausa início (opcional)</Text>
                    <TextInput
                      value={day.break_start ?? ""}
                      onChangeText={(value) =>
                        updateDay(day.day_of_week, { break_start: value || null })
                      }
                      placeholder="12:00"
                      placeholderTextColor="#6b7280"
                      style={styles.input}
                      autoCapitalize="none"
                    />
                  </View>
                  <View style={styles.timeField}>
                    <Text style={styles.fieldLabel}>Pausa fim (opcional)</Text>
                    <TextInput
                      value={day.break_end ?? ""}
                      onChangeText={(value) =>
                        updateDay(day.day_of_week, { break_end: value || null })
                      }
                      placeholder="13:00"
                      placeholderTextColor="#6b7280"
                      style={styles.input}
                      autoCapitalize="none"
                    />
                  </View>
                </View>
              </>
            ) : null}
          </View>
        ))}

        <Pressable
          disabled={savingHours}
          onPress={() => void saveHours()}
          style={({ pressed }) => [
            styles.primaryButton,
            (pressed || savingHours) && styles.pressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {savingHours ? "Salvando..." : "Salvar horário"}
          </Text>
        </Pressable>

        <Text style={[styles.section, styles.sectionSpaced]}>
          Equipe · {barbers.length} barbeiro{barbers.length === 1 ? "" : "s"}
        </Text>

        {barbers.map((barber) => (
          <View key={barber.id} style={styles.barberCard}>
            <View style={styles.barberInfo}>
              <Text style={styles.barberName}>{barber.name}</Text>
              <Text style={styles.barberMeta}>{barber.email}</Text>
              <TextInput
                defaultValue={barber.avatar_url || ""}
                placeholder="URL da foto (opcional)"
                placeholderTextColor="#6b7280"
                autoCapitalize="none"
                style={[styles.input, { marginTop: 8, marginBottom: 0 }]}
                onEndEditing={(e) => {
                  void (async () => {
                    if (!token) return;
                    const avatarUrl = e.nativeEvent.text.trim() || null;
                    if (avatarUrl === (barber.avatar_url || null)) return;
                    try {
                      const updated = await updateStaffBarber(token, barber.id, {
                        avatar_url: avatarUrl,
                      });
                      setBarbers((current) =>
                        current.map((item) => (item.id === barber.id ? updated : item)),
                      );
                    } catch (caught) {
                      setError(caught instanceof Error ? caught.message : "Erro ao salvar foto");
                    }
                  })();
                }}
              />
            </View>
            <Pressable onPress={() => confirmDeactivate(barber)} style={styles.dangerChip}>
              <Text style={styles.dangerChipText}>Remover</Text>
            </Pressable>
          </View>
        ))}

        <Text style={[styles.section, styles.sectionSpaced]}>Adicionar barbeiro</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Nome"
          placeholderTextColor="#6b7280"
          style={styles.input}
        />
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="E-mail"
          placeholderTextColor="#6b7280"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="Telefone (opcional)"
          placeholderTextColor="#6b7280"
          keyboardType="phone-pad"
          style={styles.input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Senha inicial"
          placeholderTextColor="#6b7280"
          secureTextEntry
          style={styles.input}
        />

        <Pressable
          disabled={creating}
          onPress={() => void handleCreateBarber()}
          style={({ pressed }) => [
            styles.primaryButton,
            (pressed || creating) && styles.pressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {creating ? "Adicionando..." : "Adicionar barbeiro"}
          </Text>
        </Pressable>

        <Text style={[styles.section, styles.sectionSpaced]}>
          Pausas programadas · {scheduleBreaks.length}
        </Text>

        {scheduleBreaks.map((brk) => (
          <View key={brk.id} style={styles.itemCard}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{brk.label}</Text>
              <Text style={styles.itemMeta}>
                {brk.start_time} - {brk.end_time}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                Alert.alert("Remover pausa", `Excluir "${brk.label}"?`, [
                  { text: "Cancelar", style: "cancel" },
                  {
                    text: "Excluir",
                    style: "destructive",
                    onPress: () => {
                      void (async () => {
                        if (!token) return;
                        try {
                          await deleteScheduleBreak(token, brk.id);
                          await load();
                        } catch (caught) {
                          setError(
                            caught instanceof Error ? caught.message : "Erro ao excluir pausa",
                          );
                        }
                      })();
                    },
                  },
                ]);
              }}
              style={styles.dangerChip}
            >
              <Text style={styles.dangerChipText}>Excluir</Text>
            </Pressable>
          </View>
        ))}

        <TextInput
          value={breakLabel}
          onChangeText={setBreakLabel}
          placeholder="Nome da pausa (ex: Almoço)"
          placeholderTextColor="#6b7280"
          style={styles.input}
        />
        <View style={styles.timeRow}>
          <View style={styles.timeField}>
            <Text style={styles.fieldLabel}>Início (HH:mm)</Text>
            <TextInput
              value={breakStart}
              onChangeText={setBreakStart}
              placeholder="12:00"
              placeholderTextColor="#6b7280"
              style={styles.input}
              autoCapitalize="none"
            />
          </View>
          <View style={styles.timeField}>
            <Text style={styles.fieldLabel}>Fim (HH:mm)</Text>
            <TextInput
              value={breakEnd}
              onChangeText={setBreakEnd}
              placeholder="13:00"
              placeholderTextColor="#6b7280"
              style={styles.input}
              autoCapitalize="none"
            />
          </View>
        </View>
        <Pressable
          onPress={() => {
            void (async () => {
              if (!token) return;
              if (!breakLabel.trim() || !breakStart.trim() || !breakEnd.trim()) {
                Alert.alert("Campos obrigatórios", "Informe nome, início e fim.");
                return;
              }
              try {
                await createScheduleBreak(token, {
                  label: breakLabel.trim(),
                  start_time: breakStart.trim(),
                  end_time: breakEnd.trim(),
                });
                setBreakLabel("");
                setBreakStart("");
                setBreakEnd("");
                await load();
              } catch (caught) {
                setError(caught instanceof Error ? caught.message : "Erro ao criar pausa");
              }
            })();
          }}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.primaryButtonText}>Adicionar pausa</Text>
        </Pressable>

        <Text style={[styles.section, styles.sectionSpaced]}>
          Dias fechados · {closedDates.length}
        </Text>

        {closedDates.map((cd) => (
          <View key={cd.id} style={styles.itemCard}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{cd.date}</Text>
              {cd.reason ? <Text style={styles.itemMeta}>{cd.reason}</Text> : null}
            </View>
            <Pressable
              onPress={() => {
                Alert.alert("Remover dia fechado", `Excluir ${cd.date}?`, [
                  { text: "Cancelar", style: "cancel" },
                  {
                    text: "Excluir",
                    style: "destructive",
                    onPress: () => {
                      void (async () => {
                        if (!token) return;
                        try {
                          await deleteClosedDate(token, cd.id);
                          await load();
                        } catch (caught) {
                          setError(
                            caught instanceof Error ? caught.message : "Erro ao excluir dia fechado",
                          );
                        }
                      })();
                    },
                  },
                ]);
              }}
              style={styles.dangerChip}
            >
              <Text style={styles.dangerChipText}>Excluir</Text>
            </Pressable>
          </View>
        ))}

        <TextInput
          value={closedDate}
          onChangeText={setClosedDate}
          placeholder="Data (AAAA-MM-DD)"
          placeholderTextColor="#6b7280"
          style={styles.input}
          autoCapitalize="none"
        />
        <TextInput
          value={closedReason}
          onChangeText={setClosedReason}
          placeholder="Motivo (opcional)"
          placeholderTextColor="#6b7280"
          style={styles.input}
        />
        <Pressable
          onPress={() => {
            void (async () => {
              if (!token) return;
              if (!closedDate.trim()) {
                Alert.alert("Campo obrigatório", "Informe a data.");
                return;
              }
              try {
                await createClosedDate(token, {
                  date: closedDate.trim(),
                  reason: closedReason.trim() || undefined,
                });
                setClosedDate("");
                setClosedReason("");
                await load();
              } catch (caught) {
                setError(caught instanceof Error ? caught.message : "Erro ao criar dia fechado");
              }
            })();
          }}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.primaryButtonText}>Adicionar dia fechado</Text>
        </Pressable>

        <Text style={[styles.section, styles.sectionSpaced]}>Serviços · {services.length}</Text>

        {services.map((svc) => (
          <View key={svc.id} style={styles.itemCard}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{svc.name}</Text>
              <Text style={styles.itemMeta}>
                {svc.duration_minutes} min · R$ {svc.price_formatted}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                Alert.alert("Remover serviço", `Excluir "${svc.name}"?`, [
                  { text: "Cancelar", style: "cancel" },
                  {
                    text: "Excluir",
                    style: "destructive",
                    onPress: () => {
                      void (async () => {
                        if (!token) return;
                        try {
                          await deleteService(token, svc.id);
                          await load();
                        } catch (caught) {
                          setError(
                            caught instanceof Error ? caught.message : "Erro ao excluir serviço",
                          );
                        }
                      })();
                    },
                  },
                ]);
              }}
              style={styles.dangerChip}
            >
              <Text style={styles.dangerChipText}>Excluir</Text>
            </Pressable>
          </View>
        ))}

        <TextInput
          value={serviceName}
          onChangeText={setServiceName}
          placeholder="Nome do serviço"
          placeholderTextColor="#6b7280"
          style={styles.input}
        />
        <View style={styles.timeRow}>
          <View style={styles.timeField}>
            <Text style={styles.fieldLabel}>Duração (minutos)</Text>
            <TextInput
              value={serviceDuration}
              onChangeText={setServiceDuration}
              placeholder="30"
              placeholderTextColor="#6b7280"
              keyboardType="numeric"
              style={styles.input}
            />
          </View>
          <View style={styles.timeField}>
            <Text style={styles.fieldLabel}>Preço (centavos)</Text>
            <TextInput
              value={servicePrice}
              onChangeText={setServicePrice}
              placeholder="5000"
              placeholderTextColor="#6b7280"
              keyboardType="numeric"
              style={styles.input}
            />
          </View>
        </View>
        <Pressable
          onPress={() => {
            void (async () => {
              if (!token) return;
              if (!serviceName.trim() || !serviceDuration.trim() || !servicePrice.trim()) {
                Alert.alert("Campos obrigatórios", "Informe nome, duração e preço.");
                return;
              }
              try {
                await createService(token, {
                  name: serviceName.trim(),
                  duration_minutes: Number(serviceDuration),
                  price_cents: Number(servicePrice),
                });
                setServiceName("");
                setServiceDuration("");
                setServicePrice("");
                await load();
              } catch (caught) {
                setError(caught instanceof Error ? caught.message : "Erro ao criar serviço");
              }
            })();
          }}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.primaryButtonText}>Adicionar serviço</Text>
        </Pressable>

        <Text style={[styles.section, styles.sectionSpaced]}>Políticas</Text>

        <View style={styles.policyRow}>
          <Text style={styles.policyLabel}>Habilitar comissão</Text>
          <Switch
            value={settings?.commission_enabled ?? false}
            onValueChange={(value) => {
              void (async () => {
                if (!token) return;
                setSavingSettings(true);
                try {
                  const updated = await updateSettings(token, { commission_enabled: value });
                  setSettings(updated);
                } catch (caught) {
                  setError(caught instanceof Error ? caught.message : "Erro ao salvar");
                } finally {
                  setSavingSettings(false);
                }
              })();
            }}
            trackColor={{ false: "#2a2a2a", true: "#D4AF37" }}
            thumbColor="#fff"
          />
        </View>

        {settings?.commission_enabled ? (
          <View style={styles.policyField}>
            <Text style={styles.fieldLabel}>Percentual de comissão (%)</Text>
            <TextInput
              value={
                settings.commission_percent !== null && settings.commission_percent !== undefined
                  ? String(settings.commission_percent)
                  : ""
              }
              onChangeText={(value) => {
                if (settings) {
                  setSettings({ ...settings, commission_percent: Number(value) || null });
                }
              }}
              onBlur={() => {
                void (async () => {
                  if (!token || !settings) return;
                  setSavingSettings(true);
                  try {
                    const updated = await updateSettings(token, {
                      commission_percent: settings.commission_percent,
                    });
                    setSettings(updated);
                  } catch (caught) {
                    setError(caught instanceof Error ? caught.message : "Erro ao salvar");
                  } finally {
                    setSavingSettings(false);
                  }
                })();
              }}
              placeholder="50"
              placeholderTextColor="#6b7280"
              keyboardType="numeric"
              style={styles.input}
            />
          </View>
        ) : null}

        <View style={styles.policyField}>
          <Text style={styles.fieldLabel}>Antecedência mínima para cancelamento (horas)</Text>
          <TextInput
            value={
              settings?.cancellation_hours_notice !== null &&
              settings?.cancellation_hours_notice !== undefined
                ? String(settings.cancellation_hours_notice)
                : ""
            }
            onChangeText={(value) => {
              if (settings) {
                setSettings({ ...settings, cancellation_hours_notice: Number(value) || null });
              }
            }}
            onBlur={() => {
              void (async () => {
                if (!token || !settings) return;
                setSavingSettings(true);
                try {
                  const updated = await updateSettings(token, {
                    cancellation_hours_notice: settings.cancellation_hours_notice,
                  });
                  setSettings(updated);
                } catch (caught) {
                  setError(caught instanceof Error ? caught.message : "Erro ao salvar");
                } finally {
                  setSavingSettings(false);
                }
              })();
            }}
            placeholder="24"
            placeholderTextColor="#6b7280"
            keyboardType="numeric"
            style={styles.input}
          />
        </View>

        <View style={styles.policyField}>
          <Text style={styles.fieldLabel}>Antecedência mínima para agendar (minutos)</Text>
          <TextInput
            value={
              settings?.booking_lead_minutes !== null && settings?.booking_lead_minutes !== undefined
                ? String(settings.booking_lead_minutes)
                : ""
            }
            onChangeText={(value) => {
              if (settings) {
                setSettings({ ...settings, booking_lead_minutes: Number(value) || null });
              }
            }}
            onBlur={() => {
              void (async () => {
                if (!token || !settings) return;
                setSavingSettings(true);
                try {
                  const updated = await updateSettings(token, {
                    booking_lead_minutes: settings.booking_lead_minutes,
                  });
                  setSettings(updated);
                } catch (caught) {
                  setError(caught instanceof Error ? caught.message : "Erro ao salvar");
                } finally {
                  setSavingSettings(false);
                }
              })();
            }}
            placeholder="30"
            placeholderTextColor="#6b7280"
            keyboardType="numeric"
            style={styles.input}
          />
        </View>

        <View style={styles.policyRow}>
          <Text style={styles.policyLabel}>Mostrar fotos dos barbeiros</Text>
          <Switch
            value={settings?.show_barber_photos ?? false}
            onValueChange={(value) => {
              void (async () => {
                if (!token) return;
                setSavingSettings(true);
                try {
                  const updated = await updateSettings(token, { show_barber_photos: value });
                  setSettings(updated);
                } catch (caught) {
                  setError(caught instanceof Error ? caught.message : "Erro ao salvar");
                } finally {
                  setSavingSettings(false);
                }
              })();
            }}
            trackColor={{ false: "#2a2a2a", true: "#D4AF37" }}
            thumbColor="#fff"
          />
        </View>

        {settings?.booking_url ? (
          <>
            <Text style={[styles.section, styles.sectionSpaced]}>Link de agendamento</Text>
            <Pressable
              onPress={() => {
                if (settings.booking_url) {
                  void Linking.openURL(settings.booking_url);
                }
              }}
              style={({ pressed }) => [styles.linkCard, pressed && styles.pressed]}
            >
              <Text style={styles.linkText}>{settings.booking_url}</Text>
            </Pressable>
            <Text style={styles.qrLabel}>QR Code:</Text>
            <Text style={styles.qrInfo}>
              https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=
              {encodeURIComponent(settings.booking_url)}
            </Text>
          </>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: 8,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
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
  dayCard: {
    backgroundColor: "#161616",
    borderColor: "#2a2a2a",
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  dayHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayLabel: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  closedRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  closedLabel: {
    color: "#9ca3af",
    fontSize: 13,
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
  barberCard: {
    alignItems: "center",
    backgroundColor: "#161616",
    borderColor: "#2a2a2a",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 14,
  },
  barberInfo: {
    flex: 1,
  },
  barberName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  barberMeta: {
    color: "#9ca3af",
    fontSize: 13,
    marginTop: 2,
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
  error: {
    color: "#f87171",
    marginTop: 8,
    textAlign: "center",
  },
  itemCard: {
    alignItems: "center",
    backgroundColor: "#161616",
    borderColor: "#2a2a2a",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 14,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  itemMeta: {
    color: "#9ca3af",
    fontSize: 13,
    marginTop: 2,
  },
  policyRow: {
    alignItems: "center",
    backgroundColor: "#161616",
    borderColor: "#2a2a2a",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    padding: 14,
  },
  policyLabel: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  policyField: {
    gap: 6,
    marginBottom: 10,
  },
  linkCard: {
    backgroundColor: "#161616",
    borderColor: "#2a2a2a",
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  linkText: {
    color: "#D4AF37",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  qrLabel: {
    color: "#9ca3af",
    fontSize: 13,
    marginTop: 12,
  },
  qrInfo: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 4,
  },
});
