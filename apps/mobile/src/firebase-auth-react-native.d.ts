export {};

declare module "@firebase/auth" {
  export function getReactNativePersistence(
    storage: typeof import("@react-native-async-storage/async-storage").default
  ): import("firebase/auth").Persistence;
}
