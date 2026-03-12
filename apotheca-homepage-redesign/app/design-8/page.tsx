import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ArrowRight, CheckCircle2, Star, Sparkles } from "lucide-react"
import Image from "next/image"

export default function ApothecareDesign8() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-semibold text-slate-900">Apothecare</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-slate-600 hover:text-slate-900 text-sm">Sign in</Link>
            <Button className="bg-emerald-600 hover:bg-emerald-700">Get Started Free</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Centered with Background Image Mosaic */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Background Image Mosaic */}
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-3 opacity-10">
          <div className="relative">
            <Image src="/placeholder.svg?height=200&width=300" alt="" fill className="object-cover" />
          </div>
          <div className="relative">
            <Image src="/placeholder.svg?height=200&width=300" alt="" fill className="object-cover" />
          </div>
          <div className="relative">
            <Image src="/placeholder.svg?height=200&width=300" alt="" fill className="object-cover" />
          </div>
          <div className="relative">
            <Image src="/placeholder.svg?height=200&width=300" alt="" fill className="object-cover" />
          </div>
          <div className="relative">
            <Image src="/placeholder.svg?height=200&width=300" alt="" fill className="object-cover" />
          </div>
          <div className="relative">
            <Image src="/placeholder.svg?height=200&width=300" alt="" fill className="object-cover" />
          </div>
          <div className="relative">
            <Image src="/placeholder.svg?height=200&width=300" alt="" fill className="object-cover" />
          </div>
          <div className="relative">
            <Image src="/placeholder.svg?height=200&width=300" alt="" fill className="object-cover" />
          </div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
              Trusted by 1,000+ functional medicine practitioners
            </Badge>
            
            <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 leading-tight text-balance">
              Clinical intelligence for{" "}
              <span className="text-emerald-600">functional medicine</span>
            </h1>
            
            <p className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
              AI-powered evidence synthesis, multi-modal lab interpretation, and protocol 
              generation — grounded in functional medicine research.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-lg">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg">
                Watch Demo
              </Button>
            </div>

            <p className="text-sm text-slate-500">
              2 free queries/day · No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Practitioner Gallery */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex -space-x-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="relative w-12 h-12 rounded-full overflow-hidden border-4 border-white">
                  <Image
                    src={`/placeholder.svg?height=48&width=48`}
                    alt={`Practitioner ${i}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
          <p className="text-center text-slate-600 mb-8">
            Join 1,000+ practitioners using Apothecare daily
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60">
            <span className="text-xl font-bold text-slate-400">PubMed</span>
            <span className="text-xl font-bold text-slate-400">IFM</span>
            <span className="text-xl font-bold text-slate-400">A4M</span>
            <span className="text-xl font-bold text-slate-400">Cleveland Clinic</span>
            <span className="text-xl font-bold text-slate-400">Cochrane</span>
          </div>
        </div>
      </section>

      {/* Bento Grid Features with Images */}
      <section className="py-24 container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Built for the functional medicine workflow
          </h2>
          <p className="text-xl text-slate-600">
            Every feature designed around clinical practice
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid md:grid-cols-6 gap-6 max-w-7xl mx-auto">
          {/* Large Feature - Spans 4 columns and 2 rows */}
          <Card className="md:col-span-4 md:row-span-2 overflow-hidden group">
            <div className="relative h-96">
              <Image
                src="/placeholder.svg?height=400&width=800"
                alt="Multi-modal lab interpretation"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 space-y-4">
                <Badge className="bg-blue-500/90 text-white border-0">
                  Multi-modal Lab Interpretation
                </Badge>
                <h3 className="text-3xl font-bold text-white">
                  Interpret all your labs in one unified view
                </h3>
                <p className="text-slate-200 text-lg">
                  Upload blood panels, GI-MAPs, DUTCH tests, and OATs. Get instant interpretation 
                  with functional and conventional ranges side by side.
                </p>
              </div>
            </div>
          </Card>

          {/* Small Feature - Top Right */}
          <Card className="md:col-span-2 overflow-hidden group">
            <div className="relative h-48">
              <Image
                src="/placeholder.svg?height=200&width=400"
                alt="Clinical chat"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <Badge className="bg-amber-500/90 text-white border-0 mb-2 text-xs">
                  Clinical Chat
                </Badge>
                <h3 className="text-lg font-bold text-white">
                  Ask clinical questions
                </h3>
              </div>
            </div>
          </Card>

          {/* Small Feature - Middle Right */}
          <Card className="md:col-span-2 overflow-hidden group">
            <div className="relative h-48">
              <Image
                src="/placeholder.svg?height=200&width=400"
                alt="Evidence-backed protocols"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <Badge className="bg-purple-500/90 text-white border-0 mb-2 text-xs">
                  Protocol Generation
                </Badge>
                <h3 className="text-lg font-bold text-white">
                  Evidence-backed protocols
                </h3>
              </div>
            </div>
          </Card>

          {/* Medium Feature - Bottom Left */}
          <Card className="md:col-span-3 overflow-hidden group">
            <div className="relative h-64">
              <Image
                src="/placeholder.svg?height=300&width=600"
                alt="Visit documentation"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2">
                <Badge className="bg-teal-500/90 text-white border-0">
                  Clinical Visits
                </Badge>
                <h3 className="text-2xl font-bold text-white">
                  Document visits with real-time evidence
                </h3>
                <p className="text-slate-200">
                  Transcribe, generate SOAP notes, query literature — all in one workflow
                </p>
              </div>
            </div>
          </Card>

          {/* Medium Feature - Bottom Right */}
          <Card className="md:col-span-3 overflow-hidden group">
            <div className="relative h-64">
              <Image
                src="/placeholder.svg?height=300&width=600"
                alt="HIPAA compliant"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2">
                <Badge className="bg-green-500/90 text-white border-0">
                  HIPAA Compliant
                </Badge>
                <h3 className="text-2xl font-bold text-white">
                  Built for clinical use from day one
                </h3>
                <p className="text-slate-200">
                  End-to-end encryption, BAAs, audit logging, SOC 2 in progress
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Testimonials Grid with Photos */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Loved by practitioners
            </h2>
            <p className="text-xl text-slate-600">
              See what functional medicine doctors are saying
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {[
              {
                quote: "Apothecare has transformed how I approach complex cases. The evidence citations save me hours of literature review.",
                name: "Dr. Sarah Chen",
                role: "ND, IFMCP",
                image: "/placeholder.svg?height=100&width=100",
              },
              {
                quote: "Finally an AI tool that speaks functional medicine. The lab interpretation across DUTCH, GI-MAP, and blood panels in one view is incredible.",
                name: "Dr. Michael Torres",
                role: "DO, ABOIM",
                image: "/placeholder.svg?height=100&width=100",
              },
              {
                quote: "The protocol generation alone is worth the subscription. Evidence-backed dosing with citations I can share with patients.",
                name: "Dr. Amanda Patel",
                role: "MD, A4M Fellow",
                image: "/placeholder.svg?height=100&width=100",
              },
              {
                quote: "My patients love getting protocols backed by real research. It's elevated the entire conversation about treatment.",
                name: "Dr. James Wilson",
                role: "DC, DACBN",
                image: "/placeholder.svg?height=100&width=100",
              },
              {
                quote: "The Deep Consult mode has helped me solve some of my most complex multi-system cases. It's like having a research team.",
                name: "Dr. Emily Rodriguez",
                role: "MD, IFMCP",
                image: "/placeholder.svg?height=100&width=100",
              },
              {
                quote: "I was skeptical about AI in medicine, but Apothecare's evidence grounding and citation system won me over completely.",
                name: "Dr. David Kim",
                role: "PharmD, IFMCP",
                image: "/placeholder.svg?height=100&width=100",
              },
            ].map((testimonial, i) => (
              <Card key={i} className="p-6 space-y-4 hover:shadow-lg transition-shadow">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                
                <p className="text-slate-700 leading-relaxed">
                  "{testimonial.quote}"
                </p>
                
                <div className="flex items-center gap-3 pt-2">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-200">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{testimonial.name}</p>
                    <p className="text-xs text-slate-600">{testimonial.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA with Background */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/placeholder.svg?height=600&width=1400"
            alt="Clinical practice"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-emerald-900/90" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <Sparkles className="w-16 h-16 text-emerald-300 mx-auto" />
            
            <h2 className="text-4xl lg:text-5xl font-bold text-white">
              Ready to transform your practice?
            </h2>
            
            <p className="text-xl text-emerald-100">
              Join 1,000+ practitioners delivering evidence-based care with Apothecare
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-emerald-900 hover:bg-slate-100 text-lg font-semibold">
                Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 text-lg">
                Sign In
              </Button>
            </div>

            <p className="text-sm text-emerald-200">
              2 free queries/day · No credit card required · Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
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
