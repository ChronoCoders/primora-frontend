import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

/// The shared app shell: fixed sidebar + top bar + scrolling content frame,
/// matching design-reference/overview.html (.layout / .sidebar / .topbar /
/// .content / .inner). Defined once and wrapped around every page.
export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar />
        <div className="flex-1 overflow-auto p-6">
          <div className="mx-auto flex max-w-[1100px] flex-col gap-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
