"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, LayoutDashboard, FileText, User } from "lucide-react";

export default function WorkspaceHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { name: "Workspace", href: "/workspace", icon: <LayoutDashboard size={18} /> },
    { name: "Blogs", href: "/workspace/blogs", icon: <FileText size={18} /> },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 h-16 border-b border-border bg-card/50 backdrop-blur-md z-40">
      <div className="container mx-auto px-6 h-full flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/workspace" className="text-xl font-bold tracking-tighter">
            AI<span className="text-primary">Blog</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <User size={14} />
            </div>
            <span className="text-xs font-semibold">{user?.brand_name || "Workspace"}</span>
          </div>
          
          <button
            onClick={logout}
            className="p-2 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
            title="Log Out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
