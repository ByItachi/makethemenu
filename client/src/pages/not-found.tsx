import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground overflow-hidden relative px-4">
      {/* Decorative floating orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-primary/20 rounded-full blur-[100px]"
        animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px]"
        animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="relative z-10 flex flex-col items-center text-center max-w-md"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.15 } },
        }}
      >
        <motion.img
          src="/makethemenu-header.png"
          alt="makethemenu"
          draggable={false}
          className="h-14 w-auto max-w-[220px] object-contain select-none mb-10 block dark:hidden"
          variants={{ hidden: { opacity: 0, y: -10 }, visible: { opacity: 1, y: 0 } }}
        />
        <motion.img
          src="/makethemenu-footer.png"
          alt="makethemenu"
          draggable={false}
          className="h-14 w-auto max-w-[220px] object-contain select-none mb-10 hidden dark:block"
          variants={{ hidden: { opacity: 0, y: -10 }, visible: { opacity: 1, y: 0 } }}
        />

        <motion.div
          className="flex items-center justify-center gap-4 mb-2"
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
        >
          {["4", "0", "4"].map((digit, i) => (
            <motion.span
              key={i}
              className="text-7xl sm:text-8xl font-display font-bold text-primary"
              initial={{ y: -40, opacity: 0, rotate: -15 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              transition={{
                delay: 0.3 + i * 0.12,
                type: "spring",
                stiffness: 260,
                damping: 14,
              }}
            >
              {digit}
            </motion.span>
          ))}
        </motion.div>

        <motion.div
          animate={{ y: [0, -8, 0], rotate: [0, -6, 6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
          className="mb-6 mt-2 h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center"
        >
          <SearchX className="h-7 w-7" />
        </motion.div>

        <motion.h1
          className="text-2xl font-display font-bold mb-3"
          variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
        >
          Sayfa Bulunamadı
        </motion.h1>
        <motion.p
          className="text-muted-foreground leading-relaxed mb-8"
          variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
        >
          Aradığınız sayfa mevcut değil veya taşınmış olabilir. Menüden aradığınızı bulamıyorsanız anasayfaya göz atabilirsiniz.
        </motion.p>

        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
          <Link href="/">
            <Button size="lg" className="rounded-full px-8 gap-2 shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-transform">
              <Home className="h-4 w-4" />
              Anasayfaya Dön
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
