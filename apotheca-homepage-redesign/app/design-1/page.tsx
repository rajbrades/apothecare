import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ArrowRight, CheckCircle2, Sparkles, FileText, BarChart3, Shield } from "lucide-react"

export default function ApothecareDesign1() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">A</span>
            </div>
            <span className="text-xl font-semibold">Apothecare</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
            <Button size="sm">
              Get Started Free
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <Badge variant="secondary" className="gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Evidence partnerships with A4M, IFM, Cleveland Clinic & more
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-balance">
            Clinical intelligence for{" "}
            <span className="text-primary">functional medicine</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
            AI-powered evidence synthesis, multi-modal lab interpretation, and protocol 
            generation — grounded in functional medicine research. Built for the 
            practitioners who think differently about health.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <div className="relative w-full sm:w-96">
              <input
                type="text"
                placeholder="Ask a clinical question..."
                className="w-full px-4 py-3 pr-12 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button size="sm" className="absolute right-1.5 top-1.5">
                Start <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            2 free queries/day · No credit card required · Cancel anytime
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-3 pt-6">
            <button className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 hover:shadow-sm transition-all duration-200">
              Berberine vs. metformin for insulin resistance?
            </button>
            <button className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 hover:shadow-sm transition-all duration-200">
              Interpret elevated zonulin with low sIgA
            </button>
            <button className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 hover:shadow-sm transition-all duration-200">
              DUTCH test: high cortisol metabolites protocol
            </button>
          </div>
        </div>
      </section>

      {/* See It In Action Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-3 mb-12">
            <p className="text-sm text-muted-foreground">See it in action</p>
            <svg className="w-6 h-6 text-primary animate-bounce mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>

          <Card className="overflow-hidden border-2 shadow-2xl">
            <div className="bg-slate-100 px-4 py-3 flex items-center gap-2 border-b">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                <div className="w-3 h-3 rounded-full bg-slate-300"></div>
              </div>
              <div className="flex-1 flex items-center justify-center gap-2">
                <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-xs">A</span>
                </div>
                <span className="text-sm font-medium text-slate-700">Apothecare Clinical Chat</span>
              </div>
            </div>
            
            <div className="bg-white p-8 md:p-12 space-y-8">
              <div className="bg-slate-50/80 border-2 border-slate-300 rounded-xl p-4 md:p-5 max-w-2xl ml-auto shadow-sm">
                <p className="text-slate-800 text-sm md:text-base">
                  What are evidence-based interventions for elevated zonulin with concurrent low secretory IgA?
                </p>
              </div>
              
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-foreground font-bold text-xs">A</span>
                </div>
                <div className="flex-1 space-y-4">
                  <p className="text-slate-700 leading-relaxed text-sm md:text-base">
                    Elevated zonulin with concurrent low sIgA suggests compromised intestinal barrier integrity 
                    alongside mucosal immune insufficiency. This pattern is commonly seen in intestinal permeability 
                    disorders and warrants a targeted repair protocol.
                  </p>
                  
                  <div className="space-y-3">
                    <p className="font-semibold text-slate-900 text-sm md:text-base">Key interventions based on current evidence:</p>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <p className="text-slate-800 text-sm md:text-base">
                          <span className="font-semibold">1. L-Glutamine</span> (5–10g/day) — Primary fuel for enterocytes; shown to reduce intestinal permeability{" "}
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-300 text-xs">META</Badge>
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-slate-800 text-sm md:text-base">
                          <span className="font-semibold">2. Zinc Carnosine</span> (75mg BID) — Stabilizes gut mucosa and upregulates tight junction proteins{" "}
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300 text-xs">RCT</Badge>
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-slate-800 text-sm md:text-base">
                          <span className="font-semibold">3. Saccharomyces boulardii</span> (5B CFU BID) — Enhances sIgA production and modulates mucosal immunity{" "}
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300 text-xs">RCT</Badge>
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-slate-800 text-sm md:text-base">
                          <span className="font-semibold">4. Colostrum</span> (10–20g/day) — Rich in immunoglobulins; directly supports sIgA repletion{" "}
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs">GUIDELINE</Badge>
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-slate-800 text-sm md:text-base">
                          <span className="font-semibold">5. Omega-3 Fatty Acids</span> (2–4g EPA/DHA) — Reduces zonulin expression via NF-κB pathway modulation{" "}
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-300 text-xs">META</Badge>
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-500 pt-2 italic">
                    Every response cites evidence from peer-reviewed literature
                  </p>
                </div>
              </div>
            </div>
          </Card>
          
        </div>
      </section>

      {/* Evidence Sources Strip */}
      <section className="w-full bg-primary py-12">
        <div className="container mx-auto px-4">
          <p className="text-center text-xs text-primary-foreground/70 uppercase tracking-widest font-semibold mb-8">
            Grounded in Evidence From
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            <div className="text-center">
              <span className="text-primary-foreground font-bold text-lg block">PubMed</span>
              <span className="text-xs text-primary-foreground/70 mt-1">NCBI</span>
            </div>
            <div className="text-center">
              <span className="text-primary-foreground font-bold text-lg block">IFM</span>
              <span className="text-xs text-primary-foreground/70 mt-1">Inst. for Functional Medicine</span>
            </div>
            <div className="text-center">
              <span className="text-primary-foreground font-bold text-lg block">A4M</span>
              <span className="text-xs text-primary-foreground/70 mt-1">Anti-Aging Medicine</span>
            </div>
            <div className="text-center">
              <span className="text-primary-foreground font-bold text-lg block">Cleveland Clinic</span>
              <span className="text-xs text-primary-foreground/70 mt-1">Functional Medicine</span>
            </div>
            <div className="text-center">
              <span className="text-primary-foreground font-bold text-lg block">Cochrane</span>
              <span className="text-xs text-primary-foreground/70 mt-1">Systematic Reviews</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-24">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-bold">Built for clinical practice</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every feature designed around the functional medicine workflow
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              icon: Sparkles,
              title: "Clinical Chat",
              description: "Evidence-backed answers to complex clinical questions in seconds. Every response cites peer-reviewed literature.",
            },
            {
              icon: BarChart3,
              title: "Lab Interpretation",
              description: "Upload blood panels, GI-MAPs, DUTCH tests, and OATs. Apothecare parses, interprets, and correlates findings.",
            },
            {
              icon: FileText,
              title: "Protocol Generation",
              description: "Generate phased treatment protocols with supplement dosing, dietary interventions, and lifestyle recommendations.",
            },
            {
              icon: Shield,
              title: "HIPAA Compliant",
              description: "End-to-end encryption, BAAs with all vendors, audit logging, and SOC 2 certification in progress.",
            },
            {
              icon: CheckCircle2,
              title: "Clinical Visits",
              description: "Document visits with real-time evidence surfacing. Transcribe, generate SOAP notes, and query the literature.",
            },
            {
              icon: CheckCircle2,
              title: "Deep Consult Mode",
              description: "Engage advanced reasoning for complex cases. Deep Consult uses extended thinking to synthesize multi-system clinical scenarios.",
            },
          ].map((feature, i) => (
            <Card key={i} className="p-6 space-y-4 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Multi-modal Lab Interpretation Section */}
      <section className="bg-background py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">Multi-modal lab interpretation</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Upload blood panels, GI-MAPs, DUTCH tests, and OATs. Apothecare parses, interprets, and correlates 
                findings across all labs — with both conventional and functional ranges side by side.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Functional ranges catch subclinical dysfunction early</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Cross-lab pattern recognition across all test types</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Visual biomarker bars with color-coded status</span>
                </li>
              </ul>
            </div>
            
            <div className="relative">
              <Card className="overflow-hidden border-2 shadow-xl">
                <div className="bg-white p-6 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Thyroid Panel Results</h3>
                      <p className="text-sm text-slate-500">Quest Diagnostics · Dec 2024</p>
                    </div>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-300">2 flags</Badge>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">TSH</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">3.8 mIU/L</span>
                          <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-300 text-xs">Borderline</Badge>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="absolute inset-0 flex">
                            <div className="w-1/3 bg-gradient-to-r from-emerald-400 to-emerald-500"></div>
                            <div className="w-1/3 bg-amber-400"></div>
                            <div className="flex-1 bg-slate-200"></div>
                          </div>
                          <div className="absolute top-1/2 -translate-y-1/2" style={{ left: '65%' }}>
                            <div className="w-2 h-2 rounded-full bg-amber-600 border-2 border-white shadow"></div>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Functional: 1–2.5</span>
                          <span>Conventional: 0.5–4.5</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">Free T3</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-red-600">2.4 pg/mL</span>
                          <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-300 text-xs">Out of Range</Badge>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="absolute inset-0 flex">
                            <div className="w-1/2 bg-gradient-to-r from-emerald-400 to-emerald-500"></div>
                            <div className="flex-1 bg-slate-200"></div>
                          </div>
                          <div className="absolute top-1/2 -translate-y-1/2" style={{ left: '40%' }}>
                            <div className="w-2 h-2 rounded-full bg-red-600 border-2 border-white shadow"></div>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Functional: 3–3.5</span>
                          <span>Conventional: 2–4.4</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">Free T4</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-emerald-600">1.1 ng/dL</span>
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-300 text-xs">Normal</Badge>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="absolute inset-0 flex">
                            <div className="w-1/2 bg-gradient-to-r from-emerald-400 to-emerald-500"></div>
                            <div className="flex-1 bg-slate-200"></div>
                          </div>
                          <div className="absolute top-1/2 -translate-y-1/2" style={{ left: '45%' }}>
                            <div className="w-2 h-2 rounded-full bg-emerald-600 border-2 border-white shadow"></div>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Functional: 1–1.5</span>
                          <span>Conventional: 0.8–1.8</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">TPO Antibodies</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-red-600">85 IU/mL</span>
                          <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-300 text-xs">Out of Range</Badge>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="absolute inset-0 flex">
                            <div className="w-1/4 bg-gradient-to-r from-emerald-400 to-emerald-500"></div>
                            <div className="flex-1 bg-slate-200"></div>
                          </div>
                          <div className="absolute top-1/2 -translate-y-1/2" style={{ left: '85%' }}>
                            <div className="w-2 h-2 rounded-full bg-red-600 border-2 border-white shadow"></div>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Functional: 0–15</span>
                          <span>Conventional: 0–34</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Evidence-backed Protocol Generation Section */}
      <section className="bg-muted/30 py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div className="order-2 md:order-1 relative">
              <Card className="overflow-hidden border-2 shadow-xl">
                <div className="bg-white p-6 space-y-4">
                  <div className="pb-3 border-b">
                    <h3 className="text-lg font-bold text-slate-900">Generated Protocol</h3>
                    <p className="text-sm text-slate-500">Intestinal Permeability · 5R Framework</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 text-sm">PHASE 1: REMOVE</h4>
                        <span className="text-xs text-slate-500">Weeks 1–4</span>
                      </div>
                      <div className="space-y-2 pl-3 border-l-2 border-slate-200">
                        <div className="flex items-start justify-between gap-4">
                          <span className="text-sm text-slate-700">Berberine HCl</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-900">500mg TID</span>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300 text-xs">RCT</Badge>
                          </div>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <span className="text-sm text-slate-700">Allicin (stabilized)</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-900">450mg BID</span>
                            <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-300 text-xs">META</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 text-sm">PHASE 2: REPAIR</h4>
                        <span className="text-xs text-slate-500">Weeks 2–8</span>
                      </div>
                      <div className="space-y-2 pl-3 border-l-2 border-emerald-300">
                        <div className="flex items-start justify-between gap-4">
                          <span className="text-sm text-slate-700">L-Glutamine</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-900">5g BID</span>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300 text-xs">RCT</Badge>
                          </div>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <span className="text-sm text-slate-700">Zinc Carnosine</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-900">75mg BID</span>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300 text-xs">RCT</Badge>
                          </div>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <span className="text-sm text-slate-700">SBI Protect</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-900">5g QD</span>
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-300 text-xs">COHORT</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 text-sm">PHASE 3: REINOCULATE</h4>
                        <span className="text-xs text-slate-500">Weeks 4–12</span>
                      </div>
                      <div className="space-y-2 pl-3 border-l-2 border-slate-200">
                        <div className="flex items-start justify-between gap-4">
                          <span className="text-sm text-slate-700">S. Boulardii</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-900">5B CFU BID</span>
                            <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-300 text-xs">META</Badge>
                          </div>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <span className="text-sm text-slate-700">MegaSporeBiotic</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-900">2 caps QD</span>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300 text-xs">RCT</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            
            <div className="order-1 md:order-2 space-y-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">Evidence-backed protocol generation</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Generate phased treatment protocols with supplement dosing, dietary interventions, and lifestyle 
                recommendations — every line item backed by a cited evidence source.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Phased protocols following the 5R framework</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Evidence-level badges on every recommendation</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Dosing in clinical notation (TID, BID, QD)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-background py-24">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-bold">Trusted by practitioners</h2>
            <p className="text-lg text-muted-foreground">
              Functional medicine clinicians using Apothecare in practice
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                quote: "Apothecare has transformed how I approach complex cases. The evidence citations save me hours of literature review, and the functional ranges catch things I used to miss.",
                author: "Dr. Sarah Chen",
                credentials: "ND, IFMCP",
                practice: "Integrative Wellness Center",
              },
              {
                quote: "Finally an AI tool that speaks functional medicine. The lab interpretation across DUTCH, GI-MAP, and blood panels in one view is something I've never seen before.",
                author: "Dr. Michael Torres",
                credentials: "DO, ABOIM",
                practice: "Precision Medicine Associates",
              },
              {
                quote: "The protocol generation alone is worth the subscription. Evidence-backed dosing with citations I can share with patients — it's elevated my entire practice.",
                author: "Dr. Amanda Patel",
                credentials: "MD, A4M Fellow",
                practice: "Functional Health Partners",
              },
            ].map((testimonial, i) => (
              <Card key={i} className="p-6 flex flex-col h-full">
                <p className="text-muted-foreground italic flex-1">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3 pt-6 mt-auto">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary text-sm">
                      {testimonial.author.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-semibold text-sm">{testimonial.author}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.credentials}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.practice}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-24">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-bold">Simple, transparent pricing</h2>
          <p className="text-lg text-muted-foreground">
            Start free. Upgrade when you're ready.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="p-8 space-y-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Free</h3>
              <p className="text-muted-foreground">Try Apothecare risk-free</p>
            </div>
            <div className="space-y-1">
              <div className="text-4xl font-bold">$0</div>
            </div>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                2 clinical queries per day
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                PubMed evidence sources
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Basic citation expansion
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                7-day conversation history
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-4 h-4 flex items-center justify-center text-muted-foreground">✕</span>
                <span className="line-through">Lab interpretation</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-4 h-4 flex items-center justify-center text-muted-foreground">✕</span>
                <span className="line-through">Visit documentation</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-4 h-4 flex items-center justify-center text-muted-foreground">✕</span>
                <span className="line-through">Protocol generation</span>
              </li>
            </ul>
            <Button variant="outline" className="w-full">
              Get Started
            </Button>
          </Card>
          
          <Card className="p-8 space-y-6 border-primary relative">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
              Most Popular
            </Badge>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Pro</h3>
              <p className="text-muted-foreground">Everything you need in practice</p>
            </div>
            <div className="space-y-1">
              <div className="text-4xl font-bold">$89<span className="text-lg text-muted-foreground">/mo</span></div>
            </div>
            <ul className="space-y-3">
              {[
                "Unlimited clinical queries",
                "All evidence sources (A4M, IFM, premium)",
                "Full citation expansion + evidence badges",
                "Unlimited visit documentation + SOAP notes",
                "Multi-modal lab interpretation",
                "Cross-lab correlation analysis",
                "Protocol generation with dosing",
                "Patient management + trending",
                "Branded PDF exports",
                "HIPAA BAA included",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
            <Button className="w-full">
              Start Free Trial <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-24">
        <div className="container mx-auto px-4 text-center space-y-8">
          <h2 className="text-3xl md:text-5xl font-bold max-w-3xl mx-auto text-balance">
            Ready to elevate your clinical practice?
          </h2>
          <p className="text-lg max-w-2xl mx-auto opacity-90">
            Start with 2 free queries per day. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" variant="secondary">
              Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/10">
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">A</span>
              </div>
              <span className="text-xl font-semibold">Apothecare</span>
            </div>
            <p className="text-sm text-center text-muted-foreground max-w-2xl">
              Apothecare is a clinical decision support tool. It is not a substitute for professional 
              medical judgment. All treatment decisions remain with the licensed practitioner.
            </p>
            <p className="text-sm text-muted-foreground">
              © 2026 Apothecare. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
