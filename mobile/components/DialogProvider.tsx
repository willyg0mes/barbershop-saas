import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export type DialogButton = {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
};

type DialogState = {
  visible: boolean;
  title: string;
  message?: string;
  buttons: DialogButton[];
};

type DialogContextValue = {
  alert: (title: string, message?: string, buttons?: DialogButton[]) => void;
  confirm: (options: {
    title: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
  }) => Promise<boolean>;
};

const DialogContext = createContext<DialogContextValue | null>(null);

const DEFAULT_BUTTONS: DialogButton[] = [{ text: "OK", style: "default" }];

export function DialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState>({
    visible: false,
    title: "",
    message: undefined,
    buttons: DEFAULT_BUTTONS,
  });
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const close = useCallback((resolved?: boolean) => {
    if (resolveRef.current) {
      resolveRef.current(resolved ?? false);
      resolveRef.current = null;
    }
    setState((current) => ({ ...current, visible: false }));
  }, []);

  const alert = useCallback((title: string, message?: string, buttons?: DialogButton[]) => {
    resolveRef.current = null;
    setState({
      visible: true,
      title,
      message,
      buttons: buttons?.length ? buttons : DEFAULT_BUTTONS,
    });
  }, []);

  const confirm = useCallback(
    (options: {
      title: string;
      message?: string;
      confirmText?: string;
      cancelText?: string;
      destructive?: boolean;
    }) =>
      new Promise<boolean>((resolve) => {
        resolveRef.current = resolve;
        setState({
          visible: true,
          title: options.title,
          message: options.message,
          buttons: [
            {
              text: options.cancelText ?? "Cancelar",
              style: "cancel",
              onPress: () => resolve(false),
            },
            {
              text: options.confirmText ?? "Confirmar",
              style: options.destructive ? "destructive" : "default",
              onPress: () => resolve(true),
            },
          ],
        });
      }),
    [],
  );

  const value = useMemo(() => ({ alert, confirm }), [alert, confirm]);

  return (
    <DialogContext.Provider value={value}>
      {children}
      <Modal
        transparent
        animationType="fade"
        visible={state.visible}
        onRequestClose={() => close(false)}
        statusBarTranslucent
      >
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.title}>{state.title}</Text>
            {state.message ? <Text style={styles.message}>{state.message}</Text> : null}
            <View
              style={[
                styles.actions,
                state.buttons.length > 2 ? styles.actionsColumn : styles.actionsRow,
              ]}
            >
              {state.buttons.map((button, index) => {
                const variant = button.style ?? "default";
                return (
                  <Pressable
                    key={`${button.text}-${index}`}
                    onPress={() => {
                      const handler = button.onPress;
                      resolveRef.current = null;
                      setState((current) => ({ ...current, visible: false }));
                      handler?.();
                    }}
                    style={({ pressed }) => [
                      styles.button,
                      variant === "cancel" && styles.buttonCancel,
                      variant === "destructive" && styles.buttonDestructive,
                      variant === "default" && styles.buttonDefault,
                      pressed && styles.buttonPressed,
                      state.buttons.length > 2 && styles.buttonFull,
                    ]}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        variant === "cancel" && styles.buttonTextCancel,
                        variant === "destructive" && styles.buttonTextDestructive,
                        variant === "default" && styles.buttonTextDefault,
                      ]}
                    >
                      {button.text}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within DialogProvider");
  }
  return context;
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.72)",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  card: {
    backgroundColor: "#161616",
    borderColor: "#2a2a2a",
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: 360,
    padding: 20,
    width: "100%",
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },
  message: {
    color: "#9ca3af",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  actions: {
    gap: 10,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: "row",
  },
  actionsColumn: {
    flexDirection: "column",
  },
  button: {
    alignItems: "center",
    borderRadius: 999,
    flex: 1,
    paddingVertical: 12,
  },
  buttonFull: {
    flex: 0,
    width: "100%",
  },
  buttonDefault: {
    backgroundColor: "#D4AF37",
  },
  buttonCancel: {
    backgroundColor: "#222",
    borderColor: "#333",
    borderWidth: 1,
  },
  buttonDestructive: {
    backgroundColor: "#2a1515",
    borderColor: "#7f1d1d",
    borderWidth: 1,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  buttonTextDefault: {
    color: "#111",
  },
  buttonTextCancel: {
    color: "#d1d5db",
  },
  buttonTextDestructive: {
    color: "#fca5a5",
  },
});
