import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Palette, Camera } from "lucide-react"

export default function DesignSelector() {
  console.log("[v0] DesignSelector loaded");
  const designs = [
    {
      id: 1,
      name: "Design 1 - Modern SaaS",
      description: "Clean, professional design with sage green accents. Perfect balance of credibility and modern SaaS appeal.",
      path: "/design-1",
      color: "from-emerald-500 to-teal-500",
    },
    {
      id: 2,
      name: "Design 2 - Dark Premium",
      description: "Bold black background with emerald accents. High contrast, tech-forward design inspired by modern platforms.",
      path: "/design-2",
      color: "from-emerald-400 to-teal-400",
    },
    {
      id: 3,
      name: "Design 3 - Tech Platform",
      description: "Blue gradient theme with clean typography. Professional and trustworthy AI platform aesthetic.",
      path: "/design-3",
      color: "from-blue-600 to-cyan-500",
    },
    {
      id: 4,
      name: "Design 4 - Editorial Minimalist",
      description: "Warm beige tones with serif typography. Sophisticated, editorial design with strong typography focus.",
      path: "/design-4",
      color: "from-amber-700 to-stone-600",
    },
    {
      id: 5,
      name: "Design 5 - Vibrant Gradient",
      description: "Purple-to-fuchsia gradients with modern UI. Energetic, innovative design with bold visual elements.",
      path: "/design-5",
      color: "from-violet-600 to-fuchsia-600",
    },
    {
      id: 6,
      name: "Design 6 - Photo-Driven Split Layout",
      description: "Large practitioner photography with alternating split layouts. Real lifestyle imagery showing practitioners using Apothecare in clinical settings.",
      path: "/design-6",
      color: "from-emerald-600 to-emerald-500",
      badge: "With Real Photography",
    },
    {
      id: 7,
      name: "Design 7 - Hero Image Overlay",
      description: "Full-width hero with practitioner photo overlay. Feature grid with image cards showing clinical environments and workflows.",
      path: "/design-7",
      color: "from-teal-600 to-cyan-600",
      badge: "With Real Photography",
    },
    {
      id: 8,
      name: "Design 8 - Bento Grid with Images",
      description: "Modern bento grid layout with embedded practitioner photos. Testimonials with headshots and background imagery throughout.",
      path: "/design-8",
      color: "from-slate-600 to-emerald-600",
      badge: "With Real Photography",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm">
              <Palette className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">11 Total Designs</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900">
              Apothecare Homepage Designs
            </h1>
            
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Explore multiple design directions—from initial concepts to refined, production-ready versions with perfect spacing, typography, and color systems.
            </p>
          </div>

          {/* Refined Designs Section */}
          <div className="space-y-6 pt-8">
            <div className="flex items-center gap-3">
              <Badge className="bg-emerald-600 text-white">Recommended</Badge>
              <h2 className="text-2xl font-bold text-slate-900">Refined Production Designs</h2>
            </div>
            <p className="text-slate-600">
              These 3 designs represent the final, polished versions with cohesive spacing systems, refined typography hierarchy, and professional color palettes. Each is fully implemented and production-ready.
            </p>
            
            <div className="grid gap-6">
              <Card className="p-8 border-2 border-emerald-200 hover:shadow-xl transition-all">
                <div className="flex items-start justify-between gap-8">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        A
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-2xl font-bold text-slate-900">Refined Design A - Clean Professional</h3>
                        <p className="text-sm text-emerald-700 font-medium">Most Recommended</p>
                      </div>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Perfect spacing hierarchy, clean sage green accents, refined typography with proper above-the-fold impact. Balanced credibility and modern appeal with 16-20px vertical rhythm throughout.
                    </p>
                  </div>
                  <Link href="/refined-a">
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      View Design <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </Card>

              <Card className="p-8 border-2 border-slate-800 hover:shadow-xl transition-all">
                <div className="flex items-start justify-between gap-8">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-900 to-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        B
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900">Refined Design B - Dark Premium</h3>
                      </div>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      High-contrast dark theme with emerald accents, bold typography, and premium feel. 24-32px spacing for luxury brand positioning. Perfect for standing out in a crowded medical SaaS market.
                    </p>
                  </div>
                  <Link href="/refined-b">
                    <Button className="bg-slate-900 hover:bg-slate-800 text-white">
                      View Design <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </Card>

              <Card className="p-8 border-2 border-stone-300 hover:shadow-xl transition-all">
                <div className="flex items-start justify-between gap-8">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-stone-600 to-emerald-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        C
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900">Refined Design C - Editorial Sophisticated</h3>
                      </div>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Warm stone tones with serif typography, editorial layout with generous whitespace. Sophisticated, high-end positioning with refined 20-28px spacing rhythm throughout.
                    </p>
                  </div>
                  <Link href="/refined-c">
                    <Button className="bg-emerald-700 hover:bg-emerald-800 text-white">
                      View Design <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>

          {/* Original Concepts */}
          <div className="space-y-6 pt-12">
            <h2 className="text-2xl font-bold text-slate-900">Initial Design Explorations</h2>
            <p className="text-slate-600">
              Earlier design concepts exploring different visual directions and feature presentations.
            </p>

            {/* Design Cards */}
            <div className="space-y-6">
            {designs.map((design) => (
              <Card key={design.id} className="p-8 hover:shadow-xl transition-all duration-300 border-2 hover:border-slate-300">
                <div className="flex items-start justify-between gap-8">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${design.color} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                        {design.id}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h2 className="text-2xl font-bold text-slate-900">{design.name}</h2>
                          {design.badge && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
                              <Camera className="w-3 h-3 mr-1" />
                              {design.badge}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-slate-600 leading-relaxed">
                      {design.description}
                    </p>
                  </div>
                  
                  <Link href={design.path}>
                    <Button className="bg-slate-900 hover:bg-slate-800 text-white">
                      View Design <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>

            {/* Footer Note */}
            <Card className="p-8 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
              <div className="space-y-3 text-center">
                <h3 className="text-lg font-semibold text-slate-900">Design Recommendations Summary</h3>
                <p className="text-slate-700 leading-relaxed max-w-3xl mx-auto">
                  Each design addresses the current homepage's limitations while maintaining professional 
                  credibility. Designs 1-5 focus on UI/color variations, while Designs 6-8 incorporate 
                  real practitioner photography to create more human connection and authentic storytelling. 
                  The photo-driven designs show practitioners in clinical settings, patients, and real workflows.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
