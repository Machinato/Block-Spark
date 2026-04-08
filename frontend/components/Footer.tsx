"use client"

import Link from "next/link"
import { Sparkles } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

export function Footer() {
  const { t } = useLanguage()
  
  return (
    <footer className="border-t border-fuchsia-500/20 bg-[#0d0a14] relative overflow-hidden">
      {/* Subtle gradient orb */}
      <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-96 h-32 bg-gradient-to-t from-fuchsia-500/10 to-transparent blur-3xl" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Sparkles className="w-5 h-5 text-fuchsia-400" />
            <span className="text-lg font-bold currents-text">BlockSpark</span>
          </Link>

          {/* Links */}
          <nav className="flex items-center gap-6 text-sm text-violet-300">
            <Link href="/campaigns" className="hover:text-fuchsia-400 transition-colors">
              {t("campaigns")}
            </Link>
            <Link href="/create" className="hover:text-fuchsia-400 transition-colors">
              {t("create")}
            </Link>
            <Link href="/profile" className="hover:text-fuchsia-400 transition-colors">
              {t("profile")}
            </Link>
          </nav>

          {/* Copyright */}
          <p className="text-sm text-violet-400/60">
            {t("builtOn")}
          </p>
        </div>
      </div>
    </footer>
  )
}
