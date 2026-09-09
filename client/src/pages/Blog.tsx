import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function BlogCard({ title, description, date, readTime, image }: any) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="aspect-video overflow-hidden">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-6">
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <span>{date}</span>
          <span>•</span>
          <span>{readTime}</span>
        </div>
        <h3 className="text-xl font-bold mb-3 line-clamp-2">{title}</h3>
        <p className="text-muted-foreground mb-4 line-clamp-3">{description}</p>
        <Button variant="outline" className="w-full">
          Devamını Oku
        </Button>
      </div>
    </Card>
  );
}

export default function Blog() {
  const blogPosts = [
    {
      title: "Restoran Yönetiminde Dijital Dönüşüm",
      description: "Geleneksel restoran yönetiminden modern dijital çözümlere geçiş süreci ve avantajları.",
      date: "15 Şubat 2024",
      readTime: "5 dk okuma",
      image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80"
    },
    {
      title: "Müşteri Memnuniyetini Artırmanın 5 Yolu",
      description: "Restoranınızda müşteri deneyimini iyileştirmek için uygulayabileceğiniz pratik ipuçları.",
      date: "10 Şubat 2024",
      readTime: "4 dk okuma",
      image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&q=80"
    },
    {
      title: "POS Sistemleri ile Stok Takibi",
      description: "Modern POS sistemlerinin stok yönetimindeki rolü ve işletme verimliliğine katkıları.",
      date: "5 Şubat 2024",
      readTime: "6 dk okuma",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80"
    },
    {
      title: "Restoranda Verimlilik ve Maliyet Kontrolü",
      description: "İşletme maliyetlerini düşürürken verimliliği artırmak için stratejiler ve çözümler.",
      date: "1 Şubat 2024",
      readTime: "7 dk okuma",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80"
    },
    {
      title: "Masa Rezervasyon Sistemlerinin Önemi",
      description: "Modern rezervasyon sistemleriyle müşteri memnuniyetini nasıl artırabilirsiniz?",
      date: "25 Ocak 2024",
      readTime: "5 dk okuma",
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80"
    },
    {
      title: "Restoran Analitiği ve Raporlama",
      description: "Veri analizi ile restoran performansınızı nasıl optimize edebilirsiniz?",
      date: "20 Ocak 2024",
      readTime: "8 dk okuma",
      image: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=600&q=80"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-white/0 dark:to-transparent pointer-events-none" />
        <div className="site-container text-center pt-32 relative z-10">
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
            Restoran <span className="text-primary">Blog</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Restoran yönetimi, teknoloji ve sektör trendleri hakkında en güncel bilgiler ve ipuçları.
          </p>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-24">
        <div className="site-container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post, index) => (
              <BlogCard
                key={index}
                title={post.title}
                description={post.description}
                date={post.date}
                readTime={post.readTime}
                image={post.image}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-24 bg-secondary/10">
        <div className="site-container text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-display font-bold mb-4">
              Yeni Yazılardan Haberdar Olun
            </h2>
            <p className="text-muted-foreground mb-8">
              Restoran yönetimi hakkında en güncel ipuçları ve trendler için bültenimize abone olun.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="E-posta adresiniz"
                className="flex-1 px-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button className="px-8">
                Abone Ol
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
