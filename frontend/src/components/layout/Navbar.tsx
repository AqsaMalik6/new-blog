"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { isAuthenticated } from "@/lib/auth";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    setIsLoggedIn(isAuthenticated());
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/80 backdrop-blur-md border-b py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-6 h-full flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          AI<span className="text-primary">Blog</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="#how-it-works" className="hover:text-primary transition-colors">
            How It Works
          </Link>
          <Link href="#strategies" className="hover:text-primary transition-colors">
            Strategies
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <Link
              href="/workspace"
              className="bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Go to Workspace
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
                Log In
              </Link>
              <Link
                href="/signup"
                className="bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
