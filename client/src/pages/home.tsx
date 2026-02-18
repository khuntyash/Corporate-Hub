import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Globe, ShieldCheck, FlaskConical, Building2 } from "lucide-react";
import { Link } from "wouter";
import { useApp } from "@/lib/store";

export default function Home() {
  const { products } = useApp();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/hero-chemical-plant.png" 
            alt="Chemical Plant" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-primary/60 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-transparent opacity-90" />
        </div>

        {/* Content */}
        <div className="container relative z-10 px-4 text-center">
          <Badge variant="outline" className="mb-6 text-gold border-gold/50 bg-primary/50 backdrop-blur-sm px-4 py-1 text-sm uppercase tracking-widest">
            ISO 9001:2015 Certified
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-6 leading-tight drop-shadow-lg">
            Precision in Chemistry.<br />
            <span className="text-gold">Power in Global Trade.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
            Dual Life Chemicals connects industrial manufacturers with high-purity chemical supply chains worldwide. Reliable, compliant, and scalable.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products">
              <Button size="lg" className="bg-gold hover:bg-gold/90 text-primary font-bold h-12 px-8 text-base">
                Explore Catalog
              </Button>
            </Link>
            <Link href="/auth?tab=register">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10 h-12 px-8 text-base">
                Become a Partner
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-gray-100">
            <div>
              <p className="text-4xl font-bold text-primary mb-2 font-display">25+</p>
              <p className="text-sm text-muted-foreground uppercase tracking-wider">Countries Served</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary mb-2 font-display">50k</p>
              <p className="text-sm text-muted-foreground uppercase tracking-wider">Tons Annually</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary mb-2 font-display">12</p>
              <p className="text-sm text-muted-foreground uppercase tracking-wider">Global Hubs</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary mb-2 font-display">100%</p>
              <p className="text-sm text-muted-foreground uppercase tracking-wider">Compliance</p>
            </div>
          </div>
        </div>
      </section>

      {/* About / Pillars Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Why Industry Leaders Choose Us</h2>
            <p className="text-muted-foreground text-lg">
              We operate at the intersection of rigorous science and efficient logistics, ensuring your supply chain never falters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow bg-white group">
              <CardContent className="p-8">
                <div className="h-12 w-12 bg-primary/5 text-primary rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-gold transition-colors">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">Certified Compliance</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Every shipment is accompanied by complete documentation, COA, and MSDS. We adhere to REACH, OSHA, and international safety standards.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow bg-white group">
              <CardContent className="p-8">
                <div className="h-12 w-12 bg-primary/5 text-primary rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-gold transition-colors">
                  <Globe className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">Global Logistics Network</h3>
                <p className="text-muted-foreground leading-relaxed">
                  With warehousing in Rotterdam, Singapore, and Houston, we ensure Just-In-Time delivery for critical industrial processes.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow bg-white group">
              <CardContent className="p-8">
                <div className="h-12 w-12 bg-primary/5 text-primary rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-gold transition-colors">
                  <FlaskConical className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">Purity Guaranteed</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Our rigorous quality control labs test every batch before dispatch. We don't trade commodities; we deliver precision.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Infrastructure Teaser */}
      <section className="py-24 bg-primary text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('/images/logistics-ship.png')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-5xl font-bold text-white font-display">Infrastructure that Scale</h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                From specialized chemical tankers to temperature-controlled warehousing, our infrastructure is built to handle hazardous and sensitive materials with absolute safety.
              </p>
              <ul className="space-y-4 text-gray-200">
                <li className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-gold rounded-full"></div>
                  500,000 sq. ft. of bonded warehousing
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-gold rounded-full"></div>
                  Dedicated fleet of ISO tanks
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-gold rounded-full"></div>
                  Real-time shipment tracking
                </li>
              </ul>
              <Button variant="outline" className="mt-8 text-white border-white/30 hover:bg-white/10 hover:border-white">
                View Infrastructure
              </Button>
            </div>
            <div className="relative">
              <div className="rounded-lg overflow-hidden border-4 border-white/10 shadow-2xl">
                 <img src="/images/hero-chemical-plant.png" alt="Infrastructure" className="w-full" />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-gold text-primary p-6 rounded shadow-xl hidden md:block">
                <p className="font-bold text-2xl font-display">Zero</p>
                <p className="text-sm font-medium">Safety Incidents<br/>in 5 Years</p>
              </div>
            </div>
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
                <Card className="h-full border border-gray-100 hover:border-primary/20 hover:shadow-lg transition-all cursor-pointer group bg-white">
                  <div className="h-48 overflow-hidden relative bg-gray-100 p-6 flex items-center justify-center">
                    <img src={product.image} alt={product.name} className="h-full w-auto object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <CardContent className="p-6">
                    <p className="text-xs font-bold text-gold uppercase tracking-wider mb-2">{product.category}</p>
                    <h3 className="font-bold text-primary text-lg mb-2 leading-tight group-hover:text-blue-700 transition-colors">{product.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{product.description}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-xs text-gray-400">Bulk pricing available</span>
                      <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
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
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 font-display">Ready to streamline your supply chain?</h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Create a verified corporate account today to access wholesale pricing, net-30 payment terms, and dedicated account management.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/auth?tab=register">
              <Button size="lg" className="bg-gold hover:bg-gold/90 text-primary font-bold">
                Apply for Account
              </Button>
            </Link>
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
