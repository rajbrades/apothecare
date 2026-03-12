import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ArrowRight, Check } from "lucide-react"

export default function ApothecareDesign4() {
  return (
    <div className="min-h-screen bg-[#F5F3EE]">
      {/* Header */}
      <header className="border-b border-[#D4CFC0]">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-8 bg-[#2D2A24]" />
              <div className="w-2 h-8 bg-[#2D2A24]" />
            </div>
            <span className="text-xl font-bold text-[#2D2A24] uppercase tracking-tight ml-1">
              Apothecare
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#work" className="text-sm text-[#2D2A24] hover:opacity-60 transition-opacity">
              Work
            </Link>
            <Link href="#information" className="text-sm text-[#2D2A24] hover:opacity-60 transition-opacity">
              Information
            </Link>
            <Link href="#contact" className="text-sm text-[#2D2A24] hover:opacity-60 transition-opacity">
              Contact
            </Link>
          </nav>
          
          <Button variant="ghost" size="sm" className="text-[#2D2A24] hover:bg-[#2D2A24]/5">
            Book an appointment
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-32 md:py-48">
        <div className="max-w-5xl mx-auto text-center space-y-12">
          <h1 className="text-7xl md:text-8xl lg:text-9xl font-serif italic text-[#2D2A24] leading-[0.95]">
            Optimal organization<br />
            meets exquisite<br />
            design
          </h1>
          
          <p className="text-xl md:text-2xl text-[#2D2A24]/70 max-w-3xl mx-auto leading-relaxed">
            Transform your closets into functional works of art
            with Closet Creations' custom design solutions.
          </p>
        </div>
      </section>

      {/* Image Section */}
      <section className="container mx-auto px-4 pb-32">
        <div className="max-w-6xl mx-auto">
          <div className="aspect-[16/9] bg-[#D4CFC0] rounded-sm overflow-hidden">
            <div className="w-full h-full bg-gradient-to-br from-[#8B7E6A] to-[#5C5449] flex items-center justify-center">
              <div className="text-[#F5F3EE]/20 text-6xl font-serif italic">Apothecare</div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mt-16">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full border border-[#C85A54] flex items-center justify-center flex-shrink-0">
                <ArrowRight className="w-5 h-5 text-[#C85A54]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm uppercase tracking-wide text-[#2D2A24] font-medium">
                  Learn our untold story
                </h3>
                <p className="text-[#2D2A24]/60 leading-relaxed">
                  Evidence-backed clinical intelligence for functional medicine practitioners. 
                  Built on decades of research and clinical experience.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full border border-[#C85A54] flex items-center justify-center flex-shrink-0">
                <ArrowRight className="w-5 h-5 text-[#C85A54]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm uppercase tracking-wide text-[#2D2A24] font-medium">
                  Purchase our stellar products
                </h3>
                <p className="text-[#2D2A24]/60 leading-relaxed">
                  Professional tools for lab interpretation, protocol generation, and clinical 
                  decision support trusted by practitioners worldwide.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto space-y-20">
            <div className="text-center space-y-6">
              <h2 className="text-5xl md:text-6xl font-serif italic text-[#2D2A24]">
                Clinical intelligence<br />
                for functional medicine
              </h2>
              <p className="text-lg text-[#2D2A24]/70 max-w-2xl mx-auto">
                AI-powered evidence synthesis, multi-modal lab interpretation, and protocol 
                generation — grounded in functional medicine research.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-12">
              {[
                {
                  title: "Evidence Chat",
                  description: "Ask clinical questions and receive evidence-backed answers with citations from peer-reviewed literature.",
                },
                {
                  title: "Lab Interpretation",
                  description: "Multi-modal analysis of blood panels, GI-MAPs, DUTCH tests with functional and conventional ranges side by side.",
                },
                {
                  title: "Protocol Generation",
                  description: "Generate phased treatment protocols with supplement dosing, dietary interventions, and lifestyle recommendations.",
                },
              ].map((feature, i) => (
                <div key={i} className="space-y-4">
                  <div className="w-16 h-1 bg-[#C85A54]" />
                  <h3 className="text-2xl font-serif italic text-[#2D2A24]">
                    {feature.title}
                  </h3>
                  <p className="text-[#2D2A24]/70 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-serif italic text-[#2D2A24] mb-4">
                Trusted by practitioners
              </h2>
              <p className="text-lg text-[#2D2A24]/70">
                Functional medicine clinicians using Apothecare in practice
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  quote: "Apothecare has transformed how I approach complex cases. The evidence citations save me hours of literature review.",
                  author: "Dr. Sarah Chen",
                  credentials: "ND, IFMCP",
                  practice: "Integrative Wellness Center",
                },
                {
                  quote: "The lab interpretation across DUTCH, GI-MAP, and blood panels in one view is something I've never seen before.",
                  author: "Dr. Michael Torres",
                  credentials: "DO, ABOIM",
                  practice: "Precision Medicine Associates",
                },
                {
                  quote: "Evidence-backed dosing with citations I can share with patients — it's elevated my entire practice.",
                  author: "Dr. Amanda Patel",
                  credentials: "MD, A4M Fellow",
                  practice: "Functional Health Partners",
                },
              ].map((testimonial, i) => (
                <Card key={i} className="p-8 bg-white border-[#D4CFC0] space-y-6">
                  <p className="text-[#2D2A24]/80 leading-relaxed italic">
                    "{testimonial.quote}"
                  </p>
                  <div className="space-y-1 pt-4 border-t border-[#D4CFC0]">
                    <div className="font-medium text-[#2D2A24]">{testimonial.author}</div>
                    <div className="text-sm text-[#2D2A24]/60">{testimonial.credentials}</div>
                    <div className="text-sm text-[#2D2A24]/50">{testimonial.practice}</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-white py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-serif italic text-[#2D2A24] mb-4">
                Simple, transparent pricing
              </h2>
              <p className="text-lg text-[#2D2A24]/70">
                Start free. Upgrade when you're ready.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-8 p-8 border border-[#D4CFC0]">
                <div className="space-y-4">
                  <h3 className="text-3xl font-serif italic text-[#2D2A24]">Free</h3>
                  <p className="text-[#2D2A24]/70">Try Apothecare risk-free</p>
                  <div className="text-5xl font-serif italic text-[#2D2A24]">$0</div>
                </div>
                
                <ul className="space-y-3">
                  {[
                    "2 clinical queries per day",
                    "PubMed evidence sources",
                    "Basic citation expansion",
                    "7-day conversation history",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-[#2D2A24]/80">
                      <Check className="w-5 h-5 text-[#C85A54] flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
                
                <Button variant="outline" className="w-full border-[#2D2A24] text-[#2D2A24] hover:bg-[#2D2A24] hover:text-[#F5F3EE]">
                  Get Started
                </Button>
              </div>
              
              <div className="space-y-8 p-8 bg-[#2D2A24] text-[#F5F3EE]">
                <div className="space-y-4">
                  <Badge className="bg-[#C85A54] text-white hover:bg-[#C85A54]">
                    Most Popular
                  </Badge>
                  <h3 className="text-3xl font-serif italic">Pro</h3>
                  <p className="text-[#F5F3EE]/70">Everything you need in practice</p>
                  <div className="text-5xl font-serif italic">
                    $89<span className="text-2xl text-[#F5F3EE]/70">/mo</span>
                  </div>
                </div>
                
                <ul className="space-y-3">
                  {[
                    "Unlimited clinical queries",
                    "All evidence sources (A4M, IFM, premium)",
                    "Full citation expansion + evidence badges",
                    "Unlimited visit documentation + SOAP notes",
                    "Multi-modal lab interpretation",
                    "Protocol generation with dosing",
                    "HIPAA BAA included",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-[#F5F3EE]/90">
                      <Check className="w-5 h-5 text-[#C85A54] flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
                
                <Button className="w-full bg-[#C85A54] text-white hover:bg-[#A84A45]">
                  Start Free Trial <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-6xl md:text-7xl font-serif italic text-[#2D2A24] leading-tight">
              Ready to elevate your<br />
              clinical practice?
            </h2>
            <p className="text-xl text-[#2D2A24]/70">
              Start with 2 free queries per day. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Button size="lg" className="bg-[#2D2A24] text-[#F5F3EE] hover:bg-[#2D2A24]/90">
                Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="border-[#2D2A24] text-[#2D2A24] hover:bg-[#2D2A24]/5">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#D4CFC0] py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center space-y-6">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-8 bg-[#2D2A24]" />
                <div className="w-2 h-8 bg-[#2D2A24]" />
              </div>
              <span className="text-xl font-bold text-[#2D2A24] uppercase tracking-tight ml-1">
                Apothecare
              </span>
            </div>
            <p className="text-sm text-center text-[#2D2A24]/60 max-w-2xl">
              Apothecare is a clinical decision support tool. It is not a substitute for professional 
              medical judgment. All treatment decisions remain with the licensed practitioner.
            </p>
            <p className="text-sm text-[#2D2A24]/50">
              © 2026 Apothecare. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
