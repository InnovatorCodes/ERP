"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";

// Client-side frame (collapsible sidebar + scrolling content) so the root
// layout itself can stay a server component.
export function AppShell({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar Wrapper - Fixed Height */}
      <div className="h-full shrink-0">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>

      {/* Main Content Area - Scrollable */}
      <main className="flex-1 h-full overflow-y-auto overflow-x-hidden relative flex flex-col">
        {children}
      </main>
    </div>
  );
}
