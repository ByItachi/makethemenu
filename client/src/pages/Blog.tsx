import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BlogCard } from "@/components/BlogCard";
import { Button } from "@/components/ui/button";
import { blogPosts } from "@/lib/blog-posts";
import { useSeo } from "@/lib/seo";
import { trackEvent } from "@/lib/analytics";

export default function Blog() {
  useSeo({
    title: "Blog — Restoran Yönetimi ve Teknoloji",
    description:
      "Restoran yönetimi, POS, dijital menü ve sektör trendleri hakkında en güncel bilgiler, ipuçları ve rehberler. Makethemenu blog.",
    path: "/kaynaklar/blog",
    breadcrumbs: [
      { name: "Ana Sayfa", path: "/" },
      { name: "Kaynaklar", path: "/kaynaklar/blog" },
      { name: "Blog", path: "/kaynaklar/blog" },
    ],
  });

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
            {blogPosts.map((post) => (
              <BlogCard
                key={post.slug}
                slug={post.slug}
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
            <form
              className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
              onSubmit={(e) => {
                e.preventDefault();
                trackEvent("generate_lead", { lead_type: "newsletter" });
                (e.target as HTMLFormElement).reset();
              }}
            >
              <label htmlFor="blog-newsletter-email" className="sr-only">E-posta adresiniz</label>
              <input
                id="blog-newsletter-email"
                type="email"
                required
                placeholder="E-posta adresiniz"
                className="flex-1 px-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button type="submit" className="px-8">
                Abone Ol
              </Button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
