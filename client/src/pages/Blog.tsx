import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { blogPosts } from "@/lib/blog-posts";

function BlogCard({ slug, title, description, date, readTime, image }: {
  slug: string; title: string; description: string; date: string; readTime: string; image: string;
}) {
  return (
    <Link href={`/kaynaklar/blog/${slug}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full group">
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
          <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary">
            Devamını Oku
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>
    </Link>
  );
}

export default function Blog() {
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
