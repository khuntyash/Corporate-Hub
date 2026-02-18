import { Layout } from "@/components/layout";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Phone, Mail, MapPin } from "lucide-react";

const CONTENT_DATA: Record<string, { title: string; subtitle: string; content: React.ReactNode; image: string }> = {
  about: {
    title: "About Dual Life Chemicals",
    subtitle: "A Legacy of Precision & Partnership",
    image: "/images/corporate-hq.png",
    content: (
      <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
        <p>
          Founded in Zurich in 1998, Dual Life Chemicals has grown from a regional distributor to a global powerhouse in industrial chemical supply. We bridge the gap between complex chemical manufacturing and critical industrial applications.
        </p>
        <p>
          Our name, "Dual Life," reflects our philosophy: every chemical has a dual purpose—innovation in the lab and application in the field. We ensure that transition is seamless, safe, and scalable.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-primary font-bold mb-2">Our Mission</h3>
            <p className="text-sm">To provide the world's most reliable chemical supply chain, ensuring quality and compliance at every step.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-primary font-bold mb-2">Our Vision</h3>
            <p className="text-sm">To be the trusted partner for industries that demand absolute precision in their chemical procurement.</p>
          </div>
        </div>
      </div>
    )
  },
  infrastructure: {
    title: "Global Infrastructure",
    subtitle: "Built for Scale & Safety",
    image: "/images/hero-chemical-plant.png",
    content: (
      <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
        <p>
          Handling hazardous materials requires more than just trucks and ships. It requires a dedicated, specialized infrastructure network designed for safety and efficiency.
        </p>
        <ul className="space-y-4 my-8">
          {[
            "500,000 sq. ft. of Bonded Warehousing across 3 continents",
            "Dedicated ISO Tank Fleet (2,000+ units)",
            "Temperature-controlled storage for sensitive compounds",
            "In-house Quality Control Labs at every major hub"
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-gold flex-shrink-0" />
              <span className="text-primary font-medium">{item}</span>
            </li>
          ))}
        </ul>
        <p>
          Our logistics team operates 24/7 to monitor shipments, ensuring Just-In-Time delivery for your critical manufacturing processes.
        </p>
      </div>
    )
  },
  "global-presence": {
    title: "Global Presence",
    subtitle: "Local Expertise, Worldwide Reach",
    image: "/images/logistics-ship.png",
    content: (
      <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
        <p>
          We operate strategic hubs in key industrial zones, allowing us to serve clients in over 25 countries with localized support and rapid fulfillment.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8">
           <div>
             <h3 className="text-xl font-bold text-primary mb-2">Europe (HQ)</h3>
             <p className="text-sm">Zurich, Switzerland</p>
             <p className="text-sm">Rotterdam, Netherlands</p>
           </div>
           <div>
             <h3 className="text-xl font-bold text-primary mb-2">Asia Pacific</h3>
             <p className="text-sm">Singapore</p>
             <p className="text-sm">Shanghai, China</p>
             <p className="text-sm">Mumbai, India</p>
           </div>
           <div>
             <h3 className="text-xl font-bold text-primary mb-2">Americas</h3>
             <p className="text-sm">Houston, USA</p>
             <p className="text-sm">Sao Paulo, Brazil</p>
           </div>
        </div>
      </div>
    )
  },
  contact: {
    title: "Contact Us",
    subtitle: "Get in touch with our global team",
    image: "/images/corporate-hq.png",
    content: (
      <div className="space-y-8 text-lg text-muted-foreground leading-relaxed">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-6 rounded-lg text-center">
            <Phone className="h-8 w-8 text-gold mx-auto mb-4" />
            <h3 className="font-bold text-primary mb-2">Phone</h3>
            <p className="text-sm">+41 22 555 0199</p>
            <p className="text-xs text-muted-foreground mt-1">Mon-Fri, 9am - 6pm CET</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg text-center">
            <Mail className="h-8 w-8 text-gold mx-auto mb-4" />
            <h3 className="font-bold text-primary mb-2">Email</h3>
            <p className="text-sm">trade@duallife-chem.com</p>
            <p className="text-xs text-muted-foreground mt-1">24/7 Support</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg text-center">
            <MapPin className="h-8 w-8 text-gold mx-auto mb-4" />
            <h3 className="font-bold text-primary mb-2">Headquarters</h3>
            <p className="text-sm">Bahnhofstrasse 45</p>
            <p className="text-sm">8001 Zurich, Switzerland</p>
          </div>
        </div>
      </div>
    )
  }
};

export default function ContentPage() {
  const [match, params] = useRoute("/:slug");
  const slug = params?.slug || "about";
  const data = CONTENT_DATA[slug];

  if (!data) return <div>Page Not Found</div>;

  return (
    <Layout>
      {/* Page Header */}
      <section className="relative h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={data.image} alt={data.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-primary/80 mix-blend-multiply" />
        </div>
        <div className="container relative z-10 px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">{data.title}</h1>
          <p className="text-xl text-gold font-light">{data.subtitle}</p>
        </div>
      </section>

      {/* Content Body */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          {data.content}
          
          {slug !== 'contact' && (
            <div className="mt-12 pt-12 border-t flex justify-center">
               <Button size="lg" className="bg-primary hover:bg-primary/90 text-white">
                 Partner With Us <ArrowRight className="ml-2 h-4 w-4" />
               </Button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
