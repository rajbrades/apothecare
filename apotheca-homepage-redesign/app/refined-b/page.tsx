import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ArrowRight, CheckCircle2, Sparkles, FileText, BarChart3, Shield, Zap, MessageSquare } from "lucide-react"

export default function RefinedDesignB() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Header - Dark Premium */}
      <header className="border-b border-slate-800/50">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-slate-950 font-bold">A</span>
              </div>
              <span className="text-xl font-bold tracking-tight">Apothecare</span>
            </div>
            <nav className="hidden md:flex items-center gap-10">
              <Link href="#features" className="text-sm font-medium text-slate-400 hover:text-slate-50 transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="text-sm font-medium text-slate-400 hover:text-slate-50 transition-colors">
                Pricing
              </Link>
              <Link href="#about" className="text-sm font-medium text-slate-400 hover:text-slate-50 transition-colors">
                About
              </Link>
            </nav>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-slate-50 hover:bg-slate-800">
                Sign in
              </Button>
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-medium">
                Get Started Free
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="container mx-auto px-6 lg:px-8 py-24 md:py-32 lg:py-40 relative">
          <div className="max-w-5xl mx-auto">
            <div className="text-center space-y-10">
              <Badge className="gap-2 px-4 py-2 bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                <Sparkles className="w-4 h-4" />
                <span className="font-medium">Evidence partnerships with leading institutions</span>
              </Badge>
              
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-balance leading-[1.05]">
                Clinical intelligence for{" "}
                <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  functional medicine
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto text-balance leading-relaxed">
                AI-powered evidence synthesis, multi-modal lab interpretation, and protocol generation—grounded in functional medicine research.
              </p>
              
              <div className="pt-6">
                <div className="relative w-full max-w-2xl mx-auto">
                  <input
                    type="text"
                    placeholder="Ask a clinical question..."
                    className="w-full h-16 px-6 pr-36 rounded-2xl bg-slate-900 border-2 border-slate-800 text-base text-slate-50 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                  <Button size="lg" className="absolute right-2 top-2 h-12 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-medium">
                    Start <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
                <p className="text-sm text-slate-500 mt-5">
                  2 free queries daily · No credit card required
                </p>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-3 pt-8">
                {["Berberine vs. metformin for insulin resistance?", "Interpret elevated zonulin with low sIgA", "DUTCH test: high cortisol metabolites protocol"].map((q, i) => (
                  <button key={i} className="px-5 py-3 text-sm font-medium text-slate-400 bg-slate-900 hover:bg-slate-800 hover:text-slate-100 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 border border-slate-800 rounded-xl transition-all duration-200">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Demo */}
      <section className="bg-slate-900/30 py-24 md:py-32">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-emerald-400 uppercase tracking-widest mb-4">See it in action</p>
              <svg className="w-6 h-6 text-emerald-400 animate-bounce mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            
            <Card className="overflow-hidden border-2 border-slate-800 shadow-2xl shadow-emerald-500/5 bg-slate-900">
              <div className="bg-slate-800 px-5 py-3 flex items-center gap-2.5 border-b border-slate-700">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                </div>
                <div className="flex-1 flex items-center justify-center gap-2.5">
                  <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center">
                    <span className="text-slate-950 font-bold text-xs">A</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-200">Apothecare Clinical Chat</span>
                </div>
              </div>
              
              <div className="p-10 md:p-14 space-y-8">
                <div className="bg-slate-800/50 border-2 border-slate-600 rounded-2xl p-5 md:p-6 max-w-2xl ml-auto shadow-lg">
                  <p className="text-slate-200 leading-relaxed">
                    What are evidence-based interventions for elevated zonulin with concurrent low secretory IgA?
                  </p>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-slate-950 font-bold text-xs">A</span>
                  </div>
                  <div className="flex-1 space-y-5">
                    <p className="text-slate-300 leading-relaxed">
                      Elevated zonulin with concurrent low sIgA suggests compromised intestinal barrier integrity alongside mucosal immune insufficiency.
                    </p>
                    
                    <div className="space-y-4">
                      <p className="font-semibold text-slate-100">Key interventions based on current evidence:</p>
                      
                      <div className="space-y-3">
                        {[
                          { name: "L-Glutamine", dose: "(5–10g/day)", desc: "Primary fuel for enterocytes", badge: "META", color: "amber" },
                          { name: "Zinc Carnosine", dose: "(75mg BID)", desc: "Stabilizes gut mucosa", badge: "RCT", color: "blue" },
                          { name: "Saccharomyces boulardii", dose: "(5B CFU BID)", desc: "Enhances sIgA production", badge: "RCT", color: "blue" },
                          { name: "Colostrum", dose: "(10–20g/day)", desc: "Supports sIgA repletion", badge: "GUIDELINE", color: "emerald" },
                          { name: "Omega-3 Fatty Acids", dose: "(2–4g EPA/DHA)", desc: "Reduces zonulin expression", badge: "META", color: "amber" },
                        ].map((item, i) => (
                          <div key={i} className="text-sm text-slate-300">
                            <span className="font-semibold text-slate-100">{i + 1}. {item.name}</span>{" "}
                            <span className="text-slate-400">{item.dose}</span> — {item.desc}{" "}
                            <Badge className={`bg-${item.color}-500/10 text-${item.color}-400 border-${item.color}-500/20`}>
                              {item.badge}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <p className="text-xs text-slate-500 italic">Every response cites evidence from peer-reviewed literature</p>
                  </div>
                </div>
              </div>
            </Card>
            
            <div className="text-center pt-14">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-8">Grounded in evidence from</p>
              <div className="flex flex-wrap items-center justify-center gap-10 opacity-40">
                {["PubMed", "IFM", "A4M", "Cleveland Clinic", "Cochrane"].map((source) => (
                  <span key={source} className="text-base font-bold text-slate-400">{source}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 md:py-32">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5">Built for clinical practice</h2>
              <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                Every feature designed for the functional medicine workflow
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: MessageSquare, title: "Clinical Chat", desc: "Evidence-backed answers with peer-reviewed citations in seconds" },
                { icon: BarChart3, title: "Lab Interpretation", desc: "Multi-modal analysis across all test types with functional ranges" },
                { icon: FileText, title: "Protocol Generation", desc: "Phased treatment protocols with evidence-level badges" },
                { icon: Shield, title: "HIPAA Compliant", desc: "End-to-end encryption and SOC 2 certification" },
                { icon: Zap, title: "Clinical Visits", desc: "Real-time documentation with SOAP notes" },
                { icon: Sparkles, title: "Deep Consult", desc: "Advanced reasoning for complex clinical scenarios" },
              ].map((feature, i) => (
                <Card key={i} className="p-8 bg-slate-900 border-slate-800 hover:border-emerald-500/30 transition-all group">
                  <div className="space-y-5">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                      <feature.icon className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-50">{feature.title}</h3>
                    <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-emerald-500 to-teal-500 py-24 md:py-28">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-10">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-950">
              Ready to elevate your clinical practice?
            </h2>
            <p className="text-xl text-slate-950/80 max-w-2xl mx-auto">
              Start with 2 free queries per day. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <Button size="lg" className="bg-slate-950 hover:bg-slate-900 text-slate-50 font-medium h-14 px-8">
                Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="border-2 border-slate-950/20 text-slate-950 hover:bg-slate-950/10 h-14 px-8 font-medium">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-16">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-slate-950 font-bold text-sm">A</span>
              </div>
              <span className="font-bold text-lg">Apothecare</span>
            </div>
            <p className="text-sm text-slate-500 max-w-2xl">
              Clinical decision support tool. Not a substitute for professional medical judgment.
            </p>
            <p className="text-xs text-slate-600">© 2026 Apothecare. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
