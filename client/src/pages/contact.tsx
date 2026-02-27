import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock, Building2 } from "lucide-react";

export default function Contact() {
    return (
        <Layout>
            {/* Hero Section */}
            <div className="bg-primary text-white py-16 lg:py-24">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl lg:text-5xl font-display font-bold mb-6">Contact Us</h1>
                    <p className="text-lg text-blue-100 max-w-2xl mx-auto">
                        Get in touch with our global team. We're here to answer your questions about our chemical solutions, bulk orders, and supply chain logistics.
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-16 -mt-8 relative z-10 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">

                    {/* Contact Information Card */}
                    <Card className="shadow-lg border-t-4 border-t-gold h-full">
                        <CardContent className="p-8 md:p-12 h-full flex flex-col justify-center">
                            <h3 className="text-2xl md:text-3xl font-bold font-display text-primary mb-8 flex items-center gap-3">
                                <Building2 className="h-8 w-8 text-gold" />
                                Global Headquarters
                            </h3>

                            <div className="space-y-8">
                                <div className="flex items-start gap-5">
                                    <MapPin className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                                    <div>
                                        <p className="text-lg font-semibold text-gray-900">Dual Life Chemicals AG</p>
                                        <p className="text-muted-foreground mt-2 leading-relaxed text-base">
                                            Ground floor 13, Sahajanand Business Hub<br />
                                            Opp. N.C. Thakkar School<br />
                                            Navjivan Hotel to Gadhpur Road<br />
                                            Surat, Gujarat
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-5">
                                    <Phone className="h-6 w-6 text-primary flex-shrink-0" />
                                    <div>
                                        <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Main Office</p>
                                        <p className="text-lg font-medium text-gray-900 mt-1">+91 9737488866</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-5">
                                    <Mail className="h-6 w-6 text-primary flex-shrink-0" />
                                    <div>
                                        <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">General Enquiries</p>
                                        <a href="mailto:kishan.kothiya@gmail.com" className="text-lg font-medium text-gold hover:underline mt-1 block">
                                            kishan.kothiya@gmail.com
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-5 pt-8 border-t">
                                    <Clock className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                                    <div>
                                        <p className="text-lg font-semibold text-gray-900">Business Hours</p>
                                        <p className="text-muted-foreground mt-2 text-base">
                                            Monday - Saturday: 09:00 AM - 07:00 PM<br />
                                            Sunday: Closed
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Interactive Map */}
                    <Card className="shadow-lg overflow-hidden h-full min-h-[400px]">
                        <iframe
                            src="https://maps.google.com/maps?q=Sahajanand%20Hub,%20Opp.%20N.C.%20Thakar%20School,%20Surat&t=&z=16&ie=UTF8&iwloc=&output=embed"
                            className="w-full h-full border-0 min-h-[400px]"
                            allowFullScreen={false}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Dual Life Chemicals Office Location"
                        ></iframe>
                    </Card>
                </div>
            </div>
        </Layout>
    );
}
