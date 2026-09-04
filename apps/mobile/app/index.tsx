import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { getOfferBadge, rankOffers, type NormalizedOffer, type ProductIdentification } from "@pricelens/shared";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, useColorScheme, useWindowDimensions, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

type Screen = "home" | "results" | "saved" | "plans" | "profile";
type SavedItem = { id: string; kind: "favorite" | "history" | "alert"; title: string; subtitle: string; createdAt: string; offer?: NormalizedOffer };
type AppNotice = { title: string; message: string; tone: "success" | "warning" | "error" };

const DEFAULT_API_BASE_URL = "https://pricelens-api-44ftuum65a-ew.a.run.app";
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/$/, "");

const emptyIdentification: ProductIdentification = {
  id: "pending",
  sourceType: "text",
  name: "",
  visibleFeatures: [],
  confidence: 0,
  createdAt: new Date(0).toISOString()
};

const lightTheme = {
  bg: "#f7f5f0",
  surface: "#ffffff",
  elevated: "#fbfaf7",
  ink: "#111827",
  muted: "#687385",
  subtle: "#8b95a5",
  line: "#e4e0d7",
  primary: "#214ee6",
  primaryStrong: "#1739ae",
  primarySoft: "#eef2ff",
  success: "#087f5b",
  successSoft: "#e9f8f1",
  warning: "#a16207",
  warningSoft: "#fff7df",
  danger: "#c24132",
  dangerSoft: "#fff0ec",
  navy: "#16253f"
};

const darkTheme = {
  bg: "#0f172a",
  surface: "#111c31",
  elevated: "#17243b",
  ink: "#f8fafc",
  muted: "#b7c0ce",
  subtle: "#8fa0b6",
  line: "#2d3a50",
  primary: "#7da2ff",
  primaryStrong: "#a9c0ff",
  primarySoft: "#162850",
  success: "#66d6ae",
  successSoft: "#123126",
  warning: "#f0c15b",
  warningSoft: "#35290e",
  danger: "#ff9b8d",
  dangerSoft: "#3d1714",
  navy: "#0b1220"
};

type Theme = typeof lightTheme;

export default function HomeScreen() {
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? darkTheme : lightTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [screen, setScreen] = useState<Screen>("home");
  const [identification, setIdentification] = useState<ProductIdentification>(emptyIdentification);
  const [productName, setProductName] = useState("");
  const [model, setModel] = useState("");
  const [category, setCategory] = useState("");
  const [imageUri, setImageUri] = useState("");
  const [offers, setOffers] = useState<NormalizedOffer[]>([]);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<AppNotice>({ title: "Pronto", message: "Analisa um produto para comparar ofertas.", tone: "success" });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notifications, setNotifications] = useState(false);

  const isCompact = width < 380;
  const rankedOffers = useMemo(() => rankOffers(offers), [offers]);
  const favorites = savedItems.filter((item) => item.kind === "favorite");
  const history = savedItems.filter((item) => item.kind === "history");
  const alerts = savedItems.filter((item) => item.kind === "alert");

  const remember = useCallback((kind: SavedItem["kind"], title: string, subtitle: string, offer?: NormalizedOffer) => {
    const item: SavedItem = { id: `${kind}_${offer?.id ?? Date.now()}`, kind, title, subtitle, offer, createdAt: new Date().toISOString() };
    setSavedItems((items) => [item, ...items.filter((existing) => existing.id !== item.id)]);
  }, []);

  async function pickFromCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setNotice({ title: "Permissão necessária", message: "Ativa a câmara para analisar produtos por fotografia.", tone: "warning" });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.82, allowsEditing: false });
    await handleImageResult(result);
  }

  async function pickFromGallery() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setNotice({ title: "Permissão necessária", message: "Ativa o acesso às fotografias para escolher uma imagem.", tone: "warning" });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.82, allowsEditing: false, mediaTypes: ImagePicker.MediaTypeOptions.Images });
    await handleImageResult(result);
  }

  async function handleImageResult(result: ImagePicker.ImagePickerResult) {
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setImageUri(asset.uri);
    setLoading(true);
    setNotice({ title: "A analisar", message: "A identificar produto com a API configurada.", tone: "success" });
    try {
      if (!asset.base64) {
        throw new Error("A fotografia não trouxe dados suficientes para análise.");
      }

      const next = await api<ProductIdentification>("/product-identifications/image", { imageBase64: asset.base64, mimeType: asset.mimeType ?? "image/jpeg", country: "PT", currency: "EUR" });
      if (!hasUsefulIdentification(next)) {
        setIdentification({ ...emptyIdentification, sourceType: "image", imageUrl: asset.uri, createdAt: new Date().toISOString() });
        setProductName("");
        setModel("");
        setCategory("");
        setOffers([]);
        setNotice({ title: "Produto não identificado", message: "A API respondeu, mas não devolveu nome, marca ou modelo suficientes. Tenta outra foto com a embalagem mais nítida.", tone: "warning" });
        return;
      }
      applyIdentification(next);
      remember("history", next.name, "Identificado por imagem");
      setConfirmOpen(true);
    } catch (error) {
      setIdentification({ ...emptyIdentification, sourceType: "image", imageUrl: asset.uri, createdAt: new Date().toISOString() });
      setOffers([]);
      setNotice({ title: "API indisponível", message: error instanceof Error ? error.message : "Não consegui ligar à API de identificação. Confirma o deploy e tenta novamente.", tone: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function identifyFromText() {
    const query = productName.trim();
    if (!query) {
      setNotice({ title: "Pesquisa vazia", message: "Escreve o nome, marca ou modelo para pesquisar manualmente.", tone: "warning" });
      return;
    }
    setLoading(true);
    setNotice({ title: "A pesquisar", message: "A preparar a comparação do produto.", tone: "success" });
    try {
      const next = await api<ProductIdentification>("/product-identifications/text", { query, country: "PT", currency: "EUR" });
      applyIdentification(next);
      remember("history", next.name || query, "Pesquisa por texto");
      setConfirmOpen(true);
    } catch (error) {
      applyIdentification({ ...emptyIdentification, id: `manual_${Date.now()}`, name: query, model, category, sourceType: "text", confidence: 0, createdAt: new Date().toISOString() });
      setNotice({ title: "Pesquisa manual", message: error instanceof Error ? `A API não respondeu: ${error.message}` : "A API não respondeu. Podes ajustar os campos e tentar comparar.", tone: "warning" });
      setConfirmOpen(true);
    } finally {
      setLoading(false);
    }
  }

  async function compareOffers() {
    setConfirmOpen(false);
    setLoading(true);
    setScreen("results");
    setNotice({ title: "A comparar", message: "A ordenar ofertas por preço total e confiança.", tone: "success" });
    try {
      const response = await api<{ results: NormalizedOffer[] }>("/searches/offers", { query: productName, model, category, country: "PT", currency: "EUR", condition: "any", maxPrice: 1500, freeShippingOnly: false });
      setOffers(response.results);
      setNotice({ title: "Resultados prontos", message: response.results.length > 0 ? `${response.results.length} ofertas encontradas para comparar.` : "A API não encontrou ofertas reais para este produto.", tone: response.results.length > 0 ? "success" : "warning" });
    } catch (error) {
      setOffers([]);
      setNotice({ title: "Sem ofertas reais", message: error instanceof Error ? error.message : "A API de preços não respondeu. Tenta novamente depois do deploy.", tone: "error" });
    } finally {
      setLoading(false);
    }
  }

function applyIdentification(next: ProductIdentification) {
    setIdentification(next);
    setProductName(next.name);
    setModel(next.model ?? "");
    setCategory(next.category ?? "");
  }

  function saveFavorite(offer: NormalizedOffer) {
    remember("favorite", offer.title, `${offer.storeName} · ${offer.totalPrice.toFixed(2)} ${offer.currency}`, offer);
    setNotice({ title: "Guardado", message: "Oferta adicionada aos favoritos.", tone: "success" });
  }

  function createAlert(offer: NormalizedOffer) {
    remember("alert", offer.title, `Avisar abaixo de ${(offer.totalPrice - 25).toFixed(2)} ${offer.currency}`, offer);
    setNotice({ title: "Alerta criado", message: "Guardámos um objetivo de preço para esta oferta.", tone: "success" });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.shell}>
          <Header styles={styles} theme={theme} />
          <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 104 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {screen === "home" && <HomeView styles={styles} theme={theme} isCompact={isCompact} productName={productName} setProductName={setProductName} imageUri={imageUri} confidence={identification.confidence} loading={loading} notice={notice} onCamera={pickFromCamera} onGallery={pickFromGallery} onSearch={identifyFromText} />}
            {screen === "results" && <ResultsView styles={styles} theme={theme} productName={productName} model={model} category={category} offers={rankedOffers} loading={loading} notice={notice} onFavorite={saveFavorite} onAlert={createAlert} />}
            {screen === "saved" && <SavedView styles={styles} favorites={favorites} history={history} alerts={alerts} />}
            {screen === "plans" && <PlansView styles={styles} theme={theme} />}
            {screen === "profile" && <ProfileView styles={styles} theme={theme} notifications={notifications} setNotifications={setNotifications} />}
          </ScrollView>
          <BottomTabs styles={styles} theme={theme} active={screen} onChange={setScreen} />
          <ConfirmSheet styles={styles} theme={theme} visible={confirmOpen} productName={productName} setProductName={setProductName} model={model} setModel={setModel} category={category} setCategory={setCategory} identification={identification} imageUri={imageUri} onClose={() => setConfirmOpen(false)} onCompare={compareOffers} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

async function api<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`API ${path} falhou com estado ${response.status}`);
  return response.json() as Promise<T>;
}

function hasUsefulIdentification(identification: ProductIdentification) {
  return Boolean(identification.name?.trim() || identification.brand?.trim() || identification.model?.trim());
}

function Header({ styles, theme }: { styles: ReturnType<typeof createStyles>; theme: Theme }) {
  return (
    <View style={styles.header}>
      <View style={styles.brandWrap} accessible accessibilityRole="header" accessibilityLabel="PriceLens">
        <View style={styles.logo}><Ionicons name="search" size={18} color="#fff" /></View>
        <View>
          <Text style={styles.brand}>PriceLens</Text>
          <Text style={styles.brandSub}>Compra com clareza</Text>
        </View>
      </View>
      <Pressable style={styles.headerIcon} accessibilityRole="button" accessibilityLabel="Segurança da conta">
        <Ionicons name="shield-checkmark-outline" size={21} color={theme.ink} />
      </Pressable>
    </View>
  );
}

function HomeView(props: { styles: ReturnType<typeof createStyles>; theme: Theme; isCompact: boolean; productName: string; setProductName: (value: string) => void; imageUri: string; confidence: number; loading: boolean; notice: AppNotice; onCamera: () => void; onGallery: () => void; onSearch: () => void }) {
  const { styles, theme } = props;
  return (
    <View style={styles.stack}>
      <Text style={styles.eyebrow}>Gemini + Google Vision</Text>
      <Text style={[styles.heroTitle, props.isCompact && styles.heroTitleCompact]}>Encontra o melhor preço antes de comprar.</Text>
      <Text style={styles.heroText}>Fotografa, confirma e compara ofertas por preço total, confiança da loja e correspondência do produto.</Text>
      <ScannerCard styles={styles} theme={theme} imageUri={props.imageUri} confidence={props.confidence} onPress={props.onCamera} />
      <View style={styles.actionGrid}>
        <Button styles={styles} theme={theme} label={props.loading ? "A analisar" : "Usar câmara"} icon="camera-outline" variant="primary" loading={props.loading} onPress={props.onCamera} />
        <Button styles={styles} theme={theme} label="Galeria" icon="image-outline" variant="secondary" onPress={props.onGallery} />
      </View>
      <View style={styles.searchCard}>
        <Text style={styles.inputLabel}>Pesquisa manual</Text>
        <View style={styles.searchInput}>
          <Ionicons name="search-outline" size={20} color={theme.muted} />
          <TextInput value={props.productName} onChangeText={props.setProductName} placeholder="Nome ou modelo" placeholderTextColor={theme.subtle} style={styles.input} returnKeyType="search" onSubmitEditing={props.onSearch} accessibilityLabel="Pesquisar produto por nome ou modelo" />
        </View>
        <Button styles={styles} theme={theme} label="Comparar este produto" icon="arrow-forward-outline" variant="primary" onPress={props.onSearch} />
      </View>
      <Notice styles={styles} theme={theme} notice={props.notice} />
      <View style={styles.benefitGrid}>
        <Benefit styles={styles} theme={theme} icon="receipt-outline" title="Preço total" text="Produto e envio no mesmo cálculo." />
        <Benefit styles={styles} theme={theme} icon="shield-checkmark-outline" title="Confiança" text="Sinais de loja e compatibilidade visíveis." />
        <Benefit styles={styles} theme={theme} icon="notifications-outline" title="Alertas" text="Guarda objetivos de preço para seguir depois." />
      </View>
    </View>
  );
}

function ScannerCard({ styles, theme, imageUri, confidence, onPress }: { styles: ReturnType<typeof createStyles>; theme: Theme; imageUri: string; confidence?: number; onPress: () => void }) {
  return (
    <Pressable style={styles.scannerCard} onPress={onPress} accessibilityRole="button" accessibilityLabel="Abrir câmara para analisar produto">
      {imageUri ? <Image source={{ uri: imageUri }} style={styles.heroImage as never} /> : <View style={styles.scannerEmpty}><Ionicons name="scan-outline" size={44} color="#fff" /></View>}
      <View style={styles.scannerOverlay} />
      <View style={styles.scannerTop}>
        <Text style={styles.scannerLabel}>Scanner</Text>
        <View style={styles.scannerPill}><Ionicons name="sparkles-outline" size={14} color={theme.ink} /><Text style={styles.scannerPillText}>{typeof confidence === "number" && confidence > 0 ? `IA ${confidence}%` : "IA pronta"}</Text></View>
      </View>
      <View style={styles.scanFrame}>
        <View style={styles.scanCornerTop} />
        <View style={styles.scanLine} />
        <View style={styles.scanCornerBottom} />
      </View>
      <Text style={styles.scannerHint}>Alinha o produto no enquadramento</Text>
    </Pressable>
  );
}

function ResultsView({ styles, theme, productName, model, category, offers, loading, notice, onFavorite, onAlert }: { styles: ReturnType<typeof createStyles>; theme: Theme; productName: string; model: string; category: string; offers: NormalizedOffer[]; loading: boolean; notice: AppNotice; onFavorite: (offer: NormalizedOffer) => void; onAlert: (offer: NormalizedOffer) => void }) {
  return (
    <View style={styles.stack}>
      <Text style={styles.eyebrow}>Resultados</Text>
      <Text style={styles.sectionTitle}>{productName}</Text>
      <Text style={styles.subtitle}>{[model, category, "Portugal", "EUR"].filter(Boolean).join(" · ")}</Text>
      <Notice styles={styles} theme={theme} notice={notice} />
      <View style={styles.filtersRow} accessibilityLabel="Filtros rápidos">
        <Chip styles={styles} label="Todos" active />
        <Chip styles={styles} label="Novo" />
        <Chip styles={styles} label="Envio grátis" />
      </View>
      {loading ? <LoadingState styles={styles} theme={theme} /> : offers.length === 0 ? <EmptyState styles={styles} theme={theme} text="Ainda não há ofertas para este produto." /> : offers.map((offer) => <OfferCard key={offer.id} styles={styles} theme={theme} offer={offer} offers={offers} onFavorite={() => onFavorite(offer)} onAlert={() => onAlert(offer)} />)}
    </View>
  );
}

function OfferCard({ styles, theme, offer, offers, onFavorite, onAlert }: { styles: ReturnType<typeof createStyles>; theme: Theme; offer: NormalizedOffer; offers: NormalizedOffer[]; onFavorite: () => void; onAlert: () => void }) {
  const badge = getOfferBadge(offer, offers);
  return (
    <View style={styles.offerCard}>
      <Image source={{ uri: offer.imageUrl }} style={styles.offerImage as never} />
      <View style={styles.offerInfo}>
        <View style={styles.badgeRow}>
          {badge && <Text style={styles.badge}>{badge}</Text>}
          {offer.isMock && <Text style={styles.mockBadge}>Demo</Text>}
        </View>
        <Text style={styles.offerTitle} numberOfLines={2}>{offer.title}</Text>
        <Text style={styles.offerStore} numberOfLines={1}>{offer.storeName} · Match {offer.matchConfidence}% · Loja {offer.storeTrustScore}%</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{offer.totalPrice.toFixed(2)} {offer.currency}</Text>
          <Text style={styles.shipping}>{offer.shippingPrice === 0 ? "Envio grátis" : `+ ${offer.shippingPrice.toFixed(2)} envio`}</Text>
        </View>
        <View style={styles.rowActions}>
          <Pressable style={styles.buyButton} onPress={() => Linking.openURL(offer.productUrl)} accessibilityRole="link" accessibilityLabel={`Comprar ${offer.title}`}>
            <Text style={styles.buyButtonText}>Comprar</Text>
          </Pressable>
          <Pressable style={styles.iconAction} onPress={onFavorite} accessibilityRole="button" accessibilityLabel="Guardar oferta nos favoritos"><Ionicons name="heart-outline" size={19} color={theme.ink} /></Pressable>
          <Pressable style={styles.iconAction} onPress={onAlert} accessibilityRole="button" accessibilityLabel="Criar alerta de preço"><Ionicons name="notifications-outline" size={19} color={theme.ink} /></Pressable>
        </View>
      </View>
    </View>
  );
}

function SavedView({ styles, favorites, history, alerts }: { styles: ReturnType<typeof createStyles>; favorites: SavedItem[]; history: SavedItem[]; alerts: SavedItem[] }) {
  return (
    <View style={styles.stack}>
      <Text style={styles.eyebrow}>Área pessoal</Text>
      <Text style={styles.sectionTitle}>Guardados e histórico</Text>
      <SavedGroup styles={styles} title="Favoritos" items={favorites} empty="Ainda não guardaste ofertas." />
      <SavedGroup styles={styles} title="Alertas" items={alerts} empty="Ainda não criaste alertas." />
      <SavedGroup styles={styles} title="Histórico" items={history} empty="As pesquisas aparecem aqui." />
    </View>
  );
}

function SavedGroup({ styles, title, items, empty }: { styles: ReturnType<typeof createStyles>; title: string; items: SavedItem[]; empty: string }) {
  return (
    <View style={styles.groupCard}>
      <Text style={styles.groupTitle}>{title}</Text>
      {items.length === 0 ? <Text style={styles.emptyInline}>{empty}</Text> : items.map((item) => <View key={item.id} style={styles.savedRow}><Text style={styles.savedTitle}>{item.title}</Text><Text style={styles.savedSubtitle}>{item.subtitle}</Text></View>)}
    </View>
  );
}

function PlansView({ styles, theme }: { styles: ReturnType<typeof createStyles>; theme: Theme }) {
  return (
    <View style={styles.stack}>
      <Text style={styles.eyebrow}>Planos</Text>
      <Text style={styles.sectionTitle}>Valor claro antes da subscrição.</Text>
      <PlanCard styles={styles} theme={theme} title="Starter" tag="Incluído" items={["Comparação por texto", "Análise por imagem", "Histórico básico"]} />
      <PlanCard styles={styles} theme={theme} title="Premium" tag="Recomendado" featured items={["Alertas de preço", "Preferências avançadas", "Compras recorrentes mais rápidas"]} />
      <Notice styles={styles} theme={theme} notice={{ title: "Transparência", message: "Os preços finais dos planos ainda não estão definidos nesta versão.", tone: "warning" }} />
    </View>
  );
}

function PlanCard({ styles, theme, title, tag, items, featured }: { styles: ReturnType<typeof createStyles>; theme: Theme; title: string; tag: string; items: string[]; featured?: boolean }) {
  return (
    <View style={[styles.planCard, featured && styles.planFeatured]}>
      <View style={styles.planHeader}>
        <Text style={styles.planTitle}>{title}</Text>
        <Text style={featured ? styles.badge : styles.mockBadge}>{tag}</Text>
      </View>
      {items.map((item) => <View key={item} style={styles.planItem}><Ionicons name="checkmark-circle-outline" size={18} color={featured ? theme.primary : theme.success} /><Text style={styles.planText}>{item}</Text></View>)}
      <Button styles={styles} theme={theme} label={featured ? "Ver Premium" : "Começar"} icon="arrow-forward-outline" variant={featured ? "primary" : "secondary"} onPress={() => Alert.alert("Plano", "Fluxo de subscrição ainda não está ligado a pagamentos.")} />
    </View>
  );
}

function ProfileView({ styles, theme, notifications, setNotifications }: { styles: ReturnType<typeof createStyles>; theme: Theme; notifications: boolean; setNotifications: (value: boolean) => void }) {
  return (
    <View style={styles.stack}>
      <Text style={styles.eyebrow}>Perfil</Text>
      <Text style={styles.sectionTitle}>Preferências de compra</Text>
      <View style={styles.groupCard}>
        <Field styles={styles} theme={theme} label="País" value="PT" onChangeText={() => undefined} />
        <Field styles={styles} theme={theme} label="Moeda" value="EUR" onChangeText={() => undefined} />
        <Field styles={styles} theme={theme} label="Idioma" value="pt-PT" onChangeText={() => undefined} />
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.groupTitle}>Notificações</Text>
            <Text style={styles.savedSubtitle}>Alertas de preço e atualizações importantes.</Text>
          </View>
          <Switch value={notifications} onValueChange={setNotifications} trackColor={{ false: theme.line, true: theme.primarySoft }} thumbColor={notifications ? theme.primary : theme.subtle} accessibilityLabel="Ativar notificações" />
        </View>
      </View>
    </View>
  );
}

function ConfirmSheet(props: { styles: ReturnType<typeof createStyles>; theme: Theme; visible: boolean; productName: string; setProductName: (value: string) => void; model: string; setModel: (value: string) => void; category: string; setCategory: (value: string) => void; identification: ProductIdentification; imageUri: string; onClose: () => void; onCompare: () => void }) {
  const { styles, theme } = props;
  return (
    <Modal visible={props.visible} transparent animationType="slide" onRequestClose={props.onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.eyebrow}>Confirmação</Text>
              <Text style={styles.sheetTitle}>Confirma o produto</Text>
            </View>
            <Pressable style={styles.headerIcon} onPress={props.onClose} accessibilityRole="button" accessibilityLabel="Fechar confirmação"><Ionicons name="close-outline" size={24} color={theme.ink} /></Pressable>
          </View>
          {props.imageUri ? <Image source={{ uri: props.imageUri }} style={styles.sheetImage as never} /> : <View style={styles.sheetImageEmpty}><Ionicons name="cube-outline" size={34} color={theme.muted} /></View>}
          <Field styles={styles} theme={theme} label="Nome do produto" value={props.productName} onChangeText={props.setProductName} />
          <Field styles={styles} theme={theme} label="Modelo" value={props.model} onChangeText={props.setModel} />
          <Field styles={styles} theme={theme} label="Categoria" value={props.category} onChangeText={props.setCategory} />
          <View style={styles.chips}>{props.identification.visibleFeatures.map((feature) => <Text key={feature} style={styles.chip}>{feature}</Text>)}</View>
          <Button styles={styles} theme={theme} label="Comparar preços" icon="checkmark-circle-outline" variant="primary" onPress={props.onCompare} />
        </View>
      </View>
    </Modal>
  );
}

function BottomTabs({ styles, theme, active, onChange }: { styles: ReturnType<typeof createStyles>; theme: Theme; active: Screen; onChange: (screen: Screen) => void }) {
  const tabs: Array<{ screen: Screen; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
    { screen: "home", label: "Início", icon: "scan-outline" },
    { screen: "results", label: "Resultados", icon: "pricetag-outline" },
    { screen: "saved", label: "Guardados", icon: "bookmark-outline" },
    { screen: "plans", label: "Planos", icon: "diamond-outline" },
    { screen: "profile", label: "Perfil", icon: "person-outline" }
  ];

  return (
    <View style={styles.tabs} accessibilityRole="tablist">
      {tabs.map((tab) => {
        const selected = active === tab.screen;
        return (
          <Pressable key={tab.screen} style={[styles.tabItem, selected && styles.tabItemActive]} onPress={() => onChange(tab.screen)} accessibilityRole="tab" accessibilityState={{ selected }} accessibilityLabel={tab.label}>
            <Ionicons name={tab.icon} size={20} color={selected ? "#fff" : theme.muted} />
            <Text style={selected ? styles.tabLabelActive : styles.tabLabel}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Field({ styles, theme, label, value, onChangeText }: { styles: ReturnType<typeof createStyles>; theme: Theme; label: string; value: string; onChangeText: (value: string) => void }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} style={styles.field} placeholderTextColor={theme.subtle} accessibilityLabel={label} />
    </View>
  );
}

function Button({ styles, theme, label, icon, variant, loading, onPress }: { styles: ReturnType<typeof createStyles>; theme: Theme; label: string; icon: keyof typeof Ionicons.glyphMap; variant: "primary" | "secondary"; loading?: boolean; onPress: () => void }) {
  const primary = variant === "primary";
  return (
    <Pressable style={[styles.button, primary ? styles.primaryButton : styles.secondaryButton, loading && styles.disabledButton]} onPress={loading ? undefined : onPress} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ busy: Boolean(loading), disabled: Boolean(loading) }}>
      {loading ? <ActivityIndicator color={primary ? "#fff" : theme.primary} /> : <Ionicons name={icon} size={20} color={primary ? "#fff" : theme.ink} />}
      <Text style={primary ? styles.primaryButtonText : styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function Notice({ styles, theme, notice }: { styles: ReturnType<typeof createStyles>; theme: Theme; notice: AppNotice }) {
  const icon = notice.tone === "error" ? "alert-circle-outline" : notice.tone === "warning" ? "information-circle-outline" : "checkmark-circle-outline";
  return (
    <View style={[styles.notice, notice.tone === "warning" && styles.noticeWarning, notice.tone === "error" && styles.noticeError]} accessibilityRole="summary">
      <Ionicons name={icon} size={20} color={notice.tone === "success" ? theme.success : notice.tone === "warning" ? theme.warning : theme.danger} />
      <View style={styles.noticeCopy}>
        <Text style={styles.noticeTitle}>{notice.title}</Text>
        <Text style={styles.noticeText}>{notice.message}</Text>
      </View>
    </View>
  );
}

function Benefit({ styles, theme, icon, title, text }: { styles: ReturnType<typeof createStyles>; theme: Theme; icon: keyof typeof Ionicons.glyphMap; title: string; text: string }) {
  return (
    <View style={styles.benefit}>
      <View style={styles.benefitIcon}><Ionicons name={icon} size={18} color={theme.primary} /></View>
      <View style={styles.benefitCopy}>
        <Text style={styles.benefitTitle}>{title}</Text>
        <Text style={styles.benefitText}>{text}</Text>
      </View>
    </View>
  );
}

function Chip({ styles, label, active }: { styles: ReturnType<typeof createStyles>; label: string; active?: boolean }) {
  return <Text style={[styles.filterChip, active && styles.filterChipActive]}>{label}</Text>;
}

function LoadingState({ styles, theme }: { styles: ReturnType<typeof createStyles>; theme: Theme }) {
  return <View style={styles.empty}><ActivityIndicator color={theme.primary} /><Text style={styles.emptyTitle}>A procurar melhores ofertas</Text><Text style={styles.emptyText}>Isto pode demorar alguns segundos.</Text></View>;
}

function EmptyState({ styles, theme, text }: { styles: ReturnType<typeof createStyles>; theme: Theme; text: string }) {
  return <View style={styles.empty}><Ionicons name="search-outline" size={28} color={theme.primary} /><Text style={styles.emptyTitle}>{text}</Text><Text style={styles.emptyText}>Experimenta outra pesquisa ou usa uma fotografia mais nítida.</Text></View>;
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.bg },
    keyboard: { flex: 1 },
    shell: { flex: 1, backgroundColor: theme.bg },
    content: { paddingHorizontal: 18, paddingTop: 14, gap: 18 },
    stack: { gap: 14 },
    header: {
      marginHorizontal: 18,
      marginTop: 8,
      minHeight: 60,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.line,
      backgroundColor: theme.surface,
      padding: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      shadowColor: "#111827",
      shadowOpacity: 0.08,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
      elevation: 4
    },
    brandWrap: { flexDirection: "row", alignItems: "center", gap: 10 },
    logo: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: theme.ink },
    brand: { fontSize: 18, fontWeight: "900", color: theme.ink },
    brandSub: { fontSize: 12, fontWeight: "700", color: theme.muted, marginTop: 1 },
    headerIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.line, backgroundColor: theme.elevated },
    eyebrow: { color: theme.primary, fontSize: 12, fontWeight: "900", textTransform: "uppercase", marginTop: 4 },
    heroTitle: { color: theme.ink, fontSize: 40, lineHeight: 42, fontWeight: "900" },
    heroTitleCompact: { fontSize: 35, lineHeight: 37 },
    heroText: { color: theme.muted, fontSize: 17, lineHeight: 26 },
    sectionTitle: { color: theme.ink, fontSize: 30, lineHeight: 35, fontWeight: "900" },
    subtitle: { color: theme.muted, fontSize: 15, lineHeight: 22 },
    scannerCard: { position: "relative", overflow: "hidden", height: 372, borderRadius: 22, backgroundColor: theme.navy },
    scannerEmpty: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center", backgroundColor: theme.navy },
    heroImage: { width: "100%", height: "100%" },
    scannerOverlay: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(8,15,28,0.5)" },
    scannerTop: { position: "absolute", top: 18, left: 18, right: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    scannerLabel: { color: "#fff", fontWeight: "900", textTransform: "uppercase", fontSize: 12 },
    scannerPill: { borderRadius: 999, backgroundColor: "rgba(255,255,255,0.94)", paddingHorizontal: 10, paddingVertical: 7, flexDirection: "row", alignItems: "center", gap: 6 },
    scannerPillText: { color: lightTheme.ink, fontWeight: "900", fontSize: 12 },
    scanFrame: { position: "absolute", left: 38, right: 38, top: 135, height: 118, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.84)", justifyContent: "center" },
    scanCornerTop: { position: "absolute", top: -1, left: -1, width: 34, height: 34, borderTopWidth: 3, borderLeftWidth: 3, borderColor: "#fff", borderTopLeftRadius: 12 },
    scanCornerBottom: { position: "absolute", bottom: -1, right: -1, width: 34, height: 34, borderBottomWidth: 3, borderRightWidth: 3, borderColor: "#fff", borderBottomRightRadius: 12 },
    scanLine: { height: 2, backgroundColor: "#85efc3" },
    scannerHint: { position: "absolute", left: 28, right: 28, bottom: 26, color: "rgba(255,255,255,0.92)", fontWeight: "800", textAlign: "center" },
    actionGrid: { flexDirection: "row", gap: 10 },
    searchCard: { borderRadius: 14, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, padding: 14, gap: 12 },
    searchInput: { minHeight: 54, borderRadius: 12, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.elevated, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14 },
    input: { flex: 1, color: theme.ink, fontSize: 16, minHeight: 48 },
    inputLabel: { color: theme.muted, fontSize: 13, fontWeight: "800" },
    fieldWrap: { gap: 7 },
    field: { minHeight: 52, borderRadius: 12, borderWidth: 1, borderColor: theme.line, paddingHorizontal: 14, color: theme.ink, backgroundColor: theme.elevated, fontSize: 16 },
    button: { flex: 1, minHeight: 52, borderRadius: 12, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, paddingHorizontal: 14 },
    primaryButton: { backgroundColor: theme.primary },
    secondaryButton: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line },
    disabledButton: { opacity: 0.64 },
    primaryButtonText: { color: "#fff", fontWeight: "900", fontSize: 15 },
    secondaryButtonText: { color: theme.ink, fontWeight: "900", fontSize: 15 },
    notice: { borderRadius: 14, backgroundColor: theme.successSoft, padding: 13, flexDirection: "row", gap: 10, borderWidth: 1, borderColor: "rgba(8,127,91,0.16)" },
    noticeWarning: { backgroundColor: theme.warningSoft, borderColor: "rgba(161,98,7,0.18)" },
    noticeError: { backgroundColor: theme.dangerSoft, borderColor: "rgba(194,65,50,0.18)" },
    noticeCopy: { flex: 1, gap: 2 },
    noticeTitle: { color: theme.ink, fontWeight: "900", fontSize: 14 },
    noticeText: { color: theme.muted, lineHeight: 20 },
    benefitGrid: { gap: 10 },
    benefit: { borderRadius: 14, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, padding: 13, flexDirection: "row", alignItems: "center", gap: 12 },
    benefitIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: theme.primarySoft, alignItems: "center", justifyContent: "center" },
    benefitCopy: { flex: 1 },
    benefitTitle: { color: theme.ink, fontWeight: "900" },
    benefitText: { color: theme.muted, marginTop: 2, lineHeight: 20 },
    filtersRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    filterChip: { borderRadius: 999, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, color: theme.muted, paddingHorizontal: 12, paddingVertical: 8, fontWeight: "800" },
    filterChipActive: { backgroundColor: theme.ink, borderColor: theme.ink, color: "#fff" },
    offerCard: { borderRadius: 16, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line, padding: 12, flexDirection: "row", gap: 12 },
    offerImage: { width: 104, height: 126, borderRadius: 12, backgroundColor: theme.elevated },
    offerInfo: { flex: 1, minWidth: 0 },
    badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    badge: { alignSelf: "flex-start", borderRadius: 999, backgroundColor: theme.warningSoft, color: theme.warning, paddingHorizontal: 8, paddingVertical: 5, fontSize: 11, fontWeight: "900" },
    mockBadge: { alignSelf: "flex-start", borderRadius: 999, backgroundColor: theme.primarySoft, color: theme.primary, paddingHorizontal: 8, paddingVertical: 5, fontSize: 11, fontWeight: "900" },
    offerTitle: { color: theme.ink, fontSize: 16, lineHeight: 20, fontWeight: "900", marginTop: 8 },
    offerStore: { color: theme.muted, marginTop: 4, fontSize: 13 },
    priceRow: { marginTop: 8 },
    price: { color: theme.ink, fontSize: 22, fontWeight: "900" },
    shipping: { color: theme.success, fontSize: 12, fontWeight: "800", marginTop: 2 },
    rowActions: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
    buyButton: { minHeight: 40, borderRadius: 10, backgroundColor: theme.primary, paddingHorizontal: 14, alignItems: "center", justifyContent: "center" },
    buyButtonText: { color: "#fff", fontWeight: "900" },
    iconAction: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: theme.line, alignItems: "center", justifyContent: "center", backgroundColor: theme.elevated },
    groupCard: { borderRadius: 16, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, padding: 16, gap: 12 },
    groupTitle: { color: theme.ink, fontSize: 17, fontWeight: "900" },
    emptyInline: { color: theme.muted, lineHeight: 21 },
    savedRow: { borderRadius: 12, backgroundColor: theme.elevated, padding: 12, borderWidth: 1, borderColor: theme.line },
    savedTitle: { color: theme.ink, fontWeight: "900" },
    savedSubtitle: { color: theme.muted, marginTop: 4, lineHeight: 20 },
    planCard: { borderRadius: 16, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, padding: 16, gap: 12 },
    planFeatured: { borderColor: theme.primary, backgroundColor: theme.primarySoft },
    planHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
    planTitle: { color: theme.ink, fontWeight: "900", fontSize: 22 },
    planItem: { flexDirection: "row", alignItems: "center", gap: 8 },
    planText: { flex: 1, color: theme.muted, lineHeight: 21, fontWeight: "700" },
    switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingTop: 4 },
    switchCopy: { flex: 1 },
    modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(4,8,18,0.46)" },
    sheet: { maxHeight: "92%", borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: theme.surface, padding: 18, gap: 12 },
    sheetHandle: { alignSelf: "center", width: 44, height: 5, borderRadius: 999, backgroundColor: theme.line, marginBottom: 2 },
    sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
    sheetTitle: { color: theme.ink, fontSize: 25, fontWeight: "900" },
    sheetImage: { width: "100%", height: 160, borderRadius: 14, backgroundColor: theme.elevated },
    sheetImageEmpty: { width: "100%", height: 160, borderRadius: 14, backgroundColor: theme.elevated, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.line },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: { borderRadius: 999, backgroundColor: theme.primarySoft, paddingHorizontal: 10, paddingVertical: 7, color: theme.primary, fontWeight: "800", fontSize: 12 },
    empty: { minHeight: 220, borderRadius: 16, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line, alignItems: "center", justifyContent: "center", padding: 22 },
    emptyTitle: { color: theme.ink, fontWeight: "900", fontSize: 18, textAlign: "center", marginTop: 12 },
    emptyText: { color: theme.muted, textAlign: "center", marginTop: 6, lineHeight: 20 },
    tabs: {
      position: "absolute",
      left: 12,
      right: 12,
      bottom: Platform.OS === "ios" ? 12 : 10,
      minHeight: 70,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.line,
      backgroundColor: theme.surface,
      padding: 8,
      flexDirection: "row",
      gap: 5,
      shadowColor: "#111827",
      shadowOpacity: 0.12,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 8
    },
    tabItem: { flex: 1, borderRadius: 13, alignItems: "center", justifyContent: "center", gap: 3, minHeight: 54 },
    tabItemActive: { backgroundColor: theme.ink },
    tabLabel: { color: theme.muted, fontSize: 10, fontWeight: "800" },
    tabLabelActive: { color: "#fff", fontSize: 10, fontWeight: "900" }
  });
}
