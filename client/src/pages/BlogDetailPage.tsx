import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link, useRoute } from "wouter";
import { ArrowLeft, CalendarDays, Clock, ArrowRight } from "lucide-react";
import { getBlogPost, blogPosts } from "@/lib/blog-posts";
import { Button } from "@/components/ui/button";

export default function BlogDetailPage() {
  const [, params] = useRoute("/kaynaklar/blog/:slug");
  const post = getBlogPost(params?.slug || "");
  const others = blogPosts.filter((p) => p.slug !== post?.slug).slice(0, 3);

  if (!post) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <section className="site-container py-40 text-center">
          <h1 className="text-4xl font-display font-bold mb-6">
            Yazı <span className="text-primary">Bulunamadı</span>
          </h1>
          <p className="text-muted-foreground mb-8">Aradığınız blog yazısı kaldırılmış veya taşınmış olabilir.</p>
          <Link href="/kaynaklar/blog">
            <Button className="rounded-full px-8 h-14">
              <ArrowLeft className="w-4 h-4 mr-2" /> Tüm Yazılara Dön
            </Button>
          </Link>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-white/0 dark:to-transparent pointer-events-none" />
        <div className="site-container text-center pt-32 relative z-10 max-w-4xl">
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-6">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4" /> {post.date}
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> {post.readTime}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
            {post.title.split(" ").map((word, i, arr) =>
              i === arr.length - 1 ? (
                <span key={i} className="text-primary">{word}</span>
              ) : (
                <span key={i}>{word} </span>
              )
            )}
          </h1>
          <p className="text-xl text-muted-foreground">{post.description}</p>
        </div>
      </section>

      <section className="pb-8">
        <div className="site-container max-w-4xl">
          <div className="aspect-video overflow-hidden rounded-3xl border border-border/50 shadow-sm">
            <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="site-container max-w-4xl">
          <article className="space-y-10">
            {post.sections.map((section, i) => (
              <div key={i}>
                <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
                  {section.heading}
                </h2>
                <div className="space-y-4">
                  {section.paragraphs.map((p, j) => (
                    <p key={j} className="text-lg leading-relaxed text-muted-foreground">
                      {p}
                    </p>
                  ))}
                </div>
                {section.list && (
                  <ul className="mt-4 space-y-2">
                    {section.list.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-lg text-muted-foreground">
                        <span className="text-primary font-bold mt-0.5">•</span> {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </article>

          <div className="mt-12 pt-8 border-t border-border/50">
            <Link href="/kaynaklar/blog" className="inline-flex items-center gap-2 text-primary font-semibold hover:underline">
              <ArrowLeft className="w-4 h-4" /> Tüm Yazılara Dön
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="site-container">
          <h2 className="text-3xl font-display font-bold mb-8 text-center">
            Diğer <span className="text-primary">Yazılar</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {others.map((other) => (
              <Link key={other.slug} href={`/kaynaklar/blog/${other.slug}`}>
                <div className="bg-card rounded-2xl overflow-hidden border border-border/50 hover:shadow-lg transition-shadow h-full flex flex-col">
                  <div className="aspect-video overflow-hidden">
                    <img src={other.image} alt={other.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="text-sm text-muted-foreground mb-2">{other.date} • {other.readTime}</div>
                    <h3 className="font-bold mb-2">{other.title}</h3>
                    <span className="mt-auto inline-flex items-center gap-1 text-primary text-sm font-semibold">
                      Devamını Oku <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
