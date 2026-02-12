import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/", label: "Anasayfa" },
    { href: "/features", label: "Özellikler" },
    { href: "/prices", label: "Fiyatlar" },
    { href: "/about", label: "Hakkımızda" },
    { href: "/contact", label: "İletişim" },
  ];

  const isActive = (path: string) => location === path;

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "glass-nav py-3" : "bg-transparent py-5"}`}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center text-white font-display font-bold text-xl shadow-lg shadow-primary/25 group-hover:scale-105 transition-transform">
              P
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-foreground">
              Pos<span className="text-primary">Sistem</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                className={`text-sm font-medium transition-colors hover:text-primary ${isActive(link.href) ? "text-primary font-semibold" : "text-muted-foreground"}`}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/contact">
              <Button className="rounded-full px-6 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:-translate-y-0.5">
                Ücretsiz Dene <ChevronRight className="ml-1 w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button 
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-b border-border"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`text-lg font-medium py-2 border-b border-border/50 ${isActive(link.href) ? "text-primary" : "text-foreground"}`}
                >
                  {link.label}
                </Link>
              ))}
              <Link href="/contact" onClick={() => setIsOpen(false)}>
                <Button className="w-full mt-2">Hemen Başla</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
