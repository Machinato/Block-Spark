"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Menu, Zap, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/language-context"
import { localeNames, type Locale } from "@/lib/i18n"

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const { locale, setLocale, t } = useLanguage()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const isConnected = false

  const navLinks = [
    { href: "/campaigns", label: t("campaigns") },
    { href: "/create", label: t("create") },
    { href: "/#how-it-works", label: t("howItWorks") },
    { href: "/profile", label: t("profile") }
  ]

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        isScrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border"
          : "bg-transparent"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">

          {/* Логотип — той самий шрифт що і на сторінці */}
          <Link href="/" className="flex items-center gap-2 group">
            <motion.div
              className="relative"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              {/* Іконка — блискавка як символ енергії/spark */}
              <Zap className="w-5 h-5 md:w-6 md:h-6 text-prism-from fill-prism-from/30" />
            </motion.div>
            {/* font-sans — той самий Space Grotesk що і скрізь */}
            <span className="text-xl md:text-2xl font-bold font-sans tracking-tight text-foreground">
              Block<span className="text-prism-from">Spark</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium relative group"
              >
                {link.label}
                {/* Підкреслення при hover */}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-prism-from/40 group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Globe className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-card border-border"
              >
                {(Object.keys(localeNames) as Locale[]).map((loc) => (
                  <DropdownMenuItem
                    key={loc}
                    onClick={() => setLocale(loc)}
                    className={cn(
                      "cursor-pointer text-sm",
                      locale === loc ? "text-prism-from" : "text-muted-foreground"
                    )}
                  >
                    {localeNames[loc]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Connect Button */}
            {/* TODO: Implement Wagmi useAccount */}
            <Button
              className="bg-gradient-to-r from-prism-from to-prism-to text-primary-foreground hover:opacity-90 border-0 h-9 px-5 text-sm rounded-full font-semibold"
              onClick={() => { }}
            >
              {isConnected ? t("connected") : t("connectWallet")}
            </Button>
          </div>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                aria-label="Toggle menu"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[280px] bg-background border-border"
            >
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="flex flex-col gap-8 mt-8">
                <nav className="flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-lg text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>

                <div className="flex gap-2">
                  {(Object.keys(localeNames) as Locale[]).map((loc) => (
                    <Button
                      key={loc}
                      variant="outline"
                      size="sm"
                      className={cn(
                        "flex-1 border-border text-sm",
                        locale === loc
                          ? "bg-prism-from/10 text-prism-from border-prism-from/30"
                          : "text-muted-foreground"
                      )}
                      onClick={() => setLocale(loc)}
                    >
                      {loc.toUpperCase()}
                    </Button>
                  ))}
                </div>

                {/* TODO: Implement Wagmi useAccount */}
                <Button
                  className="bg-gradient-to-r from-prism-from to-prism-to text-primary-foreground hover:opacity-90 border-0 w-full rounded-full font-semibold"
                  onClick={() => setIsOpen(false)}
                >
                  {t("connectWallet")}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}