import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

export function TrialPopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Show popup after 3 seconds
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="bg-white rounded-2xl p-8 md:p-10 w-full max-w-md relative shadow-2xl text-center"
          >
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-black transition-colors p-2 hover:bg-slate-100 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl md:text-3xl font-display font-semibold mb-8 leading-snug text-slate-900">
              Hiçbir risk almadan <span className="text-primary">Makethemenu</span>'nün avantajlarını test edin.
            </h2>

            <ul className="text-left max-w-sm mx-auto space-y-4 mb-8 text-slate-600">
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-primary shrink-0" /> 
                <span className="font-medium">Kurulum yok</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-primary shrink-0" /> 
                <span className="font-medium">Ücretsiz kullanım</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-primary shrink-0" /> 
                <span className="font-medium">Dakikalar içinde sipariş al</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-primary shrink-0" /> 
                <span className="font-medium">Sipariş – masa – stok senkron yönetimi</span>
              </li>
            </ul>

            <div className="flex justify-center">
              <Link href="/iletisim">
                <Button className="w-full text-white h-14 rounded-xl font-bold text-lg hover:scale-[1.02] transition-transform shadow-xl shadow-primary/20">
                  Ücretsiz Denemeyi Başlat
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
