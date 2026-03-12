import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ChevronLeft, FileText, RefreshCw, Archive, ChevronDown, MessageSquare, LayoutDashboard, Calendar, FlaskConical, Pill, Users } from "lucide-react"

export default function LabResultsPage() {
  const biomarkers = [
    { name: "Baso (Absolute)", value: "0.1", unit: "x10E9/L", status: "NORMAL", functionalMin: 0, functionalMax: 2, conventionalMin: 0, conventionalMax: 2, current: 0.1 },
    { name: "Basos", value: "1", unit: "%", status: "NORMAL", functionalMin: 0, functionalMax: 2, conventionalMin: 0, conventionalMax: 2, current: 1 },
    { name: "Eos", value: "1", unit: "%", status: "NORMAL", functionalMin: 0, functionalMax: 2, conventionalMin: 0, conventionalMax: 2, current: 1 },
    { name: "Eos (Absolute)", value: "0", unit: "x10E9/L", status: "BORDERLINE", functionalMin: 0, functionalMax: 0.4, conventionalMin: 0, conventionalMax: 0.4, current: 0 },
    { name: "Hematocrit", value: "42.4", unit: "%", status: "NORMAL", functionalMin: 38, functionalMax: 46.6, conventionalMin: 34, conventionalMax: 46.6, current: 42.4 },
    { name: "Hemoglobin", value: "14.3", unit: "g/dL", status: "CRITICAL", functionalMin: 14, functionalMax: 15.3, conventionalMin: 8.3, conventionalMax: 15.3, current: 14.3 },
    { name: "Immature Grans (Abs)", value: "0", unit: "x10E9/L", status: "BORDERLINE", functionalMin: 0, functionalMax: 0.1, conventionalMin: 0, conventionalMax: 0.1, current: 0 },
    { name: "Immature Granulocytes", value: "0", unit: "%", status: "NORMAL", functionalMin: 0, functionalMax: 0, conventionalMin: 0, conventionalMax: 0, current: 0 },
    { name: "Lymphs", value: "45", unit: "%", status: "NORMAL", functionalMin: 0, functionalMax: 38, conventionalMin: 0, conventionalMax: 38, current: 45 },
    { name: "Lymphs (Absolute)", value: "2.1", unit: "x10E9/L", status: "NORMAL", functionalMin: 0.7, functionalMax: 3.1, conventionalMin: 0.7, conventionalMax: 3.1, current: 2.1 },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NORMAL": return "bg-emerald-100 text-emerald-700 border-emerald-300"
      case "BORDERLINE": return "bg-amber-100 text-amber-700 border-amber-300"
      case "CRITICAL": return "bg-red-100 text-red-700 border-red-300"
      default: return "bg-slate-100 text-slate-700 border-slate-300"
    }
  }

  const getBarPosition = (marker: typeof biomarkers[0]) => {
    const totalRange = marker.conventionalMax - marker.conventionalMin
    const position = ((marker.current - marker.conventionalMin) / totalRange) * 100
    return Math.max(0, Math.min(100, position))
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">A</span>
            </div>
            <span className="text-xl font-semibold">Apothecare</span>
          </Link>
        </div>

        <div className="p-3">
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            + New Conversation
          </Button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <Link href="#" className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <Link href="#" className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors">
            <Calendar className="w-4 h-4" />
            Visits
          </Link>
          <Link href="#" className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg bg-muted text-foreground font-medium">
            <FlaskConical className="w-4 h-4" />
            Labs
          </Link>
          <Link href="#" className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors">
            <Pill className="w-4 h-4" />
            Supplements
          </Link>
          <Link href="#" className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors">
            <Users className="w-4 h-4" />
            Patients
          </Link>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Conversations</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            {["What does the evidenc...", "What are the best-studi...", "What RCTs support cur...", "What RCTs exist for ma...", "What is the evidence fo..."].map((conv, i) => (
              <button key={i} className="w-full text-left px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted rounded transition-colors">
                <div>{conv}</div>
                <div className="text-[10px] text-muted-foreground/70 mt-0.5">2h ago</div>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-6 max-w-6xl">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="#" className="hover:text-foreground transition-colors">Labs</Link>
            <span>›</span>
            <span className="text-foreground">Comprehensive Blood Panel (Fe+TIBC+Fer</span>
          </div>

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">Comprehensive Blood Panel (Fe+TIBC+Fer</h1>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>LabCorp</span>
                  <span>•</span>
                  <span>February 5, 2026</span>
                  <span>•</span>
                  <span>Ryan Brady</span>
                </div>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">COMPLETE</Badge>
            </div>

            <p className="text-sm text-muted-foreground mb-4">12 panels included</p>

            <div className="flex flex-wrap gap-2 mb-6">
              {["CBC", "HORMONE", "INFLAMMATION", "IRON", "KIDNEY", "LIPID", "LIVER", "METABOLIC", "METHYLATION", "NUTRITIONAL", "OTHER", "THYROID"].map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="gap-2">
                <FileText className="w-4 h-4" />
                View Original PDF
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Re-parse Report
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Archive className="w-4 h-4" />
                Archive
              </Button>
            </div>
          </div>

          {/* Biomarkers Summary */}
          <div className="mb-6">
            <span className="text-sm text-muted-foreground">80 biomarkers - </span>
            <span className="text-sm font-medium text-amber-600">17 flagged</span>
          </div>

          {/* CBC Section */}
          <Card className="p-6 border-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-primary mb-1">CBC</h2>
                <p className="text-sm text-muted-foreground">LabCorp · February 5, 2026</p>
              </div>
              <Badge className="bg-amber-100 text-amber-700 border-amber-300">4 flags</Badge>
            </div>

            <div className="space-y-6">
              {biomarkers.map((marker, idx) => (
                <div key={idx} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{marker.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-foreground">
                        {marker.value} <span className="text-sm font-normal text-muted-foreground">{marker.unit}</span>
                      </span>
                      <Badge variant="secondary" className={`text-xs ${getStatusColor(marker.status)}`}>
                        {marker.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                      {/* Functional range bar */}
                      <div 
                        className="absolute inset-y-0 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
                        style={{
                          left: '0%',
                          width: `${(marker.functionalMax / marker.conventionalMax) * 100}%`
                        }}
                      />
                      
                      {/* Current value indicator */}
                      <div 
                        className="absolute top-1/2 -translate-y-1/2"
                        style={{ left: `${getBarPosition(marker)}%` }}
                      >
                        <div className={`w-2 h-2 rounded-full border-2 border-white shadow ${
                          marker.status === "CRITICAL" ? "bg-red-600" : 
                          marker.status === "BORDERLINE" ? "bg-amber-600" : 
                          "bg-emerald-600"
                        }`}></div>
                      </div>
                    </div>

                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Functional: {marker.functionalMin}–{marker.functionalMax}</span>
                      <span>Conventional: {marker.conventionalMin}–{marker.conventionalMax}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
