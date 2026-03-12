import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ArrowRight, CheckCircle2, Sparkles, Star, Users, Clock, Microscope } from "lucide-react"
import Image from "next/image"

export default function ApothecareDesign6() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
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

      {/* Hero Section with Large Hero Image */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                Trusted by 1,000+ practitioners
              </Badge>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                Clinical intelligence for{" "}
                <span className="text-emerald-600">functional medicine</span>
              </h1>
              
              <p className="text-xl text-slate-600 leading-relaxed">
                AI-powered evidence synthesis, multi-modal lab interpretation, and protocol 
                generation — grounded in functional medicine research. Built for practitioners 
                who think differently about health.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-lg">
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="text-lg">
                  Watch Demo
                </Button>
              </div>

              <p className="text-sm text-slate-500">
                2 free queries/day · No credit card required · Cancel anytime
              </p>
            </div>

            {/* Hero Image - Practitioner using the tool */}
            <div className="relative h-[500px] lg:h-[600px] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/placeholder.svg?height=600&width=500"
                alt="Functional medicine practitioner using Apothecare"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof with Practitioner Photos */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <p className="text-center text-slate-600 mb-8">Trusted by practitioners at</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60">
            <span className="text-2xl font-bold text-slate-400">PubMed</span>
            <span className="text-2xl font-bold text-slate-400">IFM</span>
            <span className="text-2xl font-bold text-slate-400">A4M</span>
            <span className="text-2xl font-bold text-slate-400">Cleveland Clinic</span>
            <span className="text-2xl font-bold text-slate-400">Cochrane</span>
          </div>
        </div>
      </section>

      {/* Feature Section with Split Image/Content */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-32">
            {/* Image Left */}
            <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-xl order-2 lg:order-1">
              <Image
                src="/placeholder.svg?height=500&width=600"
                alt="Doctor analyzing lab results with Apothecare"
                fill
                className="object-cover"
              />
            </div>

            {/* Content Right */}
            <div className="space-y-6 order-1 lg:order-2">
              <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                Multi-modal Lab Interpretation
              </Badge>
              
              <h2 className="text-4xl font-bold text-slate-900">
                Upload labs. Get instant insights across all biomarkers.
              </h2>
              
              <p className="text-lg text-slate-600 leading-relaxed">
                Upload blood panels, GI-MAPs, DUTCH tests, and OATs. Apothecare parses, interprets, 
                and correlates findings across all labs — with both conventional and functional 
                ranges side by side.
              </p>

              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">Functional ranges catch subclinical dysfunction early</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">Cross-lab pattern recognition across all test types</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">Visual biomarker bars with color-coded status</span>
                </li>
              </ul>

              <Button className="bg-emerald-600 hover:bg-emerald-700">
                See How It Works <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Reverse Layout */}
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-32">
            {/* Content Left */}
            <div className="space-y-6">
              <Badge className="bg-purple-50 text-purple-700 border-purple-200">
                Evidence-Based Protocols
              </Badge>
              
              <h2 className="text-4xl font-bold text-slate-900">
                Generate treatment protocols backed by peer-reviewed research
              </h2>
              
              <p className="text-lg text-slate-600 leading-relaxed">
                Get phased treatment protocols with supplement dosing, dietary interventions, 
                and lifestyle recommendations — every line item backed by a cited evidence source.
              </p>

              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">Phased protocols following the 5R framework</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">Evidence-level badges on every recommendation</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">Dosing in clinical notation (TID, BID, QD)</span>
                </li>
              </ul>

              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Explore Protocols <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {/* Image Right */}
            <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="/placeholder.svg?height=500&width=600"
                alt="Practitioner reviewing treatment protocols"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Third Feature */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Image Left */}
            <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-xl order-2 lg:order-1">
              <Image
                src="/placeholder.svg?height=500&width=600"
                alt="Clinical consultation with patient"
                fill
                className="object-cover"
              />
            </div>

            {/* Content Right */}
            <div className="space-y-6 order-1 lg:order-2">
              <Badge className="bg-amber-50 text-amber-700 border-amber-200">
                Clinical Chat AI
              </Badge>
              
              <h2 className="text-4xl font-bold text-slate-900">
                Ask complex clinical questions. Get evidence-backed answers in seconds.
              </h2>
              
              <p className="text-lg text-slate-600 leading-relaxed">
                Every response cites evidence from peer-reviewed literature. No more hours of 
                literature review — get clinical intelligence that helps you deliver better care, faster.
              </p>

              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">Grounded in PubMed, IFM, A4M, and more</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">Deep Consult Mode for complex multi-system cases</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">Save hours of literature review per patient</span>
                </li>
              </ul>

              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Try Clinical Chat <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials with Photos */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Trusted by practitioners
            </h2>
            <p className="text-xl text-slate-600">
              Functional medicine clinicians using Apothecare in practice
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "Apothecare has transformed how I approach complex cases. The evidence citations save me hours of literature review, and the functional ranges catch things I used to miss.",
                name: "Dr. Sarah Chen",
                role: "ND, IFMCP",
                practice: "Integrative Wellness Center",
              },
              {
                quote: "Finally an AI tool that speaks functional medicine. The lab interpretation across DUTCH, GI-MAP, and blood panels in one view is something I've never seen before.",
                name: "Dr. Michael Torres",
                role: "DO, ABOIM",
                practice: "Precision Medicine Associates",
              },
              {
                quote: "The protocol generation alone is worth the subscription. Evidence-backed dosing with citations I can share with patients — it's elevated my entire practice.",
                name: "Dr. Amanda Patel",
                role: "MD, A4M Fellow",
                practice: "Functional Health Partners",
              },
            ].map((testimonial, i) => (
              <Card key={i} className="p-8 space-y-6">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                
                <p className="text-slate-700 leading-relaxed italic">
                  "{testimonial.quote}"
                </p>
                
                <div className="flex items-center gap-4">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-200">
                    <Image
                      src="/placeholder.svg?height=48&width=48"
                      alt={testimonial.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{testimonial.name}</p>
                    <p className="text-sm text-slate-600">{testimonial.role}</p>
                    <p className="text-sm text-slate-500">{testimonial.practice}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section with Background Image */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/placeholder.svg?height=600&width=1400"
            alt="Clinical practice background"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-slate-900/85" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-4xl lg:text-5xl font-bold text-white">
              Ready to elevate your clinical practice?
            </h2>
            
            <p className="text-xl text-slate-200">
              Start with 2 free queries per day. No credit card required.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-lg">
                Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white/20 text-lg">
                Sign In
              </Button>
            </div>
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
