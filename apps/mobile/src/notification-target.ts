export function notificationTargetUrl(data?: Record<string, unknown>) {
  if (!data) return undefined;
  const candidate = data.type === "price-alert" ? data.productUrl : data.url;
  if (typeof candidate !== "string") return undefined;
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}
