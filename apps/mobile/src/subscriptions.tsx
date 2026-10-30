import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { AppState, Platform } from "react-native";
import Purchases, { LOG_LEVEL, type CustomerInfo, type PurchasesOffering, type PurchasesPackage } from "react-native-purchases";
import { useAuth } from "./auth";

const PREMIUM_ENTITLEMENT = "premium";
const PREMIUM_PRODUCT = "pricelens_premium";
const PREMIUM_PACKAGE = "$rc_monthly";

interface SubscriptionsContextValue {
  configured: boolean;
  loading: boolean;
  purchasing: boolean;
  isPremium: boolean;
  offering: PurchasesOffering | null;
  premiumPackage: PurchasesPackage | null;
  price: string;
  error: string;
  refresh: () => Promise<void>;
  clearError: () => void;
  purchasePremium: () => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
}

const SubscriptionsContext = createContext<SubscriptionsContextValue | undefined>(undefined);

export function SubscriptionsProvider({ children }: PropsWithChildren) {
  const auth = useAuth();
  const apiKey = Platform.OS === "android" ? process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY : process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
  const configured = Boolean(apiKey && Platform.OS !== "web");
  const [loading, setLoading] = useState(configured);
  const [purchasing, setPurchasing] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [premiumPackage, setPremiumPackage] = useState<PurchasesPackage | null>(null);
  const [error, setError] = useState("");

  function applyCustomerInfo(info: CustomerInfo) {
    setIsPremium(Boolean(info.entitlements.active[PREMIUM_ENTITLEMENT]));
  }

  async function refreshProducts() {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    setOffering(current);
    const selected = current?.availablePackages.find((item) =>
      item.identifier === PREMIUM_PACKAGE || item.product.identifier === PREMIUM_PRODUCT
    ) ?? current?.monthly ?? null;
    setPremiumPackage(selected);
    if (!current) throw new Error("No RevenueCat offering is active.");
    if (!selected) throw new Error(`The ${PREMIUM_PRODUCT} monthly package is not available.`);
  }

  async function refresh() {
    if (!configured) return;
    setError("");
    try {
      const [info] = await Promise.all([Purchases.getCustomerInfo(), refreshProducts()]);
      applyCustomerInfo(info);
    } catch (cause) {
      setError(subscriptionError(cause));
    }
  }

  useEffect(() => {
    if (!configured || !apiKey) {
      setLoading(false);
      return;
    }
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);
    Purchases.configure({ apiKey });
    const listener = (info: CustomerInfo) => applyCustomerInfo(info);
    Purchases.addCustomerInfoUpdateListener(listener);
    void refresh().finally(() => setLoading(false));
    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });
    return () => {
      appState.remove();
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [configured, apiKey]);

  useEffect(() => {
    if (!configured) return;
    if (auth.user) {
      void Purchases.logIn(auth.user.uid)
        .then(({ customerInfo }) => applyCustomerInfo(customerInfo))
        .catch((cause: unknown) => setError(subscriptionError(cause)));
      return;
    }
    void Purchases.isAnonymous()
      .then((anonymous) => anonymous ? undefined : Purchases.logOut())
      .then((info) => { if (info) applyCustomerInfo(info); })
      .catch((cause: unknown) => setError(subscriptionError(cause)));
  }, [auth.user?.uid, configured]);

  const value = useMemo<SubscriptionsContextValue>(() => ({
    configured,
    loading,
    purchasing,
    isPremium,
    offering,
    premiumPackage,
    price: premiumPackage?.product.priceString ?? "",
    error,
    refresh,
    clearError: () => setError(""),
    purchasePremium: async () => {
      if (isPremium) return true;
      if (!premiumPackage) {
        setError("O produto Premium ainda não está disponível nesta loja.");
        return false;
      }
      setPurchasing(true);
      setError("");
      try {
        const { customerInfo } = await Purchases.purchasePackage(premiumPackage);
        applyCustomerInfo(customerInfo);
        return Boolean(customerInfo.entitlements.active[PREMIUM_ENTITLEMENT]);
      } catch (cause) {
        const message = subscriptionError(cause);
        if (message) setError(message);
        return false;
      } finally {
        setPurchasing(false);
      }
    },
    restorePurchases: async () => {
      setPurchasing(true);
      setError("");
      try {
        const info = await Purchases.restorePurchases();
        applyCustomerInfo(info);
        return Boolean(info.entitlements.active[PREMIUM_ENTITLEMENT]);
      } catch (cause) {
        setError(subscriptionError(cause));
        return false;
      } finally {
        setPurchasing(false);
      }
    }
  }), [configured, error, isPremium, loading, offering, premiumPackage, purchasing]);

  return <SubscriptionsContext.Provider value={value}>{children}</SubscriptionsContext.Provider>;
}

export function useSubscriptions() {
  const context = useContext(SubscriptionsContext);
  if (!context) throw new Error("useSubscriptions must be used inside SubscriptionsProvider");
  return context;
}

function subscriptionError(cause: unknown) {
  if (cause && typeof cause === "object" && "userCancelled" in cause && cause.userCancelled) return "";
  if (cause && typeof cause === "object") {
    const error = cause as {
      underlyingErrorMessage?: unknown;
      userInfo?: { underlyingErrorMessage?: unknown };
    };
    const underlying = error.underlyingErrorMessage ?? error.userInfo?.underlyingErrorMessage;
    if (typeof underlying === "string" && underlying.trim()) return underlying.trim();
  }
  return cause instanceof Error ? cause.message : "Não foi possível comunicar com a loja.";
}
