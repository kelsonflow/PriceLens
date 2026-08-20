"use client";

import { AlertCircle, Barcode, Bell, Bookmark, Camera, CheckCircle2, ExternalLink, Heart, History, ImagePlus, Search, ShieldCheck, SlidersHorizontal, Sparkles, Trash2, User } from "lucide-react";
import Image from "next/image";
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { getOfferBadge, mockIdentification, type NormalizedOffer, type OfferCondition, type ProductIdentification } from "@pricelens/shared";

type Screen = "scanner" | "confirm" | "results" | "offer" | "favorites" | "history" | "alerts" | "profile" | "admin";
type SavedItem = { id: string; type: "favorite" | "alert" | "history" | "store-review"; title: string; payload: unknown; createdAt: string };

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const conditionLabels: Record<OfferCondition, string> = { new: "Novo", used: "Usado", refurbished: "Recondicionado" };

export default function HomePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [screen, setScreen] = useState<Screen>("scanner");
  const [query, setQuery] = useState("");
  const [previewUrl, setPreviewUrl] = useState(mockIdentification.imageUrl ?? "");
  const [identification, setIdentification] = useState<ProductIdentification>(mockIdentification);
  const [offers, setOffers] = useState<NormalizedOffer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<NormalizedOffer | null>(null);
  const [condition, setCondition] = useState<OfferCondition | "any">("any");
  const [freeShipping, setFreeShipping] = useState(false);
  const [maxPrice, setMaxPrice] = useState(950);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("Pronto para analisar.");
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [profile, setProfile] = useState({ country: "PT", currency: "EUR", language: "pt-PT", premium: false });

  const rankedOffers = useMemo(
    () => offers.filter((offer) => condition === "any" || offer.condition === condition).filter((offer) => !freeShipping || offer.shippingPrice === 0).filter((offer) => offer.totalPrice <= maxPrice),
    [condition, freeShipping, maxPrice, offers]
  );

  async function identifyText(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runIdentification(() => api<ProductIdentification>("/product-identifications/text", { method: "POST", body: JSON.stringify({ query: query || identification.name, country: profile.country, currency: profile.currency }) }));
  }

  async function identifyImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setPreviewUrl(dataUrl);
    await runIdentification(() => api<ProductIdentification>("/product-identifications/image", { method: "POST", body: JSON.stringify({ imageBase64: dataUrl, mimeType: file.type, country: profile.country, currency: profile.currency }) }));
  }

  async function runIdentification(action: () => Promise<ProductIdentification>) {
    setLoading(true);
    setNotice("A analisar com Gemini...");
    setScreen("confirm");
    try {
      const nextIdentification = await action();
      setIdentification(nextIdentification);
      setQuery(nextIdentification.name);
      await saveItem("history", nextIdentification.name, nextIdentification);
      setNotice("Produto identificado. Confirma os dados antes de pesquisar.");
    } catch {
      setNotice("Nao consegui chamar a API. Estou a usar dados de demonstracao.");
      setIdentification(mockIdentification);
    } finally {
      setLoading(false);
    }
  }

  async function searchOffers() {
    setLoading(true);
    setNotice("A consultar Shopping Providers...");
    try {
      const response = await api<{ results: NormalizedOffer[] }>("/searches/offers", {
        method: "POST",
        body: JSON.stringify({ query: identification.name, brand: identification.brand, model: identification.model, category: identification.category, country: profile.country, currency: profile.currency, condition, maxPrice, freeShippingOnly: freeShipping })
      });
      setOffers(response.results);
      setScreen("results");
      setNotice(`${response.results.length} ofertas encontradas.`);
    } catch {
      setNotice("Nao foi possivel pesquisar ofertas.");
    } finally {
      setLoading(false);
    }
  }

  async function saveItem(type: SavedItem["type"], title: string, payload: unknown) {
    try {
      const item = await api<SavedItem>("/user-data", { method: "POST", body: JSON.stringify({ type, title, payload }) });
      setSavedItems((items) => [item, ...items.filter((existing) => existing.id !== item.id)]);
      return item;
    } catch {
      const item: SavedItem = { id: `local_${crypto.randomUUID()}`, type, title, payload, createdAt: new Date().toISOString() };
      setSavedItems((items) => [item, ...items]);
      return item;
    }
  }

  function updateIdentification(patch: Partial<ProductIdentification>) {
    setIdentification((current) => ({ ...current, ...patch }));
  }

  const favorites = savedItems.filter((item) => item.type === "favorite");
  const alerts = savedItems.filter((item) => item.type === "alert");
  const history = savedItems.filter((item) => item.type === "history");
  const reviews = savedItems.filter((item) => item.type === "store-review");

  return (
    <main className="app-shell">
      <section className="hero-band">
        <nav className="topbar" aria-label="Navegacao principal">
          <button className="brand-mark nav-reset" onClick={() => setScreen("scanner")}><span className="brand-icon"><Search size={18} /></span><span>PriceLens</span></button>
          <div className="top-actions">
            <NavButton label="Historico" active={screen === "history"} onClick={() => setScreen("history")}><History size={18} /></NavButton>
            <NavButton label="Favoritos" active={screen === "favorites"} onClick={() => setScreen("favorites")}><Heart size={18} /></NavButton>
            <NavButton label="Alertas" active={screen === "alerts"} onClick={() => setScreen("alerts")}><Bell size={18} /></NavButton>
            <NavButton label="Perfil" active={screen === "profile"} onClick={() => setScreen("profile")}><User size={18} /></NavButton>
          </div>
        </nav>

        {screen === "scanner" && (
          <div className="home-grid">
            <div className="home-copy">
              <p className="eyebrow">Gemini Vision + comparacao de precos</p>
              <h1>Encontra o melhor preco com uma fotografia</h1>
              <p className="subtitle">Fotografa um produto, escolhe uma imagem ou pesquisa pelo nome. A API identifica o produto e devolve ofertas normalizadas.</p>
              <div className="primary-actions">
                <button className="primary-button" onClick={() => fileInputRef.current?.click()}><Camera size={20} />Tirar fotografia</button>
                <button className="secondary-button" onClick={() => fileInputRef.current?.click()}><ImagePlus size={20} />Escolher da galeria</button>
              </div>
              <input ref={fileInputRef} className="hidden-input" type="file" accept="image/png,image/jpeg,image/webp" capture="environment" onChange={identifyImage} />
              <form className="search-box" onSubmit={identifyText}>
                <Search size={20} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ou pesquisa pelo nome do produto" />
                <button type="submit">Pesquisar</button>
              </form>
              <StatusPill loading={loading} text={notice} />
            </div>
            <ScannerPreview previewUrl={previewUrl} confidence={identification.confidence} onPickImage={() => fileInputRef.current?.click()} onNavigate={setScreen} />
          </div>
        )}

        {screen === "confirm" && (
          <div className="workflow-panel">
            <p className="eyebrow">Confirmacao</p>
            <h1>Confirma o produto identificado</h1>
            <p className="subtitle">Corrige nome, modelo ou categoria antes de comparar ofertas.</p>
            <div className="confirm-grid">
              <AnalysisCard loading={loading} notice={notice} />
              <div className="form-panel">
                <label>Nome do produto<input value={identification.name} onChange={(event) => updateIdentification({ name: event.target.value })} /></label>
                <label>Marca<input value={identification.brand ?? ""} onChange={(event) => updateIdentification({ brand: event.target.value })} /></label>
                <label>Modelo<input value={identification.model ?? ""} onChange={(event) => updateIdentification({ model: event.target.value })} /></label>
                <label>Categoria<input value={identification.category ?? ""} onChange={(event) => updateIdentification({ category: event.target.value })} /></label>
                <div className="detected-list">{identification.visibleFeatures.map((feature) => <span key={feature}>{feature}</span>)}</div>
                <button className="primary-button full" disabled={loading} onClick={searchOffers}><CheckCircle2 size={20} />Comparar precos</button>
                <button className="secondary-button full" onClick={() => setScreen("scanner")}>Voltar ao scanner</button>
              </div>
            </div>
          </div>
        )}

        {screen === "results" && (
          <div className="workflow-panel results-panel">
            <div className="results-header">
              <div><p className="eyebrow">Resultados</p><h1>{identification.name}</h1><p className="subtitle">{identification.model} · {identification.category} · {profile.country} · {profile.currency}</p></div>
              <button className="secondary-button" onClick={() => setScreen("confirm")}>Editar produto</button>
            </div>
            <div className="results-layout">
              <Filters condition={condition} setCondition={setCondition} maxPrice={maxPrice} setMaxPrice={setMaxPrice} freeShipping={freeShipping} setFreeShipping={setFreeShipping} />
              <section className="offers-list" aria-label="Ofertas encontradas">
                {rankedOffers.length === 0 ? <EmptyState text="Nenhuma oferta encontrada com estes filtros." /> : rankedOffers.map((offer) => (
                  <OfferCard key={offer.id} offer={offer} allOffers={rankedOffers} onDetails={() => { setSelectedOffer(offer); setScreen("offer"); }} onFavorite={() => saveItem("favorite", offer.title, offer)} onAlert={() => saveItem("alert", `Alerta: ${offer.title}`, { offer, targetPrice: offer.totalPrice - 25 })} onReview={() => saveItem("store-review", `Rever ${offer.storeName}`, offer)} />
                ))}
              </section>
            </div>
          </div>
        )}

        {screen === "offer" && selectedOffer && <OfferDetails offer={selectedOffer} onBack={() => setScreen("results")} onFavorite={() => saveItem("favorite", selectedOffer.title, selectedOffer)} onAlert={() => saveItem("alert", `Alerta: ${selectedOffer.title}`, selectedOffer)} />}
        {screen === "favorites" && <ListScreen title="Favoritos" items={favorites} empty="Ainda nao guardaste ofertas." onDelete={(id) => setSavedItems((items) => items.filter((item) => item.id !== id))} />}
        {screen === "history" && <ListScreen title="Historico" items={history} empty="Ainda nao ha pesquisas no historico." onDelete={(id) => setSavedItems((items) => items.filter((item) => item.id !== id))} />}
        {screen === "alerts" && <ListScreen title="Alertas de preco" items={alerts} empty="Ainda nao criaste alertas." onDelete={(id) => setSavedItems((items) => items.filter((item) => item.id !== id))} />}
        {screen === "profile" && <ProfileScreen profile={profile} setProfile={setProfile} onAdmin={() => setScreen("admin")} />}
        {screen === "admin" && <AdminScreen reviews={reviews} onBack={() => setScreen("profile")} onResolve={(id) => setSavedItems((items) => items.filter((item) => item.id !== id))} />}
      </section>
    </main>
  );
}

function ScannerPreview({ previewUrl, confidence, onPickImage, onNavigate }: { previewUrl: string; confidence: number; onPickImage: () => void; onNavigate: (screen: Screen) => void }) {
  return (
    <div className="scan-preview" aria-label="Pre-visualizacao do scanner PriceLens">
      {previewUrl.startsWith("data:") ? <img src={previewUrl} alt="Produto selecionado" /> : <Image src={previewUrl} alt="Produto identificado" width={620} height={680} priority />}
      <div className="scan-shade" />
      <div className="scanner-topline"><span>Aponte para o produto</span><button className="glass-icon" onClick={onPickImage} aria-label="Escolher imagem"><ImagePlus size={16} /></button></div>
      <div className="scan-frame"><span className="corner corner-tl" /><span className="corner corner-tr" /><span className="corner corner-bl" /><span className="corner corner-br" /><span className="scan-line" /></div>
      <p className="scanner-help">Alinha o produto ou codigo de barras para comparar precos.</p>
      <div className="confidence-chip"><Sparkles size={16} />IA: {confidence}% confianca</div>
      <button className="scanner-trigger" onClick={onPickImage} aria-label="Digitalizar produto"><Camera size={22} /></button>
      <div className="scanner-nav" aria-label="Navegacao da app">
        <button className="active" onClick={() => onNavigate("scanner")}><Barcode size={16} />Scanner</button>
        <button onClick={() => onNavigate("history")}><History size={16} />Historico</button>
        <button onClick={() => onNavigate("favorites")}><Bookmark size={16} />Guardados</button>
        <button onClick={() => onNavigate("profile")}><User size={16} />Perfil</button>
      </div>
    </div>
  );
}

function AnalysisCard({ loading, notice }: { loading: boolean; notice: string }) {
  return <div className="analysis-card"><div className="analysis-target"><span className="analysis-ring ring-one" /><span className="analysis-ring ring-two" /><span className="analysis-focus"><Barcode size={38} /></span><span className="analysis-line" /></div><h2>{loading ? "Identificando produto e buscando melhores precos..." : "Produto pronto para confirmacao"}</h2><div className="loading-dots" aria-hidden="true"><span /><span /><span /></div><div className="analysis-tip"><Sparkles size={16} />{notice}</div></div>;
}

function Filters(props: { condition: OfferCondition | "any"; setCondition: (value: OfferCondition | "any") => void; maxPrice: number; setMaxPrice: (value: number) => void; freeShipping: boolean; setFreeShipping: (value: boolean) => void }) {
  return <aside className="filters"><div className="filters-title"><SlidersHorizontal size={18} />Filtros</div><label>Estado<select value={props.condition} onChange={(event) => props.setCondition(event.target.value as OfferCondition | "any")}><option value="any">Todos</option><option value="new">Novo</option><option value="used">Usado</option><option value="refurbished">Recondicionado</option></select></label><label>Preco maximo: {props.maxPrice} EUR<input type="range" min="250" max="1500" value={props.maxPrice} onChange={(event) => props.setMaxPrice(Number(event.target.value))} /></label><label className="toggle-row"><input type="checkbox" checked={props.freeShipping} onChange={(event) => props.setFreeShipping(event.target.checked)} />Entrega gratuita</label><div className="trust-note"><ShieldCheck size={18} />A pontuacao de confianca e um indicador. Confirma sempre os detalhes na loja antes de comprar.</div></aside>;
}

function OfferCard({ offer, allOffers, onDetails, onFavorite, onAlert, onReview }: { offer: NormalizedOffer; allOffers: NormalizedOffer[]; onDetails: () => void; onFavorite: () => void; onAlert: () => void; onReview: () => void }) {
  const badge = getOfferBadge(offer, allOffers);
  return <article className="offer-card"><Image src={offer.imageUrl ?? mockIdentification.imageUrl ?? ""} alt={offer.title} width={180} height={180} /><div className="offer-body"><div className="offer-title-row"><div>{badge && <span className="badge">{badge}</span>}{offer.isMock && <span className="mock-badge">Dados simulados</span>}<h2>{offer.title}</h2><p>{offer.storeName} · {conditionLabels[offer.condition]} · {offer.availability === "limited" ? "Stock limitado" : "Disponivel"}</p></div><div className="price-stack"><span>{offer.totalPrice.toFixed(2)} EUR</span><small>{offer.itemPrice.toFixed(2)} + {offer.shippingPrice.toFixed(2)} envio</small></div></div><div className="offer-metrics"><span>Match {offer.matchConfidence}%</span><span>Loja {offer.storeTrustScore}%</span><span>Entrega {offer.estimatedDelivery}</span><span>Atualizado {new Date(offer.lastUpdatedAt).toLocaleString("pt-PT")}</span></div><div className="offer-actions"><button className="primary-button compact" onClick={onDetails}>Detalhes</button><a href={offer.productUrl} target="_blank" rel="noreferrer" className="secondary-button compact"><ExternalLink size={17} />Comprar</a><button className="icon-button" onClick={onFavorite} aria-label="Guardar favorito"><Heart size={18} /></button><button className="icon-button" onClick={onAlert} aria-label="Criar alerta"><Bell size={18} /></button><button className="icon-button" onClick={onReview} aria-label="Sinalizar para admin"><AlertCircle size={18} /></button></div></div></article>;
}

function OfferDetails({ offer, onBack, onFavorite, onAlert }: { offer: NormalizedOffer; onBack: () => void; onFavorite: () => void; onAlert: () => void }) {
  return <div className="workflow-panel"><button className="secondary-button" onClick={onBack}>Voltar</button><div className="detail-layout"><Image src={offer.imageUrl ?? mockIdentification.imageUrl ?? ""} alt={offer.title} width={520} height={520} /><div className="form-panel"><span className="badge">Detalhes da oferta</span><h1>{offer.title}</h1><p className="subtitle">{offer.storeName} · {conditionLabels[offer.condition]}</p><div className="detail-grid"><span>Preco</span><strong>{offer.itemPrice.toFixed(2)} {offer.currency}</strong><span>Envio</span><strong>{offer.shippingPrice.toFixed(2)} {offer.currency}</strong><span>Total</span><strong>{offer.totalPrice.toFixed(2)} {offer.currency}</strong><span>Confianca loja</span><strong>{offer.storeTrustScore}%</strong><span>Confianca match</span><strong>{offer.matchConfidence}%</strong></div><div className="trust-note"><ShieldCheck size={18} />Os precos podem mudar na pagina da loja. Nunca apresentamos isto como garantia total de seguranca.</div><div className="primary-actions"><a className="primary-button" href={offer.productUrl} target="_blank" rel="noreferrer">Comprar</a><button className="secondary-button" onClick={onFavorite}>Guardar</button><button className="secondary-button" onClick={onAlert}>Criar alerta</button></div></div></div></div>;
}

function ListScreen({ title, items, empty, onDelete }: { title: string; items: SavedItem[]; empty: string; onDelete: (id: string) => void }) {
  return <div className="workflow-panel"><p className="eyebrow">Area pessoal</p><h1>{title}</h1><div className="list-stack">{items.length === 0 ? <EmptyState text={empty} /> : items.map((item) => <article className="saved-row" key={item.id}><div><h2>{item.title}</h2><p>{new Date(item.createdAt).toLocaleString("pt-PT")}</p></div><button className="icon-button" onClick={() => onDelete(item.id)} aria-label="Remover"><Trash2 size={18} /></button></article>)}</div></div>;
}

function ProfileScreen({ profile, setProfile, onAdmin }: { profile: { country: string; currency: string; language: string; premium: boolean }; setProfile: (profile: { country: string; currency: string; language: string; premium: boolean }) => void; onAdmin: () => void }) {
  return <div className="workflow-panel"><p className="eyebrow">Perfil e preferencias</p><h1>Preferencias</h1><div className="form-panel settings-panel"><label>Pais<input value={profile.country} onChange={(event) => setProfile({ ...profile, country: event.target.value.toUpperCase() })} /></label><label>Moeda<input value={profile.currency} onChange={(event) => setProfile({ ...profile, currency: event.target.value.toUpperCase() })} /></label><label>Idioma<input value={profile.language} onChange={(event) => setProfile({ ...profile, language: event.target.value })} /></label><label className="toggle-row"><input type="checkbox" checked={profile.premium} onChange={(event) => setProfile({ ...profile, premium: event.target.checked })} />Plano Premium</label><button className="primary-button full" onClick={onAdmin}>Abrir painel admin</button></div></div>;
}

function AdminScreen({ reviews, onBack, onResolve }: { reviews: SavedItem[]; onBack: () => void; onResolve: (id: string) => void }) {
  return <div className="workflow-panel"><button className="secondary-button" onClick={onBack}>Voltar ao perfil</button><p className="eyebrow">Administracao</p><h1>Resultados suspeitos</h1><div className="list-stack">{reviews.length === 0 ? <EmptyState text="Nao ha resultados sinalizados." /> : reviews.map((review) => <article className="saved-row" key={review.id}><div><h2>{review.title}</h2><p>Pendente de avaliacao</p></div><button className="primary-button compact" onClick={() => onResolve(review.id)}>Resolver</button></article>)}</div></div>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state"><AlertCircle size={28} /><h2>{text}</h2><p>Ajusta os filtros ou faz uma nova pesquisa.</p></div>;
}

function StatusPill({ loading, text }: { loading: boolean; text: string }) {
  return <div className="status-pill">{loading ? <Sparkles size={16} /> : <CheckCircle2 size={16} />}{text}</div>;
}

function NavButton({ label, active, onClick, children }: { label: string; active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button className={`icon-button ${active ? "is-active" : ""}`} aria-label={label} onClick={onClick}>{children}</button>;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  if (!response.ok) throw new Error(`API ${path} failed`);
  return response.json() as Promise<T>;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

