export function friendlySubscriptionError(message: string) {
  const normalized = message.trim();
  if (/resolve host|no address associated|unknown host|network|internet|timed? out|connection/i.test(normalized)) {
    return "Sem ligação à loja. Verifica a Internet, desativa temporariamente a VPN ou o DNS privado e tenta novamente.";
  }
  if (/no revenuecat offering|package is not available/i.test(normalized)) {
    return "O plano Premium não está disponível neste momento. Tenta recarregar os planos.";
  }
  return "Não foi possível comunicar com a loja. Tenta novamente.";
}
