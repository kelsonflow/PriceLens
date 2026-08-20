"use client";

import { AlertCircle, Barcode, Bell, Bookmark, Camera, CheckCircle2, Heart, History, ImagePlus, Search, ShieldCheck, SlidersHorizontal, Sparkles, User } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { getOfferBadge, mockIdentification, mockOffers, rankOffers, type NormalizedOffer, type OfferCondition } from "@pricelens/shared";

type Step = "home" | "confirm" | "results";

const conditionLabels: Record<OfferCondition, string> = {
  new: "Novo",
  used: "Usado",
  refurbished: "Recondicionado"
};

export default function HomePage() {
  const [step, setStep] = useState<Step>("home");
  const [query, setQuery] = useState("");
  const [condition, setCondition] = useState<OfferCondition | "any">("any");
  const [freeShipping, setFreeShipping] = useState(false);
  const [maxPrice, setMaxPrice] = useState(900);
  const [productName, setProductName] = useState(mockIdentification.name);
  const [model, setModel] = useState(mockIdentification.model ?? "");
  const [category, setCategory] = useState(mockIdentification.category ?? "");

  const rankedOffers = useMemo(
    () =>
      rankOffers(mockOffers, {
        condition,
        freeShippingOnly: freeShipping,
        maxPrice
      }),
    [condition, freeShipping, maxPrice]
  );

  function startIdentification(nextQuery?: string) {
    if (nextQuery) setQuery(nextQuery);
    setStep("confirm");
  }

  return (
    <main className="app-shell">
      <section className="hero-band">
        <nav className="topbar" aria-label="Navegacao principal">
          <div className="brand-mark">
            <span className="brand-icon">
              <Search size={18} />
            </span>
            <span>PriceLens</span>
          </div>
          <div className="top-actions">
            <button className="icon-button" aria-label="Historico">
              <History size={18} />
            </button>
            <button className="icon-button" aria-label="Favoritos">
              <Heart size={18} />
            </button>
            <button className="icon-button" aria-label="Alertas">
              <Bell size={18} />
            </button>
          </div>
        </nav>

        {step === "home" && (
          <div className="home-grid">
            <div className="home-copy">
              <p className="eyebrow">Comparacao inteligente de compras</p>
              <h1>Encontra o melhor preco com uma fotografia</h1>
              <p className="subtitle">Fotografa um produto e compara ofertas de lojas confiaveis.</p>

              <div className="primary-actions">
                <button className="primary-button" onClick={() => startIdentification()}>
                  <Camera size={20} />
                  Tirar fotografia
                </button>
                <button className="secondary-button" onClick={() => startIdentification()}>
                  <ImagePlus size={20} />
                  Escolher da galeria
                </button>
              </div>

              <form
                className="search-box"
                onSubmit={(event) => {
                  event.preventDefault();
                  startIdentification(query || mockIdentification.name);
                }}
              >
                <Search size={20} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ou pesquisa pelo nome do produto" />
                <button type="submit">Pesquisar</button>
              </form>
            </div>

            <div className="scan-preview" aria-label="Pre-visualizacao do scanner PriceLens">
              <Image src={mockIdentification.imageUrl ?? ""} alt="Produto identificado" width={620} height={680} priority />
              <div className="scan-shade" />
              <div className="scanner-topline">
                <span>Aponte para o produto</span>
                <button className="glass-icon" aria-label="Escolher imagem">
                  <ImagePlus size={16} />
                </button>
              </div>
              <div className="scan-frame">
                <span className="corner corner-tl" />
                <span className="corner corner-tr" />
                <span className="corner corner-bl" />
                <span className="corner corner-br" />
                <span className="scan-line" />
              </div>
              <p className="scanner-help">Alinha o produto ou codigo de barras para comparar precos.</p>
              <div className="confidence-chip">
                <Sparkles size={16} />
                IA: {mockIdentification.confidence}% confianca
              </div>
              <div className="scanner-trigger">
                <Camera size={22} />
              </div>
              <div className="scanner-nav" aria-label="Navegacao da app">
                <span className="active">
                  <Barcode size={16} />
                  Scanner
                </span>
                <span>
                  <History size={16} />
                  Historico
                </span>
                <span>
                  <Bookmark size={16} />
                  Guardados
                </span>
                <span>
                  <User size={16} />
                  Perfil
                </span>
              </div>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="workflow-panel">
            <div className="panel-copy">
              <p className="eyebrow">Confirmacao</p>
              <h1>Confirma o produto identificado</h1>
              <p className="subtitle">A IA encontrou estes dados. Corrige o que for necessario antes de comparar ofertas.</p>
            </div>

            <div className="confirm-grid">
              <div className="analysis-card" aria-label="Estado de analise">
                <div className="analysis-target">
                  <span className="analysis-ring ring-one" />
                  <span className="analysis-ring ring-two" />
                  <span className="analysis-focus">
                    <Barcode size={38} />
                  </span>
                  <span className="analysis-line" />
                </div>
                <h2>Identificando produto e buscando melhores precos...</h2>
                <div className="loading-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="analysis-tip">
                  <Sparkles size={16} />
                  Fotos nitidas aumentam a confianca da correspondencia.
                </div>
              </div>
              <div className="form-panel">
                <label>
                  Nome do produto
                  <input value={productName} onChange={(event) => setProductName(event.target.value)} />
                </label>
                <label>
                  Modelo
                  <input value={model} onChange={(event) => setModel(event.target.value)} />
                </label>
                <label>
                  Categoria
                  <input value={category} onChange={(event) => setCategory(event.target.value)} />
                </label>
                <div className="detected-list">
                  {mockIdentification.visibleFeatures.map((feature) => (
                    <span key={feature}>{feature}</span>
                  ))}
                </div>
                <button className="primary-button full" onClick={() => setStep("results")}>
                  <CheckCircle2 size={20} />
                  Comparar precos
                </button>
              </div>
            </div>
          </div>
        )}

        {step === "results" && (
          <div className="workflow-panel results-panel">
            <div className="results-header">
              <div>
                <p className="eyebrow">Resultados</p>
                <h1>{productName}</h1>
                <p className="subtitle">
                  {model} · {category} · Portugal · EUR
                </p>
              </div>
              <button className="secondary-button" onClick={() => setStep("confirm")}>
                Editar produto
              </button>
            </div>

            <div className="results-layout">
              <aside className="filters">
                <div className="filters-title">
                  <SlidersHorizontal size={18} />
                  Filtros
                </div>
                <label>
                  Estado
                  <select value={condition} onChange={(event) => setCondition(event.target.value as OfferCondition | "any")}>
                    <option value="any">Todos</option>
                    <option value="new">Novo</option>
                    <option value="used">Usado</option>
                    <option value="refurbished">Recondicionado</option>
                  </select>
                </label>
                <label>
                  Preco maximo: {maxPrice} EUR
                  <input type="range" min="500" max="950" value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))} />
                </label>
                <label className="toggle-row">
                  <input type="checkbox" checked={freeShipping} onChange={(event) => setFreeShipping(event.target.checked)} />
                  Entrega gratuita
                </label>
                <div className="trust-note">
                  <ShieldCheck size={18} />
                  A pontuacao de confianca e um indicador. Confirma sempre os detalhes na loja antes de comprar.
                </div>
              </aside>

              <section className="offers-list" aria-label="Ofertas encontradas">
                {rankedOffers.length === 0 ? (
                  <div className="empty-state">
                    <AlertCircle size={28} />
                    <h2>Nenhuma oferta encontrada</h2>
                    <p>Ajusta os filtros ou confirma se a variante esta correta.</p>
                  </div>
                ) : (
                  rankedOffers.map((offer) => <OfferCard key={offer.id} offer={offer} allOffers={rankedOffers} />)
                )}
              </section>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function OfferCard({ offer, allOffers }: { offer: NormalizedOffer; allOffers: NormalizedOffer[] }) {
  const badge = getOfferBadge(offer, allOffers);

  return (
    <article className="offer-card">
      <Image src={offer.imageUrl ?? ""} alt={offer.title} width={180} height={180} />
      <div className="offer-body">
        <div className="offer-title-row">
          <div>
            {badge && <span className="badge">{badge}</span>}
            {offer.isMock && <span className="mock-badge">Dados simulados</span>}
            <h2>{offer.title}</h2>
            <p>
              {offer.storeName} · {conditionLabels[offer.condition]} · {offer.availability === "limited" ? "Stock limitado" : "Disponivel"}
            </p>
          </div>
          <div className="price-stack">
            <span>{offer.totalPrice.toFixed(2)} EUR</span>
            <small>{offer.itemPrice.toFixed(2)} + {offer.shippingPrice.toFixed(2)} envio</small>
          </div>
        </div>

        <div className="offer-metrics">
          <span>Match {offer.matchConfidence}%</span>
          <span>Loja {offer.storeTrustScore}%</span>
          <span>Entrega {offer.estimatedDelivery}</span>
          <span>Atualizado {new Date(offer.lastUpdatedAt).toLocaleString("pt-PT")}</span>
        </div>

        <div className="offer-actions">
          <a href={offer.productUrl} target="_blank" rel="noreferrer" className="primary-button compact">
            Comprar
          </a>
          <button className="icon-button" aria-label="Guardar favorito">
            <Heart size={18} />
          </button>
          <button className="icon-button" aria-label="Criar alerta">
            <Bell size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}
