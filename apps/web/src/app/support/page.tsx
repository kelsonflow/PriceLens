import type { Metadata } from "next";
import Link from "next/link";
import { Bell, Camera, CreditCard, Mail, RefreshCw, Search, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Support | PriceLens",
  description: "Get help with PriceLens searches, purchases, notifications and account settings."
};

const topics = [
  { icon: Camera, title: "Product recognition", text: "Use a clear, well-lit photo with the product centred in the frame. You can edit the detected name, brand, model and category before comparing offers." },
  { icon: Search, title: "Price comparison", text: "Prices and availability come from third-party retailers and may change. Open the retailer page to confirm the final price, shipping cost and product details." },
  { icon: CreditCard, title: "Premium subscription", text: "Premium purchases are processed by Apple or Google. PriceLens never receives or stores your payment-card details." },
  { icon: RefreshCw, title: "Restore purchases", text: "Open Plans in the app and select Restore purchases while signed into the same Apple or Google account used for the original purchase." },
  { icon: Bell, title: "Notifications", text: "Enable notifications in Profile and in your device settings. Price alerts require an active Premium subscription and a signed-in account." },
  { icon: ShieldCheck, title: "Account and privacy", text: "To request account deletion or help with personal data, contact us from the email address associated with your PriceLens account." }
];

export default function SupportPage() {
  return (
    <main className="legal-shell">
      <header className="legal-nav">
        <Link className="legal-brand" href="/"><span className="legal-logo"><Search size={20} /></span>PriceLens</Link>
        <nav aria-label="Legal navigation"><Link href="/privacy">Privacy Policy</Link></nav>
      </header>

      <section className="legal-hero">
        <p className="eyebrow">PriceLens support</p>
        <h1>How can we help?</h1>
        <p>Find answers about product searches, subscriptions, notifications and your account.</p>
        <a className="legal-primary" href="mailto:kelson.ndembo@gmail.com?subject=PriceLens%20Support"><Mail size={19} />Contact support</a>
      </section>

      <section className="support-grid" aria-label="Support topics">
        {topics.map(({ icon: TopicIcon, title, text }) => (
          <article className="support-item" key={title}>
            <TopicIcon size={22} />
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <section className="legal-callout">
        <div><p className="eyebrow">Still need help?</p><h2>Send us the details</h2><p>Include your device type, app version and a description of what happened. Do not send passwords, payment-card information or private API keys.</p></div>
        <a className="legal-secondary" href="mailto:kelson.ndembo@gmail.com?subject=PriceLens%20Support">kelson.ndembo@gmail.com</a>
      </section>

      <footer className="legal-footer"><span>© 2026 PriceLens</span><Link href="/privacy">Privacy Policy</Link></footer>
    </main>
  );
}
