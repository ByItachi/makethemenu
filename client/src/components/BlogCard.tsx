import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Ortak blog kartı — ana sayfa ve blog listeleme sayfası aynı kartı kullanır.
 * "Devamını Oku" gerçek bir bağlantıdır (related post slug'ı ile) ve kartlar
 * eşit yükseklikte dizilir: butonlar flex mt-auto ile alt hizada hizalanır.
 */
export function BlogCard({ slug, title, description, date, readTime, image, readMore = "Devamını Oku" }: {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: string;
  image: string;
  readMore?: string;
}) {
  const href = `/kaynaklar/blog/${slug}`;
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
      <div className="aspect-video overflow-hidden">
        <Link href={href} aria-label={`${title} — yazıyı oku`} tabIndex={-1} aria-hidden="true">
          <img
            src={image}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </Link>
      </div>
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <span>{date}</span>
          <span aria-hidden="true">•</span>
          <span>{readTime}</span>
        </div>
        <h3 className="text-xl font-bold mb-3 line-clamp-2">
          <Link href={href} className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
            {title}
          </Link>
        </h3>
        <p className="text-muted-foreground mb-6 line-clamp-3 flex-1">{description}</p>
        <Button
          variant="outline"
          className="w-full mt-auto group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          asChild
        >
          <Link href={href} aria-label={`${title} yazısının devamını oku`}>
            {readMore}
            <ArrowRight className="w-4 h-4 ml-2 shrink-0" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
