import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Globe, ShieldCheck, FlaskConical, Building2 } from "lucide-react";
import { Link } from "wouter";
import { useApp } from "@/lib/store";
import { ChemicalImage } from "@/components/chemical-image";
import { EditableText } from "@/lib/content";

export default function Home() {
  const { products } = useApp();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/lab-glassware.png"
            alt="Chemical R&D Laboratory"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-primary/60 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-transparent opacity-90" />
        </div>

        {/* Content */}
        <div className="container relative z-10 px-4 text-center">

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-6 leading-tight drop-shadow-lg">
            <EditableText name="home.hero_title_1" default="Precision in Chemistry." /><br />
            <span className="text-gold"><EditableText name="home.hero_title_2" default="Power in Global Trade." /></span>
          </h1>
          <div className="text-lg md:text-xl text-gray-200 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
            <EditableText
              name="home.hero_subtitle"
              default="Dual Life Chemicals connects industrial manufacturers with high-purity chemical supply chains worldwide. Reliable, compliant, and scalable."
              multiline
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products">
              <Button size="lg" className="bg-gold hover:bg-gold/90 text-primary font-bold h-12 px-8 text-base">
                Explore Catalog
              </Button>
            </Link>

          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center md:divide-x divide-gray-100">
            <div>
              <p className="text-4xl font-bold text-primary mb-2 font-display">
                <EditableText name="home.stat_1_value" default="25+" />
              </p>
              <p className="text-sm text-muted-foreground uppercase tracking-wider">
                <EditableText name="home.stat_1_label" default="Countries Served" />
              </p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary mb-2 font-display">
                <EditableText name="home.stat_2_value" default="50k" />
              </p>
              <p className="text-sm text-muted-foreground uppercase tracking-wider">
                <EditableText name="home.stat_2_label" default="Tons Annually" />
              </p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary mb-2 font-display">
                <EditableText name="home.stat_3_value" default="12" />
              </p>
              <p className="text-sm text-muted-foreground uppercase tracking-wider">
                <EditableText name="home.stat_3_label" default="Global Hubs" />
              </p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary mb-2 font-display">
                <EditableText name="home.stat_4_value" default="100%" />
              </p>
              <p className="text-sm text-muted-foreground uppercase tracking-wider">
                <EditableText name="home.stat_4_label" default="Compliance" />
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About / Pillars Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              <EditableText name="home.why_us_title" default="Why Industry Leaders Choose Us" />
            </h2>
            <div className="text-muted-foreground text-lg">
              <EditableText
                name="home.why_us_subtitle"
                default="We operate at the intersection of rigorous science and efficient logistics, ensuring your supply chain never falters."
                multiline
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow bg-white group">
              <CardContent className="p-8">
                <div className="h-12 w-12 bg-primary/5 text-primary rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-gold transition-colors">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">
                  <EditableText name="home.pillar_1_title" default="Certified Compliance" />
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  <EditableText
                    name="home.pillar_1_desc"
                    default="Every shipment is accompanied by complete documentation, COA, and MSDS. We adhere to REACH, OSHA, and international safety standards."
                    multiline
                  />
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow bg-white group">
              <CardContent className="p-8">
                <div className="h-12 w-12 bg-primary/5 text-primary rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-gold transition-colors">
                  <Globe className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">
                  <EditableText name="home.pillar_2_title" default="Global Logistics Network" />
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  <EditableText
                    name="home.pillar_2_desc"
                    default="With warehousing in Rotterdam, Singapore, and Houston, we ensure Just-In-Time delivery for critical industrial processes."
                    multiline
                  />
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow bg-white group">
              <CardContent className="p-8">
                <div className="h-12 w-12 bg-primary/5 text-primary rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-gold transition-colors">
                  <FlaskConical className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">
                  <EditableText name="home.pillar_3_title" default="Purity Guaranteed" />
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  <EditableText
                    name="home.pillar_3_desc"
                    default="Our rigorous quality control labs test every batch before dispatch. We don't trade commodities; we deliver precision."
                    multiline
                  />
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>



      {/* Featured Products */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-primary mb-2">Featured Products</h2>
              <p className="text-muted-foreground">High-demand industrial chemicals available for immediate order.</p>
            </div>
            <Link href="/products">
              <Button variant="ghost" className="group text-primary">
                View All Catalog <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.slice(0, 4).map((product) => (
              <Link key={product.id} href={`/product/${product.id}`}>
                <Card className="h-full border border-gray-100 hover:border-primary/20 hover:shadow-xl transition-all cursor-pointer group bg-white overflow-hidden flex flex-col">
                  <div className="relative aspect-[4/3] bg-gray-50 flex items-center justify-center overflow-hidden border-b">
                    <div className="absolute inset-0 p-6 flex items-center justify-center">
                      <ChemicalImage
                        src={product.image}
                        alt={product.name}
                        casNumber={product.casNumber}
                        className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  </div>
                  <CardContent className="p-5 flex-1 flex flex-col">
                    <p className="text-[10px] font-bold text-gold uppercase tracking-wider mb-2">{product.category}</p>
                    <h3 className="font-sans font-bold text-primary text-lg mb-2 leading-tight group-hover:text-blue-700 transition-colors line-clamp-2">{product.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{product.description}</p>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                      <span className="text-xs text-gray-400 font-mono">Bulk Available</span>
                      <div className="h-8 w-8 rounded-full bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 font-display">
            <EditableText name="home.cta_title" default="Ready to streamline your supply chain?" />
          </h2>
          <div className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            <EditableText
              name="home.cta_desc"
              default="Create a verified corporate account today to access wholesale pricing, net-30 payment terms, and dedicated account management."
              multiline
            />
          </div>
          <div className="flex justify-center gap-4">

            <Link href="/contact">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
