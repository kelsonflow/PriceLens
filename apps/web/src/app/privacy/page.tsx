import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Search } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | PriceLens",
  description: "Privacy Policy for the PriceLens mobile application and website."
};

export default function PrivacyPage() {
  return (
    <main className="legal-shell">
      <header className="legal-nav">
        <Link className="legal-brand" href="/"><span className="legal-logo"><Search size={20} /></span>PriceLens</Link>
        <nav aria-label="Legal navigation"><Link href="/support">Support</Link></nav>
      </header>

      <article className="privacy-document">
        <p className="eyebrow">Last updated: 1 October 2026</p>
        <h1>Privacy Policy</h1>
        <p className="privacy-lead">This Privacy Policy explains how PriceLens collects, uses and protects information when you use the PriceLens mobile application or website.</p>

        <h2>1. Information we collect</h2>
        <p>Depending on the features you use, we may process:</p>
        <ul>
          <li>Account information, such as your user identifier, name and email address when you sign in.</li>
          <li>Product photos and product details submitted for recognition and price comparison.</li>
          <li>Search terms, comparison country, language and app preferences.</li>
          <li>Saved products, search history, favourites and price-alert settings.</li>
          <li>Device notification tokens when you enable notifications.</li>
          <li>Subscription status and transaction identifiers supplied by Apple, Google and RevenueCat. We do not receive or store full payment-card details.</li>
          <li>Technical information needed to operate and secure the service, such as request logs, device platform, app version and error information.</li>
        </ul>

        <h2>2. How we use information</h2>
        <p>We use information to identify products, return comparison results, synchronise your account, provide saved items and alerts, verify Premium access, send requested notifications, prevent abuse, troubleshoot problems and improve service reliability.</p>

        <h2>3. Photos and product recognition</h2>
        <p>Photos you submit may be sent securely to our backend and specialised image-recognition providers to identify the product. Do not upload images containing people, identity documents, payment information or other sensitive personal information.</p>

        <h2>4. Service providers</h2>
        <p>PriceLens relies on service providers that process limited information on our behalf, including Google Cloud and Firebase for infrastructure, authentication, storage and notifications; Google AI services for product recognition; shopping-data providers for offer searches; RevenueCat for subscription management; and Apple or Google for app distribution and payment processing. Their handling of information is governed by their own terms and privacy policies.</p>

        <h2>5. Sharing and sale of personal information</h2>
        <p>We do not sell your personal information. We share information only with service providers needed to operate PriceLens, when you direct us to open a retailer website, when required by law, or when necessary to protect users and the service.</p>

        <h2>6. Data retention</h2>
        <p>We retain account and feature data while your account is active and for as long as reasonably necessary to provide the service, meet legal obligations, resolve disputes and maintain security. Operational logs and cached shopping results may be retained for shorter periods. Some records relating to purchases may be retained by Apple, Google or RevenueCat under their legal and financial obligations.</p>

        <h2>7. Your choices and rights</h2>
        <p>You can disable notifications in the app or device settings, remove saved items and stop submitting photos. You may request access, correction or deletion of personal information by contacting us. We may need to verify that the request relates to your account.</p>

        <h2>8. Account deletion</h2>
        <p>To request deletion, email us from the address associated with your PriceLens account. Deleting an account does not automatically cancel an Apple App Store or Google Play subscription; subscriptions must be managed through the relevant store account.</p>

        <h2>9. Security</h2>
        <p>We use reasonable technical and organisational measures designed to protect information. No online service can guarantee absolute security, so please use a strong device passcode and protect access to your Apple or Google account.</p>

        <h2>10. Children</h2>
        <p>PriceLens is not directed to children under 13 and we do not knowingly collect personal information from children under 13. Contact us if you believe a child has provided personal information.</p>

        <h2>11. International processing</h2>
        <p>Our providers may process information in countries other than your own. Where required, we rely on appropriate safeguards for international transfers.</p>

        <h2>12. Changes to this policy</h2>
        <p>We may update this Privacy Policy as PriceLens evolves. We will publish the revised policy on this page and update the date above.</p>

        <h2>13. Contact</h2>
        <p>For privacy questions or requests, contact <a href="mailto:kelson.ndembo@gmail.com?subject=PriceLens%20Privacy">kelson.ndembo@gmail.com</a>.</p>

        <div className="privacy-contact"><Mail size={20} /><div><strong>PriceLens privacy contact</strong><a href="mailto:kelson.ndembo@gmail.com?subject=PriceLens%20Privacy">kelson.ndembo@gmail.com</a></div></div>
      </article>

      <footer className="legal-footer"><span>© 2026 PriceLens</span><Link href="/support">Support</Link></footer>
    </main>
  );
}
