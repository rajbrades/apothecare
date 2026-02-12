import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { ChatMockup } from "@/components/landing/chat-mockup";
import { TrustLogos } from "@/components/landing/trust-logos";
import { FeatureLab } from "@/components/landing/feature-lab";
import { FeatureProtocol } from "@/components/landing/feature-protocol";
import { FeaturesGrid } from "@/components/landing/features-grid";
import { Testimonials } from "@/components/landing/testimonials";
import { Pricing } from "@/components/landing/pricing";
import { FinalCta } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <Header />
      <main className="pt-16">
        <Hero />
        <ChatMockup />
        <TrustLogos />
        <FeatureLab />
        <FeatureProtocol />
        <FeaturesGrid />
        <Testimonials />
        <Pricing />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
