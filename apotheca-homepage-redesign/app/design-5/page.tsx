import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ArrowRight, Check, Sparkles, Search, FileText, TrendingUp, Shield, Users, Zap } from "lucide-react"

export default function ApothecareDesign5() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 rounded-xl rotate-3 shadow-lg shadow-violet-500/30" />
                <div className="absolute inset-0 w-9 h-9 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 rounded-xl -rotate-3 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                Apothecare
              </span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Pricing
              </Link>
              <Link href="#testimonials" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Testimonials
              </Link>
            </nav>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/40">
                Start Free
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 opacity-60" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-violet-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-1/4 w-[500px] h-[500px] bg-fuchsia-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <div className="relative container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="gap-2 py-2 px-4 bg-gradient-to-r from-violet-100 to-fuchsia-100 border-violet-200 hover:bg-gradient-to-r hover:from-violet-100 hover:to-fuchsia-100">
              <Sparkles className="w-4 h-4 text-violet-600" />
              <span className="text-violet-900 font-semibold">Powered by A4M, IFM, Cleveland Clinic & Cochrane</span>
            </Badge>
            
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1]">
              <span className="block text-slate-900">Clinical intelligence</span>
              <span className="block text-slate-900">for</span>
              <span className="block bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                functional medicine
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              AI-powered evidence synthesis, multi-modal lab interpretation, and protocol 
              generation — grounded in functional medicine research. Built for the 
              practitioners who think differently about health.
            </p>
            
            <div className="flex flex-col items-center gap-6 pt-6">
              <div className="relative w-full max-w-2xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ask a clinical question..."
                  className="w-full pl-12 pr-32 py-4 rounded-2xl border-2 border-slate-200 bg-white text-base focus:outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all shadow-lg shadow-black/5"
                />
                <Button className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30">
                  Start <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              
              <p className="text-sm text-slate-500">
                2 free queries/day · No credit card required · Cancel anytime
              </p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              {[
                "Berberine vs. metformin?",
                "Elevated zonulin + low sIgA",
                "High cortisol protocol",
              ].map((query, i) => (
                <Button key={i} variant="outline" size="sm" className="rounded-full border-slate-300 hover:border-violet-400 hover:bg-violet-50">
                  {query}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="border-y bg-slate-50/50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              { label: "Clinical queries", value: "50K+" },
              { label: "Evidence sources", value: "5+" },
              { label: "Practitioners", value: "2,000+" },
              { label: "Time saved", value: "98%" },
            ].map((stat, i) => (
              <div key={i} className="text-center space-y-1">
                <div className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-6xl font-bold text-slate-900">
              Everything you need
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Professional tools built for functional medicine practitioners
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: Sparkles,
                title: "Clinical Chat",
                description: "Evidence-backed answers to complex clinical questions in seconds. Every response cites peer-reviewed literature.",
                color: "from-violet-500 to-purple-500",
              },
              {
                icon: FileText,
                title: "Lab Interpretation",
                description: "Upload blood panels, GI-MAPs, DUTCH tests, and OATs. Apothecare parses, interprets, and correlates findings.",
                color: "from-purple-500 to-fuchsia-500",
              },
              {
                icon: TrendingUp,
                title: "Protocol Generation",
                description: "Generate phased treatment protocols with supplement dosing, dietary interventions, and lifestyle recommendations.",
                color: "from-fuchsia-500 to-pink-500",
              },
              {
                icon: Shield,
                title: "HIPAA Compliant",
                description: "End-to-end encryption, BAAs with all vendors, audit logging, and SOC 2 certification in progress.",
                color: "from-violet-500 to-purple-500",
              },
              {
                icon: Users,
                title: "Clinical Visits",
                description: "Document visits with real-time evidence surfacing. Transcribe, generate SOAP notes, and query the literature.",
                color: "from-purple-500 to-fuchsia-500",
              },
              {
                icon: Zap,
                title: "Deep Consult Mode",
                description: "Engage advanced reasoning for complex cases. Deep Consult uses extended thinking to synthesize multi-system scenarios.",
                color: "from-fuchsia-500 to-pink-500",
              },
            ].map((feature, i) => (
              <Card key={i} className="group p-8 space-y-6 border-2 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-slate-900">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-6xl font-bold text-slate-900">
              Trusted by practitioners
            </h2>
            <p className="text-xl text-slate-600">
              Functional medicine clinicians using Apothecare in practice
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                quote: "Apothecare has transformed how I approach complex cases. The evidence citations save me hours of literature review, and the functional ranges catch things I used to miss.",
                author: "Dr. Sarah Chen",
                role: "ND, IFMCP",
                practice: "Integrative Wellness Center",
                gradient: "from-violet-600 to-purple-600",
              },
              {
                quote: "Finally an AI tool that speaks functional medicine. The lab interpretation across DUTCH, GI-MAP, and blood panels in one view is something I've never seen before.",
                author: "Dr. Michael Torres",
                role: "DO, ABOIM",
                practice: "Precision Medicine Associates",
                gradient: "from-purple-600 to-fuchsia-600",
              },
              {
                quote: "The protocol generation alone is worth the subscription. Evidence-backed dosing with citations I can share with patients — it's elevated my entire practice.",
                author: "Dr. Amanda Patel",
                role: "MD, A4M Fellow",
                practice: "Functional Health Partners",
                gradient: "from-fuchsia-600 to-pink-600",
              },
            ].map((testimonial, i) => (
              <Card key={i} className="p-8 space-y-6 bg-white border-2 hover:border-violet-200 hover:shadow-xl transition-all">
                <p className="text-slate-700 leading-relaxed italic text-lg">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-4 pt-4 border-t">
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                    {testimonial.author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-slate-900">{testimonial.author}</div>
                    <div className="text-sm text-slate-600">{testimonial.role}</div>
                    <div className="text-sm text-slate-500">{testimonial.practice}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-6xl font-bold text-slate-900">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-slate-600">
              Start free. Upgrade when you're ready.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="p-10 space-y-8 border-2">
              <div className="space-y-3">
                <h3 className="text-3xl font-bold text-slate-900">Free</h3>
                <p className="text-slate-600">Try Apothecare risk-free</p>
                <div className="text-5xl font-bold text-slate-900">$0</div>
              </div>
              
              <ul className="space-y-4">
                {[
                  "2 clinical queries per day",
                  "PubMed evidence sources",
                  "Basic citation expansion",
                  "7-day conversation history",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-violet-600 flex-shrink-0" />
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
              
              <Button variant="outline" className="w-full border-2 hover:bg-slate-50">
                Get Started
              </Button>
            </Card>
            
            <Card className="p-10 space-y-8 border-2 border-violet-300 bg-gradient-to-br from-violet-50 to-fuchsia-50 relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Badge className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white">
                  Most Popular
                </Badge>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-3xl font-bold text-slate-900">Pro</h3>
                <p className="text-slate-700">Everything you need in practice</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                    $89
                  </span>
                  <span className="text-xl text-slate-600">/mo</span>
                </div>
              </div>
              
              <ul className="space-y-4">
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
                  <li key={i} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-violet-600 flex-shrink-0" />
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
              
              <Button className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/40">
                Start Free Trial <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-white">
        <div className="container mx-auto px-4 text-center space-y-8">
          <h2 className="text-5xl md:text-6xl font-bold max-w-4xl mx-auto leading-tight">
            Ready to elevate your clinical practice?
          </h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Start with 2 free queries per day. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Button size="lg" className="bg-white text-violet-600 hover:bg-white/90 shadow-2xl text-lg px-10">
              Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 text-lg px-10">
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center space-y-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 rounded-xl rotate-3 shadow-lg shadow-violet-500/30" />
                <div className="absolute inset-0 w-9 h-9 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 rounded-xl -rotate-3 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                Apothecare
              </span>
            </Link>
            <p className="text-sm text-center text-slate-600 max-w-2xl">
              Apothecare is a clinical decision support tool. It is not a substitute for professional 
              medical judgment. All treatment decisions remain with the licensed practitioner.
            </p>
            <p className="text-sm text-slate-500">
              © 2026 Apothecare. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
