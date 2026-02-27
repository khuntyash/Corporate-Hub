import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin, Globe, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Company {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    city: string | null;
    country: string | null;
    logo: string | null;
    website: string | null;
    type: string;
}

export default function Team() {
    const { data: companies, isLoading, error } = useQuery<Company[]>({
        queryKey: ["/api/companies/directory"],
    });

    return (
        <Layout>
            {/* Hero Section */}
            <div className="bg-primary text-primary-foreground py-20">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold font-display mb-4 text-gold">Our Leadership</h1>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                        Driven by a vision to revolutionize the chemical trading industry with transparency, efficiency, and integrity.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16">
                {error ? (
                    <div className="text-center text-red-500 py-12">
                        <p>Failed to load team members. Please try again later.</p>
                        <p className="text-sm text-muted-foreground mt-2">{(error as Error).message}</p>
                    </div>
                ) : isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : companies && companies.length > 0 ? (
                    <div className="grid grid-cols-1 gap-12">
                        {companies.map((company) => (
                            <div key={company.id} className="max-w-4xl mx-auto w-full">
                                <Card className="overflow-hidden border-none shadow-xl bg-white">
                                    <div className="grid grid-cols-1 md:grid-cols-5 bg-gradient-to-br from-gray-50 to-gray-100">

                                        {/* Image Section */}
                                        <div className="md:col-span-2 relative h-64 md:h-auto bg-gray-200 flex items-center justify-center overflow-hidden">
                                            {company.logo ? (
                                                <img
                                                    src={company.logo}
                                                    alt={company.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center bg-primary/5 text-primary">
                                                    <span className="text-6xl font-serif font-bold text-gold">
                                                        {company.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Content Section */}
                                        <div className="md:col-span-3 p-8 md:p-12 flex flex-col justify-center">
                                            <div className="mb-6">
                                                <h2 className="text-3xl font-bold text-primary font-display">{company.name}</h2>
                                                <p className="text-gold font-medium text-lg mt-1 uppercase tracking-wider">
                                                    {company.type === 'both' ? 'Global Partner' : company.type === 'seller' ? 'Supplier' : 'Buyer'}
                                                </p>
                                            </div>

                                            <div className="space-y-4 text-muted-foreground mb-8 text-lg leading-relaxed">
                                                <p>
                                                    A key player in our global network, committed to delivering excellence and fostering sustainable growth in the industrial sector.
                                                </p>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3 text-sm font-medium text-primary/80">
                                                    <Mail className="h-4 w-4 text-gold" />
                                                    <a href={`mailto:${company.email}`} className="hover:text-primary transition-colors">{company.email}</a>
                                                </div>
                                                {company.phone && (
                                                    <div className="flex items-center gap-3 text-sm font-medium text-primary/80">
                                                        <Phone className="h-4 w-4 text-gold" />
                                                        <span>{company.phone}</span>
                                                    </div>
                                                )}
                                                {(company.city || company.country) && (
                                                    <div className="flex items-center gap-3 text-sm font-medium text-primary/80">
                                                        <MapPin className="h-4 w-4 text-gold" />
                                                        <span>
                                                            {[company.city, company.country].filter(Boolean).join(", ")}
                                                        </span>
                                                    </div>
                                                )}
                                                {company.website && (
                                                    <div className="flex items-center gap-3 text-sm font-medium text-primary/80">
                                                        <Globe className="h-4 w-4 text-gold" />
                                                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                                                            {company.website.replace(/^https?:\/\//, '')}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-12">
                        <p>No team members found.</p>
                    </div>
                )}
            </div>
        </Layout>
    );
}
