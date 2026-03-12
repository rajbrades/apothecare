import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, CheckCircle2, Zap, Database, FileCheck, Brain, Clock, Award } from "lucide-react"

export default function ApothecareDesign2() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
              <span className="text-black font-bold text-sm">A</span>
            </div>
            <span className="text-xl font-bold">Apothecare</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
              Sign in
            </Button>
            <Button size="sm" className="bg-white text-black hover:bg-white/90">
              Get Started Free
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        
        <div className="relative container mx-auto px-4 py-32 md:py-40">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm text-emerald-400">Evidence partnerships with A4M, IFM, Cleveland Clinic & more</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight">
              The complete<br />
              platform to build<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                clinical excellence.
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/70 max-w-3xl">
              Your team's toolkit to stop configuring and start innovating. Securely build, 
              deploy, and scale evidence-based functional medicine with Apothecare.
            </p>
            
            <div className="flex flex-col sm:flex-row items-start gap-4 pt-4">
              <Button size="lg" className="bg-white text-black hover:bg-white/90 text-lg px-8">
                Get a demo
              </Button>
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 text-lg px-8">
                Explore the Product
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="border-y border-white/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-white/10">
            {[
              { value: "20 days saved", detail: "on daily builds.", brand: "NETFLIX" },
              { value: "98% faster time", detail: "to market.", brand: "TripAdvisor" },
              { value: "300% increase", detail: "in SEO.", brand: "box" },
              { value: "6x faster to", detail: "build + deploy.", brand: "ebay" },
            ].map((stat, i) => (
              <div key={i} className="p-8 space-y-4">
                <div className="space-y-2">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-white/60">{stat.detail}</div>
                </div>
                <div className="text-sm font-semibold tracking-wide">{stat.brand}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-32">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 max-w-6xl mx-auto items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 text-emerald-400">
                <Zap className="w-5 h-5" />
                <span className="text-sm font-semibold tracking-wide uppercase">Collaboration</span>
              </div>
              
              <h2 className="text-5xl md:text-6xl font-bold">
                Faster iteration.<br />
                More innovation.
              </h2>
              
              <p className="text-xl text-white/70 leading-relaxed">
                The platform for rapid progress. Let your team focus on shipping features 
                instead of managing infrastructure with automated CI/CD, built-in testing, 
                and integrated collaboration.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="border border-white/10 rounded-lg p-6 bg-white/5 backdrop-blur space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Database className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-lg font-semibold">Multi-modal lab interpretation</div>
                </div>
                <p className="text-white/60">
                  Upload blood panels, GI-MAPs, DUTCH tests, and OATs. Apothecare parses, 
                  interprets, and correlates findings across all labs.
                </p>
              </div>
              
              <div className="border border-white/10 rounded-lg p-6 bg-white/5 backdrop-blur space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <FileCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-lg font-semibold">Evidence-backed protocols</div>
                </div>
                <p className="text-white/60">
                  Generate phased treatment protocols with supplement dosing, dietary interventions, 
                  and lifestyle recommendations — every line item backed by cited evidence.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 bg-white/5">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-6xl font-bold">Trusted by practitioners</h2>
            <p className="text-xl text-white/70">
              Functional medicine clinicians using Apothecare in practice
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                quote: "Apothecare has transformed how I approach complex cases. The evidence citations save me hours of literature review.",
                author: "Dr. Sarah Chen",
                role: "ND, IFMCP",
                company: "Integrative Wellness Center",
              },
              {
                quote: "The lab interpretation across DUTCH, GI-MAP, and blood panels in one view is something I've never seen before.",
                author: "Dr. Michael Torres",
                role: "DO, ABOIM",
                company: "Precision Medicine Associates",
              },
              {
                quote: "Evidence-backed dosing with citations I can share with patients — it's elevated my entire practice.",
                author: "Dr. Amanda Patel",
                role: "MD, A4M Fellow",
                company: "Functional Health Partners",
              },
            ].map((testimonial, i) => (
              <div key={i} className="border border-white/10 rounded-lg p-8 bg-white/5 backdrop-blur space-y-6">
                <p className="text-lg text-white/80 leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center text-black font-bold">
                    {testimonial.author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.author}</div>
                    <div className="text-sm text-white/60">{testimonial.role}</div>
                    <div className="text-sm text-white/40">{testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8 border border-white/10 rounded-2xl p-16 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur">
            <h2 className="text-4xl md:text-6xl font-bold">
              Ready to elevate your<br />clinical practice?
            </h2>
            <p className="text-xl text-white/70">
              Start with 2 free queries per day. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button size="lg" className="bg-white text-black hover:bg-white/90 text-lg px-8">
                Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 text-lg px-8">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-sm">A</span>
              </div>
              <span className="text-xl font-bold">Apothecare</span>
            </div>
            <p className="text-sm text-center text-white/60 max-w-2xl">
              Apothecare is a clinical decision support tool. It is not a substitute for professional 
              medical judgment. All treatment decisions remain with the licensed practitioner.
            </p>
            <p className="text-sm text-white/40">
              © 2026 Apothecare. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
