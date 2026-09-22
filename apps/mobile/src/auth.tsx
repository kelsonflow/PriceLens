import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApps, initializeApp } from "firebase/app";
import * as FirebaseAuthNative from "firebase/auth";
import {
  getAuth,
  GoogleAuthProvider,
  initializeAuth,
  OAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signOut as firebaseSignOut,
  type Auth,
  type Persistence,
  type User
} from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { Platform } from "react-native";

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  busy: boolean;
  user: User | null;
  error: string;
  appleAvailable: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
};

const configured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
const getReactNativePersistence = (FirebaseAuthNative as unknown as {
  getReactNativePersistence(storage: typeof AsyncStorage): Persistence;
}).getReactNativePersistence;
let authInstance: Auth | null = null;

function firebaseAuth(): Auth | null {
  if (!configured) return null;
  if (authInstance) return authInstance;
  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  try {
    authInstance = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    authInstance = getAuth(app);
  }
  return authInstance;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(configured);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    const auth = firebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    if (Platform.OS === "ios") {
      void import("expo-apple-authentication").then((apple) => apple.isAvailableAsync()).then(setAppleAvailable).catch(() => setAppleAvailable(false));
    }
    return unsubscribe;
  }, []);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (cause) {
      setError(authErrorMessage(cause));
      throw cause;
    } finally {
      setBusy(false);
    }
  }

  const value = useMemo<AuthContextValue>(() => ({
    configured,
    loading,
    busy,
    user,
    error,
    appleAvailable,
    signInWithGoogle: () => run(async () => {
      const auth = requireAuth();
      const { GoogleSignin } = await import("@react-native-google-signin/google-signin");
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
      });
      if (Platform.OS === "android") await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const result = await GoogleSignin.signIn();
      if (result.type !== "success" || !result.data.idToken) return;
      await signInWithCredential(auth, GoogleAuthProvider.credential(result.data.idToken));
    }),
    signInWithApple: () => run(async () => {
      const auth = requireAuth();
      const AppleAuthentication = await import("expo-apple-authentication");
      const Crypto = await import("expo-crypto");
      const rawNonce = Crypto.randomUUID();
      const nonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL
        ],
        nonce
      });
      if (!credential.identityToken) throw new Error("A Apple não devolveu um token de identidade.");
      const provider = new OAuthProvider("apple.com");
      await signInWithCredential(auth, provider.credential({ idToken: credential.identityToken, rawNonce }));
    }),
    signOut: () => run(async () => {
      const auth = requireAuth();
      await firebaseSignOut(auth);
      if (Platform.OS !== "web") {
        const { GoogleSignin } = await import("@react-native-google-signin/google-signin");
        await GoogleSignin.signOut().catch(() => null);
      }
    }),
    deleteAccount: () => run(async () => {
      const auth = requireAuth();
      if (!auth.currentUser) throw new Error("Não existe uma conta autenticada.");
      const token = await auth.currentUser.getIdToken(true);
      const apiBaseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://pricelens-api-44ftuum65a-ew.a.run.app").replace(/\/$/, "");
      const response = await fetch(`${apiBaseUrl}/auth/account`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Não foi possível eliminar a conta no servidor.");
      await firebaseSignOut(auth);
    })
  }), [appleAvailable, busy, error, loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

export async function currentIdToken(): Promise<string | undefined> {
  return firebaseAuth()?.currentUser?.getIdToken() ?? undefined;
}

function requireAuth(): Auth {
  const auth = firebaseAuth();
  if (!auth) throw new Error("Configura as variáveis EXPO_PUBLIC_FIREBASE_* antes de iniciar sessão.");
  return auth;
}

function authErrorMessage(cause: unknown): string {
  if (cause instanceof Error) {
    if (cause.message.includes("DEVELOPER_ERROR")) return "A credencial Google não corresponde ao package ou SHA-1 desta build.";
    if (cause.message.includes("auth/operation-not-allowed")) return "Este método de autenticação ainda não está ativo no Firebase.";
    if (cause.message.includes("auth/requires-recent-login")) return "Inicia sessão novamente antes de eliminar a conta.";
    return cause.message;
  }
  return "Não foi possível concluir a autenticação.";
}
