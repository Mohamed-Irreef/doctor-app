import { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-bg-main">
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        collapsed={desktopSidebarCollapsed}
      />

      <div
        className={`min-h-screen transition-all duration-300 ${
          desktopSidebarCollapsed ? "lg:ml-[84px]" : "lg:ml-[260px]"
        }`}
      >
        <Header
          onOpenSidebar={() => setMobileSidebarOpen(true)}
          onToggleDesktopSidebar={() =>
            setDesktopSidebarCollapsed((prev) => !prev)
          }
          desktopSidebarCollapsed={desktopSidebarCollapsed}
        />

        <main className="mx-auto w-full max-w-[1680px] px-4 pb-8 pt-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
