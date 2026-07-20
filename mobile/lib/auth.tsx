import * as SecureStore from "expo-secure-store";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchMe, login as apiLogin, logout as apiLogout } from "@/lib/api";
import { registerPushToken } from "@/lib/notifications";
import type { User } from "@/lib/types";

const TOKEN_KEY = "auth_token";
const TENANT_KEY = "tenant_slug";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  tenantSlug: string;
  loading: boolean;
  signIn: (tenantSlug: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tenantSlug, setTenantSlug] = useState(
    process.env.EXPO_PUBLIC_DEFAULT_TENANT ?? "dom-corte",
  );
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    const profile = await fetchMe(token);
    setUser(profile);
  }, [token]);

  useEffect(() => {
    async function bootstrap() {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        const storedTenant = await SecureStore.getItemAsync(TENANT_KEY);

        if (storedTenant) {
          setTenantSlug(storedTenant);
        }

        if (storedToken) {
          const profile = await fetchMe(storedToken);
          setToken(storedToken);
          setUser(profile);
          void registerPushToken(storedToken);
        }
      } catch {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    void bootstrap();
  }, []);

  const signIn = useCallback(async (slug: string, email: string, password: string) => {
    const response = await apiLogin(slug, email, password);

    if (!response.user.role || (response.user.role !== "barber" && response.user.role !== "owner")) {
      throw new Error("Apenas barbeiros e donos podem acessar este app.");
    }

    await SecureStore.setItemAsync(TOKEN_KEY, response.token);
    await SecureStore.setItemAsync(TENANT_KEY, slug);

    setToken(response.token);
    setUser(response.user);
    setTenantSlug(slug);

    void registerPushToken(response.token);
  }, []);

  const signOut = useCallback(async () => {
    if (token) {
      try {
        await apiLogout(token);
      } catch {
        // ignore network errors on logout
      }
    }

    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      tenantSlug,
      loading,
      signIn,
      signOut,
      refreshUser,
    }),
    [user, token, tenantSlug, loading, signIn, signOut, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
