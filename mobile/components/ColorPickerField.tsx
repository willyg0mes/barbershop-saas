import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const PRESETS = [
  "#D4AF37",
  "#C5A028",
  "#B8860B",
  "#E8D5A3",
  "#1A1A1A",
  "#111111",
  "#2A2A2A",
  "#F5F5F5",
  "#FFFFFF",
  "#8B1E1E",
  "#5C1A1A",
  "#1B3A4B",
  "#0F2C24",
  "#3D2914",
  "#6B4F2A",
  "#4A5568",
];

function normalizeHex(value: string): string {
  const trimmed = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  if (/^[0-9A-Fa-f]{6}$/.test(trimmed)) {
    return `#${trimmed.toUpperCase()}`;
  }
  return trimmed;
}

type ColorPickerFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function ColorPickerField({
  label,
  value,
  onChange,
  placeholder = "#D4AF37",
}: ColorPickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  const preview = useMemo(() => {
    const hex = normalizeHex(value);
    return /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : placeholder;
  }, [value, placeholder]);

  function openPicker() {
    setDraft(value || placeholder);
    setOpen(true);
  }

  function confirm() {
    const hex = normalizeHex(draft);
    onChange(hex);
    setOpen(false);
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#6b7280"
          autoCapitalize="characters"
          autoCorrect={false}
          style={styles.input}
        />
        <Pressable
          onPress={openPicker}
          style={({ pressed }) => [
            styles.swatch,
            { backgroundColor: preview },
            pressed && styles.pressed,
          ]}
          accessibilityLabel={`Escolher cor ${label}`}
        />
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <View style={[styles.previewLarge, { backgroundColor: normalizeHex(draft) || preview }]} />
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={placeholder}
              placeholderTextColor="#6b7280"
              autoCapitalize="characters"
              autoCorrect={false}
              style={styles.input}
            />
            <View style={styles.grid}>
              {PRESETS.map((color) => {
                const active = normalizeHex(draft).toUpperCase() === color.toUpperCase();
                return (
                  <Pressable
                    key={color}
                    onPress={() => setDraft(color)}
                    style={({ pressed }) => [
                      styles.preset,
                      { backgroundColor: color },
                      active && styles.presetActive,
                      pressed && styles.pressed,
                    ]}
                  />
                );
              })}
            </View>
            <View style={styles.actions}>
              <Pressable
                onPress={() => setOpen(false)}
                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
              >
                <Text style={styles.secondaryBtnText}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={confirm}
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
              >
                <Text style={styles.primaryBtnText}>Usar cor</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flex: 1,
    gap: 6,
    minWidth: 96,
  },
  label: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "600",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  input: {
    backgroundColor: "#161616",
    borderColor: "#2a2a2a",
    borderRadius: 12,
    borderWidth: 1,
    color: "#fff",
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  swatch: {
    borderColor: "#3a3a3a",
    borderRadius: 10,
    borderWidth: 1,
    height: 40,
    width: 40,
  },
  pressed: {
    opacity: 0.85,
  },
  backdrop: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.72)",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  sheet: {
    backgroundColor: "#161616",
    borderColor: "#2a2a2a",
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    maxWidth: 360,
    padding: 18,
    width: "100%",
  },
  sheetTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },
  previewLarge: {
    borderColor: "#3a3a3a",
    borderRadius: 14,
    borderWidth: 1,
    height: 56,
    width: "100%",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  preset: {
    borderColor: "#3a3a3a",
    borderRadius: 12,
    borderWidth: 1,
    height: 36,
    width: 36,
  },
  presetActive: {
    borderColor: "#D4AF37",
    borderWidth: 2,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  secondaryBtn: {
    alignItems: "center",
    backgroundColor: "#222",
    borderColor: "#333",
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 12,
  },
  secondaryBtnText: {
    color: "#d1d5db",
    fontSize: 14,
    fontWeight: "700",
  },
  primaryBtn: {
    alignItems: "center",
    backgroundColor: "#D4AF37",
    borderRadius: 999,
    flex: 1,
    paddingVertical: 12,
  },
  primaryBtnText: {
    color: "#111",
    fontSize: 14,
    fontWeight: "700",
  },
});
