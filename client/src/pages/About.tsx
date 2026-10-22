import { motion } from "framer-motion";

export default function About() {
  return (
    <div className="pt-56 pb-24">
      {/* Hero */}
      <div className="site-container mb-24">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-8 text-slate-900">
            Restoran Teknolojilerini <br/>
            <span className="text-primary">Yeniden Tanımlıyoruz</span>
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed">
            2020 yılında, işletmelerin karmaşık operasyonlarını basitleştirmek ve verimliliği artırmak amacıyla yola çıktık. Bugün 81 ilde binlerce işletmenin güvenilir teknoloji ortağıyız.
          </p>
        </div>
      </div>

      {/* Story Section */}
      <section className="py-20 bg-slate-50">
        <div className="site-container">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
               {/* Team meeting office collaboration */}
               <img 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop" 
                alt="Our Team" 
                className="rounded-3xl shadow-2xl"
              />
            </motion.div>
            <div>
              <h2 className="text-3xl font-display font-bold mb-6 text-slate-900">Misyonumuz</h2>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Amacımız, en küçük kafeden en büyük restoran zincirine kadar her işletmeye, ulaşılabilir, modern ve güçlü teknolojik altyapı sağlamaktır. İşletme sahiplerinin teknolojiye değil, misafirlerine odaklanmasını istiyoruz.
              </p>
              <h2 className="text-3xl font-display font-bold mb-6 text-slate-900 mt-12">Değerlerimiz</h2>
              <ul className="space-y-4">
                {[
                  { title: "Müşteri Odaklılık", desc: "Her geliştirmeyi müşterilerimizi dinleyerek yapıyoruz." },
                  { title: "Sürekli İnovasyon", desc: "Teknolojiyi yakından takip ediyor, sistemimizi her gün geliştiriyoruz." },
                  { title: "Şeffaflık", desc: "Gizli maliyetler yok, açık ve dürüst iletişim var." }
                ].map((val, i) => (
                  <li key={i} className="bg-white p-4 rounded-xl border border-border shadow-sm">
                    <h4 className="font-bold text-slate-900">{val.title}</h4>
                    <p className="text-sm text-slate-500">{val.desc}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
      
      {/* Stats */}
      <section className="py-20 bg-primary text-white">
        <div className="site-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { val: "5000+", label: "Mutlu Müşteri" },
              { val: "81", label: "İl" },
              { val: "10M+", label: "Aylık Sipariş" },
              { val: "7/24", label: "Canlı Destek" }
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.val}</div>
                <div className="text-blue-100 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
