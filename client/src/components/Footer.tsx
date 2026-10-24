import { Link } from "wouter";
import { Facebook, Twitter, Instagram, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-black text-slate-200 py-16 border-t border-white/10">
      <div className="site-container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-6">
            <img
                src="/makethemenu-footer.png"
                alt="Makethemenu"
                draggable={false}
                className="h-11 md:h-14 w-auto max-w-[190px] md:max-w-[220px] object-contain drop-shadow-lg select-none"
              />
            <p className="text-slate-400 text-sm leading-relaxed">
              {t("footer.description")}
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300 border border-white/10 hover:border-primary">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300 border border-white/10 hover:border-primary">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300 border border-white/10 hover:border-primary">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300 border border-white/10 hover:border-primary">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-bold text-white text-lg mb-6">{t("footer.quickAccess")}</h4>
            <ul className="space-y-4">
              <li>
                <Link href="/" className="text-slate-400 hover:text-primary transition-colors cursor-pointer">
                  {t("footer.home")}
                </Link>
              </li>
              <li>
                <Link href="/ozellikler" className="text-slate-400 hover:text-primary transition-colors cursor-pointer">
                  {t("footer.features")}
                </Link>
              </li>
              <li>
                <Link href="/fiyatlar" className="text-slate-400 hover:text-primary transition-colors cursor-pointer">
                  {t("footer.pricing")}
                </Link>
              </li>
              <li>
                <Link href="/hakkimizda" className="text-slate-400 hover:text-primary transition-colors cursor-pointer">
                  {t("footer.about")}
                </Link>
              </li>
              <li>
                <Link href="/iletisim" className="text-slate-400 hover:text-primary transition-colors cursor-pointer">
                  {t("footer.contact")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h4 className="font-display font-bold text-white text-lg mb-6">{t("footer.solutions")}</h4>
            <ul className="space-y-4">
              <li><Link href="/ozellikler/restoran" className="text-slate-400 hover:text-primary transition-colors cursor-pointer">{t("footer.restaurantAuto")}</Link></li>
              <li><Link href="/ozellikler/kafe" className="text-slate-400 hover:text-primary transition-colors cursor-pointer">{t("footer.cafePos")}</Link></li>
              <li><Link href="/ozellikler/adisyon" className="text-slate-400 hover:text-primary transition-colors cursor-pointer">{t("footer.cloudOrder")}</Link></li>
              <li><Link href="/ozellikler/qr-menu" className="text-slate-400 hover:text-primary transition-colors cursor-pointer">{t("footer.qrMenu")}</Link></li>
              <li><Link href="/ozellikler/stok" className="text-slate-400 hover:text-primary transition-colors cursor-pointer">{t("footer.stockTracking")}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="min-w-0">
            <h4 className="font-display font-bold text-white text-lg mb-6">{t("footer.contactTitle")}</h4>
            <ul className="space-y-6">
              <li className="flex items-start gap-4 text-slate-400 group min-w-0">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="mt-1 break-words min-w-0">{t("footer.address1")}<br />{t("footer.address2")}</span>
              </li>
              <li className="flex items-center gap-4 text-slate-400 group min-w-0">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                  <Phone className="w-5 h-5" />
                </div>
                <span className="break-words min-w-0">+90 (212) 555 01 00</span>
              </li>
              <li className="flex items-center gap-4 text-slate-400 group min-w-0">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <span className="break-words min-w-0">info@makethemenu.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} {t("footer.rights")}</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">{t("footer.privacy")}</a>
            <a href="#" className="hover:text-white transition-colors">{t("footer.terms")}</a>
            <a href="#" className="hover:text-white transition-colors">{t("footer.kvkk")}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
