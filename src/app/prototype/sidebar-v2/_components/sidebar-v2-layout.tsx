"use client";

import { useState, useCallback } from "react";
import { IconRail, MobileTabBar } from "./icon-rail";
import { ExpandablePanel, MobilePanel } from "./expandable-panel";
import { MockDashboard } from "./mock-dashboard";
import {
  MockPatientsPage,
  MockVisitsPage,
  MockLabsPage,
  MockSupplementsPage,
} from "./mock-pages";

/** These nav items open the expandable panel flyout */
const PANEL_SECTIONS = new Set(["conversations", "visits", "patients"]);

export function SidebarV2Layout() {
  const [activePage, setActivePage] = useState("dashboard");
  const [activePanel, setActivePanel] = useState<string | null>(null);

  const isPanelOpen =
    activePanel !== null && PANEL_SECTIONS.has(activePanel);

  const handlePageChange = useCallback((page: string) => {
    setActivePage(page);
  }, []);

  const handlePanelChange = useCallback((panel: string | null) => {
    setActivePanel(panel);
  }, []);

  const handleClosePanel = useCallback(() => {
    setActivePanel(null);
  }, []);

  // Main content margin: 64px (rail) + 280px (panel) when open
  const RAIL_WIDTH = 64;
  const PANEL_WIDTH = 280;
  const mainMarginLeft = isPanelOpen ? RAIL_WIDTH + PANEL_WIDTH : RAIL_WIDTH;

  // Render the active page content
  const renderPage = () => {
    switch (activePage) {
      case "patients":
        return <MockPatientsPage />;
      case "visits":
        return <MockVisitsPage />;
      case "labs":
        return <MockLabsPage />;
      case "supplements":
        return <MockSupplementsPage />;
      case "dashboard":
      default:
        return <MockDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      {/* Desktop: Icon Rail */}
      <IconRail
        activePage={activePage}
        activePanel={activePanel}
        onPageChange={handlePageChange}
        onPanelChange={handlePanelChange}
      />

      {/* Desktop: Expandable Panel */}
      <ExpandablePanel
        isOpen={isPanelOpen}
        activeSection={activePanel}
        onClose={handleClosePanel}
      />

      {/* Mobile: Bottom Tab Bar */}
      <MobileTabBar
        activePage={activePage}
        activePanel={activePanel}
        onPageChange={handlePageChange}
        onPanelChange={handlePanelChange}
      />

      {/* Mobile: Bottom Sheet Panel */}
      <MobilePanel
        isOpen={isPanelOpen}
        activeSection={activePanel}
        onClose={handleClosePanel}
      />

      {/* Main content */}
      <main
        className="min-h-screen pb-14 md:pb-0"
        onClick={() => {
          // Click on main content closes panel (desktop)
          if (isPanelOpen) handleClosePanel();
        }}
      >
        {/* Desktop margin via style (dynamic value) */}
        <div
          className="hidden md:block min-h-screen transition-[margin-left] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ marginLeft: mainMarginLeft }}
        >
          {renderPage()}
        </div>

        {/* Mobile: no left margin, just bottom padding */}
        <div className="md:hidden min-h-screen">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
