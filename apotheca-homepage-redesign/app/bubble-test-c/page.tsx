import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"

export default function BubbleTestC() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <Link href="/refined-a">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Refined A
          </Button>
        </Link>
        
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Chat Bubble Variation C</h1>
            <p className="text-muted-foreground">1.5px border with emerald accent and enhanced shadow</p>
          </div>

          <Card className="overflow-hidden border-2 shadow-xl">
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
            
            <div className="bg-white p-12 space-y-8">
              {/* Variation C: Subtle border with emerald left accent and better shadow */}
              <div className="bg-slate-50/80 border border-slate-300 border-l-4 border-l-emerald-500/30 rounded-xl p-5 max-w-2xl ml-auto shadow-md">
                <p className="text-slate-800 text-base leading-relaxed">
                  What are evidence-based interventions for elevated zonulin with concurrent low secretory IgA?
                </p>
              </div>
              
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-foreground font-bold text-xs">A</span>
                </div>
                <div className="flex-1 space-y-4">
                  <p className="text-slate-700 leading-relaxed">
                    Elevated zonulin with concurrent low sIgA suggests compromised intestinal barrier integrity 
                    alongside mucosal immune insufficiency...
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex gap-4 justify-center">
            <Link href="/bubble-test-a">
              <Button variant="outline">View Variation A</Button>
            </Link>
            <Link href="/bubble-test-b">
              <Button variant="outline">View Variation B</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
