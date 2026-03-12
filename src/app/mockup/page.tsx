'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Bot,
  Send,
  Paperclip,
  Mic,
  Sparkles,
  Library,
  Beaker,
  ChevronRight,
  ExternalLink,
  Info,
  BadgeAlert,
  ShieldCheck,
  FlaskConical,
  Pill,
  Lock,
  ArrowRight
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function FreeTierAdMockup() {
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'user',
      content: 'I have a 42-year-old female patient presenting with severe chronic fatigue, joint pain, brain fog, and recent weight gain. TSH is 4.2, free T3 is borderline low. She has a history of high stress and poor sleep. What initial functional approach and protocol should I consider?'
    },
    {
      id: '2',
      role: 'assistant',
      content: `Based on the presentation of chronic fatigue, joint pain, brain fog, weight gain, and lab findings (TSH 4.2 µIU/mL, borderline low free T3) in the context of chronic stress, this clinical picture strongly suggests **HPA axis dysfunction (adrenal fatigue/dysregulation)** concurrently presenting with **subclinical hypothyroidism**, likely secondary to the chronic stress response.

Here is a functional approach and initial protocol:

### 1. Address the HPA Axis & Stress Response (Root Cause)
Chronic stress elevates cortisol initially, which inhibits the conversion of T4 to active T3, leading to functional hypothyroidism even if thyroid gland output is adequate.
*   **Adaptogenic Support:** Consider Ashwagandha (Withania somnifera) to help regulate the HPA axis and modulate cortisol levels. [Evidence shows Ashwagandha can improve thyroid function in subclinical hypothyroidism](https://doi.org/10.1089/acm.2017.0183).
*   **Lifestyle:** Emphasize sleep hygiene and stress reduction techniques (e.g., HRV biofeedback, meditation) to lower allostatic load.

### 2. Targeted Thyroid Support
While addressing the adrenals, gentle thyroid support is often necessary.
*   **Nutrient Repletion:** Ensure adequate Selenium (conversion of T4 to T3), Zinc, and Iodine.
*   **Glandulars/Extracts:** Some practitioners utilize bovine thyroid glandulars, though this requires careful monitoring.

### 3. Reduce Systemic Inflammation
Joint pain and brain fog indicate systemic inflammation, which further impairs thyroid receptor sensitivity.
*   **Curcumin:** 500-1000mg daily to reduce inflammatory cytokines.
*   **Anti-inflammatory Diet:** Elimination of refined sugars, processed foods, and potential triggers like gluten/dairy while the gut heals.`
    }
  ]);

  return (
    <div className="flex h-screen w-full bg-[#f8fafb]">
      {/* Sidebar Placeholder */}
      <div className="hidden md:flex w-[260px] flex-col border-r border-[#e2e8f0] bg-white">
        <div className="p-4 border-b border-[#e2e8f0]">
          <div className="flex items-center gap-2 font-newsreader text-xl font-bold text-brand-900">
            <span className="bg-brand-600 text-white rounded p-1">
              <Sparkles size={16} />
            </span>
            Apothecare <span className="text-xs font-sans font-medium text-slate-500 ml-1 px-2 py-0.5 bg-slate-100 rounded-full">Free</span>
          </div>
        </div>
        <div className="flex-1 p-4">
          <div className="text-sm font-medium text-slate-500 mb-2">Recent Chats</div>
          <div className="space-y-1">
            <div className="text-sm p-2 bg-brand-50 text-brand-900 rounded-md truncate cursor-pointer">42yo F - Chronic Fatigue, TSH 4.2</div>
            <div className="text-sm p-2 text-slate-600 hover:bg-slate-50 rounded-md truncate cursor-pointer">Gut protocol for SIBO recurrence</div>
            <div className="text-sm p-2 text-slate-600 hover:bg-slate-50 rounded-md truncate cursor-pointer">Normalizing elevated homocysteine</div>
          </div>
        </div>

        {/* Sidebar Inline Ad / Upgrade CTA */}
        <div className="p-4 mt-auto border-t border-[#e2e8f0]">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg p-4 text-white shadow-md relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-40 transition-opacity">
              <Lock size={48} />
            </div>
            <h4 className="font-semibold text-sm mb-1 flex items-center gap-1.5 relative z-10">
              <Sparkles size={14} className="text-amber-400" />
              Unlock Apothecare Pro
            </h4>
            <p className="text-xs text-slate-300 mb-3 relative z-10 leading-relaxed">
              Remove all sponsored clinical pathways and unlock unlimited Deep Consult queries.
            </p>
            <Button size="sm" className="w-full bg-amber-500 hover:bg-amber-600 text-white border-0 text-xs h-8 relative z-10">
              Upgrade for $89/mo
            </Button>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 px-1">
            <span>2 / 2 Queries Used</span>
            <span>Resets in 4h</span>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-[#f8fafb] relative overflow-hidden">

        {/* Header */}
        <div className="h-14 border-b border-[#e2e8f0] bg-white/80 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-10">
          <div className="font-medium text-slate-800">New Clinical Query</div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 border-slate-200">
              <Library size={12} className="mr-1" />
              Standard Knowledge Base
            </Badge>
          </div>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth pb-40">
          {messages.map((msg, i) => (
            <div key={msg.id} className={`flex gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'justify-end' : ''}`}>
          {msg.role === 'assistant' && (
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
              <Bot size={18} className="text-white" />
            </div>
          )}

          <div className={`flex flex-col gap-2 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
          <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
            msg.role === 'user'
              ? 'bg-slate-900 text-white rounded-tr-sm'
              : 'bg-white border border-[#e2e8f0] text-slate-800 rounded-tl-sm'
          }`}>
          {msg.role === 'user' ? (
            msg.content
          ) : (
            <div className="prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-headings:font-newsreader prose-headings:text-brand-900 prose-a:text-brand-600 prose-a:no-underline hover:prose-a:underline">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* AD PLACEMENT: Contextual Native Sponsorship injected immediately below the AI response */}
        {msg.role === 'assistant' && (
          <div className="w-full mt-2 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">

            {/* Diagnostic Ad block */}
            <div className="w-full bg-white border border-indigo-100 rounded-xl shadow-sm overflow-hidden relative border border-slate-200 group transition-all hover:shadow-md hover:border-indigo-200">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
              <div className="p-3 bg-indigo-50/50 border-b border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-indigo-700 border-indigo-200 bg-white font-semibold">
                    Sponsored Diagnostics
                  </Badge>
                  <span className="text-xs font-medium text-slate-600 flex items-center">
                    Relevant to <span className="font-semibold text-slate-800 ml-1">HPA Axis Dysfunction</span>
                  </span>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info size={14} className="text-slate-400 hover:text-slate-600" />
                    </TooltipTrigger>
                    <TooltipContent side="left" className="w-64 p-3 text-xs">
                      This clinical tool recommendation is brought to you by Precision Analytical. Apothecare AI maintains strict clinical independence; sponsored content is clearly marked and contextually placed based on the presented symptoms. Upgrade to Pro to disable sponsorships.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="w-12 h-12 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                  <FlaskConical size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                    DUTCH Plus® Test <span className="text-xs font-normal text-slate-500">by Precision Analytical</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                    Comprehensive assessment of sex and adrenal hormones, including the Cortisol Awakening Response (CAR), ideal for pinpointing the exact phase of HPA axis dysregulation in patients with chronic fatigue.
                  </p>
                </div>
                <Button size="sm" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 w-full md:w-auto mt-2 md:mt-0 shadow-sm shrink-0">
                  View Sample Report <ExternalLink size={14} className="ml-1.5" />
                </Button>
              </div>
            </div>

            {/* Supplement Formulary Ad block */}
            <div className="w-full bg-white border border-emerald-100 rounded-xl shadow-sm overflow-hidden relative border border-slate-200 group transition-all hover:shadow-md hover:border-emerald-200">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
              <div className="p-3 bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-emerald-700 border-emerald-200 bg-white font-semibold">
                    Sponsored Protocol
                  </Badge>
                  <span className="text-xs font-medium text-slate-600 flex items-center">
                    Relevant to <span className="font-semibold text-slate-800 ml-1">Thyroid / Adrenal Support</span>
                  </span>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <ShieldCheck size={14} className="text-emerald-600" />
                    </TooltipTrigger>
                    <TooltipContent side="left" className="w-64 p-3 text-xs">
                      This protocol is backed by clinical data submitted by the sponsor and verified by Apothecare's internal medical review team.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                    <Pill size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                      Thyroid Synergy™ & Adrenotone™ <span className="text-xs font-normal text-slate-500">by Designs for Health</span>
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      A synergistic two-part protocol offering targeted Ashwagandha (standardized withanolides), Selenium, Zinc, and glandular support for patients exhibiting high stress and sluggish T4 to T3 conversion.
                    </p>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer">
                        📚 View Clinical Trial Data
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer">
                        🛒 Add to Fullscript Cart
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

      {msg.role === 'user' && (
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-1 font-semibold text-sm text-slate-600 font-sans shadow-sm ring-1 ring-slate-300">
          DR
        </div>
      )}
    </div>
  ))
}
        </div>

  {/* Input Area */}
  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#f8fafb] via-[#f8fafb] to-transparent pt-10 pb-6 md:pb-8 px-4 md:px-8">
    <div className="max-w-4xl mx-auto relative group">

      <div className="absolute -top-10 left-0 right-0 flex justify-center opacity-100 transition-opacity duration-300">
        <div className="bg-slate-800 text-white text-[10px] px-3 py-1.5 rounded-full font-medium tracking-wide shadow-md flex items-center gap-2">
          <BadgeAlert size={12} className="text-amber-400" />
          You are on the Free Tier: 0 Queries Remaining
          <span className="w-px h-3 bg-slate-600 mx-1"></span>
          <span className="text-amber-400 cursor-pointer hover:underline flex items-center">
            Upgrade <ArrowRight size={10} className="ml-0.5" />
          </span>
        </div>
      </div>

      <div className="w-full bg-white border-2 border-slate-200 shadow-lg rounded-2xl overflow-hidden focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-50 transition-all opacity-70 cursor-not-allowed">
        <textarea
          placeholder="Upgrade to Apothecare Pro to continue asking clinical questions..."
          className="w-full max-h-[200px] min-h-[60px] resize-none overflow-y-auto bg-transparent border-0 focus:ring-0 p-4 text-sm text-slate-900 placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50"
          disabled
        />
        <div className="flex items-center justify-between px-3 pb-3 pt-1 border-t border-slate-100 bg-slate-50">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full shrink-0" disabled>
              <Paperclip size={18} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full shrink-0" disabled>
              <Mic size={18} />
            </Button>
            <div className="h-4 w-px bg-slate-300 mx-1"></div>
            <Button variant="ghost" size="sm" className="h-8 text-xs font-medium text-slate-500 hover:bg-slate-100" disabled>
              Functional
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-xs font-medium text-slate-500 hover:bg-slate-100" disabled>
              Sources
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-8 w-8 p-0 rounded-full bg-slate-300 text-white cursor-not-allowed shrink-0"
              disabled
            >
              <Send size={14} className="" />
            </Button>
          </div>
        </div>
      </div>
      <div className="text-center mt-3">
        <span className="text-[10px] text-slate-400">
          Apothecare can make mistakes. Consider verifying important clinical information independently.
        </span>
      </div>
    </div>
    </div>
        </div>
      </div>
    </div>
  );
}
