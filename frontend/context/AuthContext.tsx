"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService, type LoginInput, type SignupInput } from "@/services/auth.service";
import type { AuthUser } from "@/services/types";
import { portalPathForRole, hasRole as roleMatches } from "@/lib/auth-redirect";
import { getApiError } from "@/lib/api-error";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<AuthUser>;
  signup: (input: SignupInput) => Promise<AuthUser | null>;
  logout: () => Promise<void>;
  hasRole: (roles: readonly string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    authService
      .session()
      .then((response) => {
        if (!cancelled) setUser(response.data?.user ?? null);
      })
      .catch(() => {
        // A missing session is normal on public pages.
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => setUser(null);
    window.addEventListener("optico:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("optico:unauthorized", handleUnauthorized);
  }, []);

  const login = useCallback(
    async (input: LoginInput) => {
      const response = await authService.login(input);
      let nextUser = response.data?.user ?? null;

      // Some deployments return only cookies; ask for the session in that case.
      if (!nextUser) {
        const session = await authService.session();
        nextUser = session.data?.user ?? null;
      }

      if (!nextUser) {
        throw new Error("Login succeeded but the session could not be loaded.");
      }

      setUser(nextUser);
      router.replace(portalPathForRole(nextUser.role));
      return nextUser;
    },
    [router],
  );

  const signup = useCallback(
    async (input: SignupInput) => {
      await authService.signup(input);

      try {
        const response = await authService.login({
          email: input.email,
          password: input.password,
        });
        let nextUser = response.data?.user ?? null;

        if (!nextUser) {
          const session = await authService.session();
          nextUser = session.data?.user ?? null;
        }

        if (nextUser) {
          setUser(nextUser);
          router.replace(portalPathForRole(nextUser.role));
          return nextUser;
        }
      } catch {
        // Account creation is still valid; ask the patient to sign in.
        toast.info("Account created. Please sign in to continue.");
      }

      router.replace("/login?registered=1");
      return null;
    },
    [router],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      toast.error(getApiError(error, "Could not close the session cleanly."));
    } finally {
      setUser(null);
      router.replace("/login");
    }
  }, [router]);

  const hasRole = useCallback(
    (roles: readonly string[]) => roleMatches(user?.role, roles),
    [user?.role],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      signup,
      logout,
      hasRole,
    }),
    [user, isLoading, login, signup, logout, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
