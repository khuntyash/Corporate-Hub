import { Layout } from "@/components/layout";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Phone, Mail, MapPin } from "lucide-react";
import { EditableText } from "@/lib/content";

export default function ContentPage() {
  const [match, params] = useRoute("/:slug");
  const slug = params?.slug || "about";

  // Default images for each section
  const images: Record<string, string> = {
    about: "/images/corporate-hq.png",
    infrastructure: "/images/hero-chemical-plant.png",
    "global-presence": "/images/logistics-ship.png",
    contact: "/images/corporate-hq.png"
  };

  const currentImage = images[slug] || images.about;

  const renderContent = () => {
    switch (slug) {
      case "about":
        return (
          <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
            <div className="space-y-4">
              <p>
                <EditableText
                  name="content.about.intro_1"
                  default="Founded in Zurich in 1998, Dual Life Chemicals has grown from a regional distributor to a global powerhouse in industrial chemical supply. We bridge the gap between complex chemical manufacturing and critical industrial applications."
                  multiline
                />
              </p>
              <p>
                <EditableText
                  name="content.about.intro_2"
                  default='Our name, "Dual Life," reflects our philosophy: every chemical has a dual purpose—innovation in the lab and application in the field. We ensure that transition is seamless, safe, and scalable.'
                  multiline
                />
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-primary font-bold mb-2">
                  <EditableText name="content.about.mission_title" default="Our Mission" />
                </h3>
                <p className="text-sm">
                  <EditableText
                    name="content.about.mission_desc"
                    default="To provide the world's most reliable chemical supply chain, ensuring quality and compliance at every step."
                    multiline
                  />
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-primary font-bold mb-2">
                  <EditableText name="content.about.vision_title" default="Our Vision" />
                </h3>
                <p className="text-sm">
                  <EditableText
                    name="content.about.vision_desc"
                    default="To be the trusted partner for industries that demand absolute precision in their chemical procurement."
                    multiline
                  />
                </p>
              </div>
            </div>
          </div>
        );



      case "global-presence":
        return (
          <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>
              <EditableText
                name="content.global.intro"
                default="We operate strategic hubs in key industrial zones, allowing us to serve clients in over 25 countries with localized support and rapid fulfillment."
                multiline
              />
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
        );

      case "contact":
        return (
          <div className="space-y-8 text-lg text-muted-foreground leading-relaxed">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <Phone className="h-8 w-8 text-gold mx-auto mb-4" />
                <h3 className="font-bold text-primary mb-2">Phone</h3>
                <p className="text-sm">+91 9737488866</p>
                <p className="text-xs text-muted-foreground mt-1">Mon-Sat, 9am - 7pm IST</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <Mail className="h-8 w-8 text-gold mx-auto mb-4" />
                <h3 className="font-bold text-primary mb-2">Email</h3>
                <p className="text-sm">kishan.kothiya@gmail.com</p>
                <p className="text-xs text-muted-foreground mt-1">24/7 Support</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <MapPin className="h-8 w-8 text-gold mx-auto mb-4" />
                <h3 className="font-bold text-primary mb-2">Headquarters</h3>
                <p className="text-sm">Ground floor 13, Sahajanand Business Hub</p>
                <p className="text-sm">Surat, Gujarat, India</p>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Page Not Found</div>;
    }
  };

  if (!images[slug]) return <div>Page Not Found</div>;

  return (
    <Layout>
      {/* Page Header */}
      <section className="relative h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={currentImage} alt={slug} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-primary/80 mix-blend-multiply" />
        </div>
        <div className="container relative z-10 px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            <EditableText
              name={`content.${slug}.title`}
              default={
                slug === "about" ? "About Dual Life Chemicals" :
                  slug === "global-presence" ? "Global Presence" :
                    "Contact Us"
              }
            />
          </h1>
          <p className="text-xl text-gold font-light">
            <EditableText
              name={`content.${slug}.subtitle`}
              default={
                slug === "about" ? "A Legacy of Precision & Partnership" :
                  slug === "global-presence" ? "Local Expertise, Worldwide Reach" :
                    "Get in touch with our global team"
              }
            />
          </p>
        </div>
      </section>

      {/* Content Body */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          {renderContent()}
        </div>
      </section>
    </Layout>
  );
}
