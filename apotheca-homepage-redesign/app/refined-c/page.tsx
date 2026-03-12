import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ArrowRight, CheckCircle2, Sparkles, FileText, BarChart3, Shield, Zap, MessageSquare } from "lucide-react"

export default function RefinedDesignC() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header - Editorial Style */}
      <header className="border-b border-stone-200">
        <div className="container mx-auto px-8 lg:px-12">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-emerald-700 rounded-full flex items-center justify-center">
                <span className="text-stone-50 font-bold text-xs">A</span>
              </div>
              <span className="text-xl font-serif font-medium">Apothecare</span>
            </div>
            <nav className="hidden md:flex items-center gap-10">
              <Link href="#features" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors">
                Pricing
              </Link>
              <Link href="#about" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors">
                About
              </Link>
            </nav>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="text-stone-700">
                Sign in
              </Button>
              <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-stone-50">
                Get Started Free
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero - Editorial Layout */}
      <section className="bg-stone-100">
        <div className="container mx-auto px-8 lg:px-12 py-24 md:py-32 lg:py-36">
          <div className="max-w-5xl mx-auto">
            <div className="space-y-12">
              <div className="space-y-6">
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 px-4 py-1.5">
                  <Sparkles className="w-3.5 h-3.5 mr-2" />
                  <span className="text-xs font-semibold tracking-wide">Evidence-based from day one</span>
                </Badge>
                
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-medium tracking-tight text-stone-900 text-balance leading-[1.1]">
                  Clinical intelligence for functional medicine
                </h1>
                
                <p className="text-xl md:text-2xl text-stone-600 max-w-3xl text-balance leading-relaxed font-serif">
                  AI-powered evidence synthesis, multi-modal lab interpretation, and protocol generation—grounded in functional medicine research. Built for practitioners who think differently about health.
                </p>
              </div>
              
              <div className="pt-4">
                <div className="relative w-full max-w-2xl">
                  <input
                    type="text"
                    placeholder="Ask a clinical question..."
                    className="w-full h-16 px-7 pr-40 rounded-2xl border-2 border-stone-300 bg-white text-base focus:outline-none focus:border-emerald-600 transition-colors shadow-sm"
                  />
                  <Button size="lg" className="absolute right-2 top-2 h-12 bg-emerald-700 hover:bg-emerald-800 text-stone-50">
                    Start <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
                <p className="text-sm text-stone-500 mt-4 font-medium">
                  2 free queries daily · No credit card required
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 pt-6">
                {["Berberine vs. metformin for insulin resistance?", "Interpret elevated zonulin with low sIgA", "DUTCH test: high cortisol metabolites protocol"].map((q, i) => (
                  <button key={i} className="px-5 py-3 text-sm font-medium text-stone-600 bg-white hover:bg-stone-50 hover:text-stone-900 border-2 border-stone-200 hover:border-stone-300 hover:shadow-md rounded-xl transition-all duration-200 shadow-sm">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Demo */}
      <section className="py-24 md:py-32 bg-white">
        <div className="container mx-auto px-8 lg:px-12">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-sm font-bold text-emerald-700 uppercase tracking-widest mb-4">See it in action</p>
              <svg className="w-6 h-6 text-emerald-600 animate-bounce mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            
            <Card className="overflow-hidden border-2 border-stone-200 shadow-xl">
              <div className="bg-stone-100 px-5 py-3.5 flex items-center gap-3 border-b-2 border-stone-200">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-stone-300"></div>
                  <div className="w-3 h-3 rounded-full bg-stone-300"></div>
                  <div className="w-3 h-3 rounded-full bg-stone-300"></div>
                </div>
                <div className="flex-1 flex items-center justify-center gap-2.5">
                  <div className="w-7 h-7 bg-emerald-700 rounded-full flex items-center justify-center">
                    <span className="text-stone-50 font-bold text-xs">A</span>
                  </div>
                  <span className="text-sm font-bold text-stone-800">Apothecare Clinical Chat</span>
                </div>
              </div>
              
              <div className="bg-white p-10 md:p-14 space-y-8">
                <div className="bg-stone-50 border-2 border-stone-300 rounded-2xl p-5 md:p-6 max-w-2xl ml-auto shadow-sm">
                  <p className="text-stone-800 leading-relaxed font-medium">
                    What are evidence-based interventions for elevated zonulin with concurrent low secretory IgA?
                  </p>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-9 h-9 bg-emerald-700 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-stone-50 font-bold text-xs">A</span>
                  </div>
                  <div className="flex-1 space-y-5">
                    <p className="text-stone-700 leading-relaxed font-serif">
                      Elevated zonulin with concurrent low sIgA suggests compromised intestinal barrier integrity alongside mucosal immune insufficiency. This pattern is commonly seen in intestinal permeability disorders and warrants a targeted repair protocol.
                    </p>
                    
                    <div className="space-y-4">
                      <p className="font-bold text-stone-900">Key interventions based on current evidence:</p>
                      
                      <div className="space-y-3">
                        {[
                          { name: "L-Glutamine", dose: "(5–10g/day)", desc: "Primary fuel for enterocytes; shown to reduce intestinal permeability", badge: "META", color: "amber" },
                          { name: "Zinc Carnosine", dose: "(75mg BID)", desc: "Stabilizes gut mucosa and upregulates tight junction proteins", badge: "RCT", color: "blue" },
                          { name: "Saccharomyces boulardii", dose: "(5B CFU BID)", desc: "Enhances sIgA production and modulates mucosal immunity", badge: "RCT", color: "blue" },
                          { name: "Colostrum", dose: "(10–20g/day)", desc: "Rich in immunoglobulins; directly supports sIgA repletion", badge: "GUIDELINE", color: "emerald" },
                          { name: "Omega-3 Fatty Acids", dose: "(2–4g EPA/DHA)", desc: "Reduces zonulin expression via NF-κB pathway modulation", badge: "META", color: "amber" },
                        ].map((item, i) => (
                          <div key={i} className="text-sm text-stone-700">
                            <span className="font-bold text-stone-900">{i + 1}. {item.name}</span>{" "}
                            <span className="text-stone-600">{item.dose}</span> — {item.desc}{" "}
                            <Badge className={`bg-${item.color}-100 text-${item.color}-800 border-${item.color}-200`}>
                              {item.badge}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <p className="text-xs text-stone-500 italic font-serif">Every response cites evidence from peer-reviewed literature</p>
                  </div>
                </div>
              </div>
            </Card>
            
            <div className="text-center pt-14">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-8">Grounded in evidence from</p>
              <div className="flex flex-wrap items-center justify-center gap-10 opacity-50">
                {["PubMed", "IFM", "A4M", "Cleveland Clinic", "Cochrane"].map((source) => (
                  <span key={source} className="text-base font-bold text-stone-600">{source}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-stone-100 py-24 md:py-32">
        <div className="container mx-auto px-8 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-medium text-stone-900 mb-5">
                Built for clinical practice
              </h2>
              <p className="text-xl text-stone-600 max-w-2xl mx-auto font-serif">
                Every feature designed around the functional medicine workflow
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: MessageSquare, title: "Clinical Chat", desc: "Evidence-backed answers to complex clinical questions in seconds with peer-reviewed citations" },
                { icon: BarChart3, title: "Lab Interpretation", desc: "Upload blood panels, GI-MAPs, DUTCH tests with functional and conventional ranges" },
                { icon: FileText, title: "Protocol Generation", desc: "Phased treatment protocols with supplement dosing and evidence-level badges" },
                { icon: Shield, title: "HIPAA Compliant", desc: "End-to-end encryption, BAAs with all vendors, and SOC 2 in progress" },
                { icon: Zap, title: "Clinical Visits", desc: "Real-time documentation with SOAP notes and literature queries" },
                { icon: Sparkles, title: "Deep Consult Mode", desc: "Advanced reasoning for complex multi-system clinical scenarios" },
              ].map((feature, i) => (
                <Card key={i} className="p-8 bg-white border-2 border-stone-200 hover:border-emerald-600 hover:shadow-lg transition-all">
                  <div className="space-y-5">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <feature.icon className="w-6 h-6 text-emerald-700" />
                    </div>
                    <h3 className="text-xl font-bold text-stone-900">{feature.title}</h3>
                    <p className="text-stone-600 leading-relaxed">{feature.desc}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-emerald-700 py-24 md:py-28 text-stone-50">
        <div className="container mx-auto px-8 lg:px-12">
          <div className="max-w-4xl mx-auto text-center space-y-10">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-medium">
              Ready to elevate your clinical practice?
            </h2>
            <p className="text-xl text-stone-100 max-w-2xl mx-auto font-serif">
              Start with 2 free queries per day. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <Button size="lg" className="bg-stone-50 hover:bg-white text-emerald-900 font-bold h-14 px-8">
                Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="border-2 border-stone-50/30 text-stone-50 hover:bg-stone-50/10 h-14 px-8 font-bold">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-stone-200 py-16 bg-white">
        <div className="container mx-auto px-8 lg:px-12">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-700 rounded-full flex items-center justify-center">
                <span className="text-stone-50 font-bold text-sm">A</span>
              </div>
              <span className="font-serif font-medium text-lg">Apothecare</span>
            </div>
            <p className="text-sm text-stone-600 max-w-2xl font-serif">
              Apothecare is a clinical decision support tool. It is not a substitute for professional medical judgment. All treatment decisions remain with the licensed practitioner.
            </p>
            <p className="text-xs text-stone-500">© 2026 Apothecare. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
