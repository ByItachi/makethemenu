import { Link } from "wouter";
import { Facebook, Twitter, Instagram, Linkedin, Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-200 py-16 mt-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-display font-bold">
                P
              </div>
              <span className="font-display font-bold text-xl text-white">
                Pos<span className="text-blue-500">Sistem</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              İşletmeniz için modern, hızlı ve güvenilir POS çözümleri. Restoran, kafe ve mağazalar için tasarlandı.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="hover:text-white transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-bold text-white mb-6">Hızlı Bağlantılar</h4>
            <ul className="space-y-3">
              <li><Link href="/" className="text-slate-400 hover:text-blue-400 transition-colors">Anasayfa</Link></li>
              <li><Link href="/features" className="text-slate-400 hover:text-blue-400 transition-colors">Özellikler</Link></li>
              <li><Link href="/prices" className="text-slate-400 hover:text-blue-400 transition-colors">Fiyatlar</Link></li>
              <li><Link href="/about" className="text-slate-400 hover:text-blue-400 transition-colors">Hakkımızda</Link></li>
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h4 className="font-display font-bold text-white mb-6">Çözümler</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">Restoran POS</a></li>
              <li><a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">Kafe Otomasyonu</a></li>
              <li><a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">Stok Takibi</a></li>
              <li><a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">Raporlama</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-bold text-white mb-6">İletişim</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-slate-400">
                <MapPin className="w-5 h-5 text-blue-500 shrink-0" />
                <span>Teknoloji Vadisi, No: 123<br />İstanbul, Türkiye</span>
              </li>
              <li className="flex items-center gap-3 text-slate-400">
                <Phone className="w-5 h-5 text-blue-500 shrink-0" />
                <span>+90 (212) 555 00 00</span>
              </li>
              <li className="flex items-center gap-3 text-slate-400">
                <Mail className="w-5 h-5 text-blue-500 shrink-0" />
                <span>info@possistem.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} PosSistem Teknoloji A.Ş. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </footer>
  );
}
