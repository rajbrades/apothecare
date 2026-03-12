import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ArrowRight, CheckCircle2, Play } from "lucide-react"
import Image from "next/image"

export default function ApothecareDesign7() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-semibold text-slate-900">Apothecare</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-slate-600 hover:text-slate-900 text-sm">Sign in</Link>
            <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
              Get Started Free
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Full Width with Overlay */}
      <section className="relative h-[700px] flex items-center">
        <div className="absolute inset-0">
          <Image
            src="/placeholder.svg?height=700&width=1920"
            alt="Functional medicine practitioner in modern clinic"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-900/60" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl space-y-8">
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 backdrop-blur-sm">
              Evidence partnerships with A4M, IFM, Cleveland Clinic & more
            </Badge>
            
            <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight">
              Clinical intelligence for functional medicine
            </h1>
            
            <p className="text-xl text-slate-200 leading-relaxed">
              AI-powered evidence synthesis, multi-modal lab interpretation, and protocol 
              generation — grounded in functional medicine research.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 backdrop-blur text-lg">
                <Play className="mr-2 h-5 w-5" /> Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-slate-900 mb-2">1,000+</p>
              <p className="text-slate-600">Active Practitioners</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-slate-900 mb-2">50K+</p>
              <p className="text-slate-600">Clinical Queries</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-slate-900 mb-2">4.9/5</p>
              <p className="text-slate-600">Practitioner Rating</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-slate-900 mb-2">10hrs</p>
              <p className="text-slate-600">Saved Per Week</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid with Images */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Everything you need in clinical practice
            </h2>
            <p className="text-xl text-slate-600">
              Built for the functional medicine workflow
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Feature Card 1 */}
            <Card className="overflow-hidden group hover:shadow-2xl transition-all duration-300">
              <div className="relative h-64">
                <Image
                  src="/placeholder.svg?height=256&width=600"
                  alt="Lab interpretation interface"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <Badge className="bg-blue-500/90 text-white border-0 mb-3">
                    Multi-modal Lab Interpretation
                  </Badge>
                  <h3 className="text-2xl font-bold text-white">
                    Interpret all labs in one view
                  </h3>
                </div>
              </div>
              <div className="p-8 space-y-4">
                <p className="text-slate-600">
                  Upload blood panels, GI-MAPs, DUTCH tests, and OATs. Get instant interpretation 
                  with functional and conventional ranges side by side.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Cross-lab pattern recognition
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Color-coded biomarker visualization
                  </li>
                </ul>
              </div>
            </Card>

            {/* Feature Card 2 */}
            <Card className="overflow-hidden group hover:shadow-2xl transition-all duration-300">
              <div className="relative h-64">
                <Image
                  src="/placeholder.svg?height=256&width=600"
                  alt="Protocol generation interface"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <Badge className="bg-purple-500/90 text-white border-0 mb-3">
                    Evidence-Based Protocols
                  </Badge>
                  <h3 className="text-2xl font-bold text-white">
                    Generate phased protocols
                  </h3>
                </div>
              </div>
              <div className="p-8 space-y-4">
                <p className="text-slate-600">
                  Create treatment protocols with supplement dosing, dietary interventions, and 
                  lifestyle recommendations — all backed by citations.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    5R framework phasing
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Evidence badges on recommendations
                  </li>
                </ul>
              </div>
            </Card>

            {/* Feature Card 3 */}
            <Card className="overflow-hidden group hover:shadow-2xl transition-all duration-300">
              <div className="relative h-64">
                <Image
                  src="/placeholder.svg?height=256&width=600"
                  alt="Clinical chat interface"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <Badge className="bg-amber-500/90 text-white border-0 mb-3">
                    Clinical Chat AI
                  </Badge>
                  <h3 className="text-2xl font-bold text-white">
                    Ask complex clinical questions
                  </h3>
                </div>
              </div>
              <div className="p-8 space-y-4">
                <p className="text-slate-600">
                  Get evidence-backed answers in seconds. Every response cites sources from 
                  peer-reviewed literature.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Grounded in PubMed, IFM, A4M
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Deep Consult Mode available
                  </li>
                </ul>
              </div>
            </Card>

            {/* Feature Card 4 */}
            <Card className="overflow-hidden group hover:shadow-2xl transition-all duration-300">
              <div className="relative h-64">
                <Image
                  src="/placeholder.svg?height=256&width=600"
                  alt="Visit documentation interface"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <Badge className="bg-teal-500/90 text-white border-0 mb-3">
                    Clinical Visits
                  </Badge>
                  <h3 className="text-2xl font-bold text-white">
                    Document with evidence surfacing
                  </h3>
                </div>
              </div>
              <div className="p-8 space-y-4">
                <p className="text-slate-600">
                  Transcribe visits, generate SOAP notes, and query the literature — all in 
                  one workflow.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Real-time evidence surfacing
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Automated SOAP note generation
                  </li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Large Testimonial with Image */}
      <section className="py-24 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/placeholder.svg?height=500&width=500"
                alt="Dr. Sarah Chen, Functional Medicine Practitioner"
                fill
                className="object-cover"
              />
            </div>

            <div className="space-y-6">
              <div className="text-6xl text-emerald-600">"</div>
              
              <p className="text-2xl text-slate-800 leading-relaxed italic">
                Apothecare has completely transformed my practice. The evidence citations save me 
                hours every week, and my patients love getting protocols backed by real research. 
                It's like having a clinical research assistant available 24/7.
              </p>

              <div className="space-y-2">
                <p className="font-bold text-slate-900 text-lg">Dr. Sarah Chen</p>
                <p className="text-slate-600">ND, IFMCP</p>
                <p className="text-slate-500">Integrative Wellness Center</p>
              </div>

              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                Read More Success Stories <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-4xl lg:text-5xl font-bold">
              Ready to elevate your clinical practice?
            </h2>
            
            <p className="text-xl text-slate-300">
              Join 1,000+ practitioners delivering better care with Apothecare
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg">
                Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 text-lg">
                Sign In
              </Button>
            </div>

            <p className="text-sm text-slate-400">
              2 free queries/day · No credit card required · Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-semibold text-slate-900">Apothecare</span>
          </div>
          <p className="text-center text-slate-600 text-sm mb-2">
            © 2026 Apothecare. All rights reserved.
          </p>
          <p className="text-center text-slate-500 text-xs max-w-3xl mx-auto">
            Apothecare is a clinical decision support tool. It is not a substitute for professional 
            medical judgment. All treatment decisions remain with the licensed practitioner.
          </p>
        </div>
      </footer>

      {/* Back Link */}
      <Link
        href="/"
        className="fixed bottom-8 left-8 bg-slate-900 text-white px-4 py-2 rounded-full shadow-lg hover:bg-slate-800 transition-colors text-sm font-medium"
      >
        ← Back to All Designs
      </Link>
    </div>
  )
}
