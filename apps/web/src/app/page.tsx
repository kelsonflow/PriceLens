import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bell, Camera, Check, ChevronRight, Search, ShieldCheck, Sparkles } from "lucide-react";

const steps = [
  { icon: Camera, number: "01", title: "Snap or search", text: "Take a clear photo or enter the product name, brand or model." },
  { icon: Sparkles, number: "02", title: "Confirm the match", text: "Review the detected product details before PriceLens searches for offers." },
  { icon: ShieldCheck, number: "03", title: "Compare clearly", text: "See total prices, shipping and store details in one consistent view." }
];

const faqs = [
  ["Does PriceLens sell products?", "No. PriceLens helps you compare third-party offers. You complete the purchase on the retailer's website."],
  ["Are prices guaranteed?", "Prices and availability can change. Always confirm the final product, price and delivery terms with the retailer before buying."],
  ["Do I need to take a photo?", "No. You can also search using a product name, brand or model."],
  ["Where is PriceLens available?", "PriceLens is being prepared for iOS and Android, with comparison markets selected from inside the app."]
];

export default function LandingPage() {
  return (
    <main className="marketing-shell">
      <header className="marketing-nav">
        <Link className="marketing-brand" href="/" aria-label="PriceLens home"><span><Search size={21} /></span>PriceLens</Link>
        <nav aria-label="Main navigation"><a href="#how-it-works">How it works</a><a href="#plans">Plans</a><Link href="/support">Support</Link></nav>
        <a className="nav-cta" href="#launch">Get launch updates <ArrowRight size={16} /></a>
      </header>

      <section className="marketing-hero" aria-labelledby="hero-title">
        <Image src="/landing/hero-home.png" alt="PriceLens mobile app showing product photo and search tools" fill priority sizes="100vw" />
        <div className="hero-wash" />
        <div className="hero-content">
          <p className="marketing-eyebrow">Smart price comparison</p>
          <h1 id="hero-title">Find the best price before you buy.</h1>
          <p>Identify a product from a photo or search by name, then compare real offers with the details that matter.</p>
          <div className="hero-actions"><a className="marketing-primary" href="#how-it-works">See how it works <ArrowRight size={19} /></a><a className="marketing-secondary" href="#product">Explore the app</a></div>
          <div className="hero-proof"><Check size={17} />Built for clear, informed shopping decisions</div>
        </div>
      </section>

      <section className="proof-strip" aria-label="PriceLens benefits"><p>One photo</p><span /><p>Comparable offers</p><span /><p>Price alerts</p><span /><p>Multiple markets</p></section>

      <section className="marketing-section how-section" id="how-it-works">
        <div className="section-heading"><p className="marketing-eyebrow">How it works</p><h2>From product to comparison in three steps.</h2><p>PriceLens keeps the workflow short while leaving the final decision in your hands.</p></div>
        <div className="steps-grid">{steps.map(({ icon: Icon, number, title, text }) => <article key={number}><div className="step-top"><span>{number}</span><Icon size={23} /></div><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>

      <section className="product-band" id="product">
        <div className="product-copy"><p className="marketing-eyebrow">Made for real shopping</p><h2>Everything you need to compare without the clutter.</h2><p>Review offers, save products and choose a plan in a calm interface designed for quick decisions.</p><ul><li><Check size={18} />Product recognition with editable details</li><li><Check size={18} />Offer filters and clear total prices</li><li><Check size={18} />Saved products, history and price alerts</li></ul></div>
        <div className="phone-gallery" aria-label="PriceLens app previews"><figure className="phone-shot phone-shot-back"><Image src="/landing/saved.png" alt="Saved products in PriceLens" width={1242} height={2688} /></figure><figure className="phone-shot phone-shot-front"><Image src="/landing/results.png" alt="Price comparison results in PriceLens" width={1242} height={2688} /></figure><figure className="phone-shot phone-shot-back"><Image src="/landing/plans.png" alt="PriceLens subscription plans" width={1242} height={2688} /></figure></div>
      </section>

      <section className="marketing-section pricing" id="plans">
        <div className="section-heading"><p className="marketing-eyebrow">Simple plans</p><h2>Start free. Upgrade when PriceLens earns its place.</h2></div>
        <div className="marketing-pricing-grid">
          <article className="marketing-plan"><div><p className="plan-label">Starter</p><h3>Free</h3><p>For occasional comparisons.</p></div><ul><li><Check size={17} />Text and image search</li><li><Check size={17} />Basic comparison history</li><li><Check size={17} />Starter monthly allowance</li></ul><a href="#launch">Get launch updates <ChevronRight size={17} /></a></article>
          <article className="marketing-plan featured-plan"><div><p className="plan-label">Premium</p><h3>€3.69 <span>/ month</span></h3><p>For frequent, considered shopping.</p></div><ul><li><Check size={17} />More monthly comparisons</li><li><Check size={17} />Price alerts and saved products</li><li><Check size={17} />Advanced market preferences</li></ul><a href="#launch"><Bell size={17} />Get launch updates</a></article>
        </div><p className="pricing-note">Final price and availability may vary by country and app store.</p>
      </section>

      <section className="faq-band"><div><p className="marketing-eyebrow">Good to know</p><h2>Clear answers before you start.</h2></div><div className="marketing-faq">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<ChevronRight size={18} /></summary><p>{answer}</p></details>)}</div></section>

      <section className="launch-band" id="launch"><div><p className="marketing-eyebrow">Coming to iOS and Android</p><h2>Shop with clarity.</h2><p>PriceLens is preparing for launch. Contact us for availability, support or early access.</p></div><a className="marketing-primary light" href="mailto:kelson.ndembo@gmail.com?subject=PriceLens%20Launch">Contact PriceLens <ArrowRight size={19} /></a></section>

      <footer className="marketing-footer"><Link className="marketing-brand" href="/"><span><Search size={21} /></span>PriceLens</Link><p>Compare clearly. Buy confidently.</p><nav aria-label="Footer navigation"><Link href="/support">Support</Link><Link href="/privacy">Privacy</Link><a href="mailto:kelson.ndembo@gmail.com">Contact</a></nav><small>© 2026 PriceLens. Prices and availability are provided by third-party retailers and may change.</small></footer>
    </main>
  );
}
