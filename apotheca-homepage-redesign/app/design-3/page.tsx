import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ArrowRight, Check, BookOpen, FlaskConical, LineChart, Shield, Users, Sparkles } from "lucide-react"

export default function ApothecareDesign3() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <span className="text-white font-bold">A</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  Apothecare
                </span>
              </Link>
              
              <nav className="hidden md:flex items-center gap-6">
                <Link href="#platform" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                  Platform
                </Link>
                <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                  Features
                </Link>
                <Link href="#pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                  Pricing
                </Link>
                <Link href="#docs" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                  Documentation →
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="text-slate-700">
                Sign in
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30">
                Start building →
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="gap-2 py-2 px-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-blue-900 font-medium">Powered by industry-leading research</span>
            </Badge>
            
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight">
              <span className="block text-slate-900">The fastest and</span>
              <span className="block text-slate-900">most powerful</span>
              <span className="block bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                platform for building
              </span>
              <span className="block bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                AI products
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Build transformative AI experiences powered by industry-leading models and tools.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 text-lg px-8">
                Start building →
              </Button>
              <Button size="lg" variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50 text-lg px-8">
                View API pricing →
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Logo Banner */}
      <section className="py-16 border-y border-slate-200 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-60">
            {["PubMed", "IFM", "A4M", "Cleveland Clinic", "Cochrane"].map((logo, i) => (
              <div key={i} className="text-2xl font-bold text-slate-900">
                {logo}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-slate-900">
              Flagship Features
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Powerful tools for functional medicine practitioners
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: BookOpen,
                title: "Evidence Chat",
                description: "Ask clinical questions and receive evidence-backed answers with full citations from peer-reviewed literature.",
                features: ["Text and vision", "128K context window", "Real-time citations"],
              },
              {
                icon: FlaskConical,
                title: "Lab Interpretation",
                description: "Multi-modal analysis of blood panels, GI-MAPs, DUTCH tests, and OATs with functional range overlays.",
                features: ["All major lab types", "Functional ranges", "Cross-lab correlation"],
              },
              {
                icon: LineChart,
                title: "Protocol Generation",
                description: "Generate phased treatment protocols with precise supplement dosing and dietary interventions.",
                features: ["Evidence-based dosing", "Phased approaches", "Patient-ready PDFs"],
              },
            ].map((feature, i) => (
              <Card key={i} className="p-8 space-y-6 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 border-slate-200">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-slate-900">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  {feature.features.map((item, j) => (
                    <div key={j} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-blue-600" />
                      <span className="text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlight */}
      <section className="py-32 bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 max-w-6xl mx-auto items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-blue-200">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">HIPAA Compliant</span>
              </div>
              
              <h2 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight">
                Built for clinical practice from day one
              </h2>
              
              <p className="text-xl text-slate-600 leading-relaxed">
                End-to-end encryption, BAAs with all vendors, audit logging, and SOC 2 certification 
                in progress. Built for clinical use from day one.
              </p>
              
              <div className="grid grid-cols-2 gap-6 pt-4">
                {[
                  { label: "SOC 2", value: "In Progress" },
                  { label: "Encryption", value: "End-to-end" },
                  { label: "BAAs", value: "All Vendors" },
                  { label: "Audit Logs", value: "Complete" },
                ].map((stat, i) => (
                  <div key={i} className="space-y-2">
                    <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
                    <div className="text-sm text-slate-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <Card className="p-8 space-y-6 shadow-2xl shadow-blue-500/10 border-slate-200">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
                  <span className="font-semibold text-slate-900">Clinical Visits</span>
                  <Badge className="bg-blue-600 text-white">Active</Badge>
                </div>
                <div className="space-y-3 pl-4">
                  <div className="text-sm text-slate-600">
                    Document visits with real-time evidence surfacing. Transcribe, generate SOAP notes, 
                    and query the literature — all in one workflow.
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">Real-time transcription</Badge>
                    <Badge variant="secondary" className="text-xs">SOAP generation</Badge>
                    <Badge variant="secondary" className="text-xs">Evidence lookup</Badge>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-slate-900">
              Trusted by practitioners
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                quote: "The evidence citations save me hours of literature review, and the functional ranges catch things I used to miss.",
                author: "Dr. Sarah Chen",
                role: "ND, IFMCP",
              },
              {
                quote: "The lab interpretation across DUTCH, GI-MAP, and blood panels in one view is something I've never seen before.",
                author: "Dr. Michael Torres",
                role: "DO, ABOIM",
              },
              {
                quote: "Evidence-backed dosing with citations I can share with patients — it's elevated my entire practice.",
                author: "Dr. Amanda Patel",
                role: "MD, A4M Fellow",
              },
            ].map((testimonial, i) => (
              <Card key={i} className="p-8 space-y-6 border-slate-200 hover:shadow-xl transition-shadow">
                <p className="text-slate-700 leading-relaxed italic">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                    {testimonial.author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{testimonial.author}</div>
                    <div className="text-sm text-slate-600">{testimonial.role}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
        <div className="container mx-auto px-4 text-center space-y-8">
          <h2 className="text-5xl md:text-6xl font-bold max-w-3xl mx-auto leading-tight">
            Ready to elevate your clinical practice?
          </h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Start with 2 free queries per day. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-white/90 shadow-xl text-lg px-8">
              Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 text-lg px-8">
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="text-white font-bold">A</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Apothecare
              </span>
            </div>
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
