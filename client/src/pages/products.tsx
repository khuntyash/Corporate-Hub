import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search, Filter } from "lucide-react";
import { useApp } from "@/lib/store";
import { Link } from "wouter";
import { useState } from "react";

export default function Products() {
  const { products } = useApp();
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const categories = Array.from(new Set(products.map(p => p.category)));

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(p.category);
    return matchesSearch && matchesCategory;
  });

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <Layout>
      <div className="bg-gray-50 border-b py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-primary font-display mb-4">Product Catalog</h1>
          <p className="text-muted-foreground max-w-2xl">
            Explore our comprehensive range of industrial chemicals. All products are certified and available for bulk export.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="w-full lg:w-64 space-y-8 flex-shrink-0">
            <div>
              <div className="relative mb-6">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search chemicals..." 
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 font-bold text-primary pb-2 border-b">
                  <Filter className="h-4 w-4" /> Filters
                </div>
                
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">Category</Label>
                  {categories.map(category => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox 
                        id={category} 
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={() => toggleCategory(category)}
                      />
                      <label
                        htmlFor={category}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-gray-600"
                      >
                        {category}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-primary/5 p-6 rounded-lg border border-primary/10">
              <h4 className="font-bold text-primary mb-2">Need Custom Formulation?</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Our labs can synthesize custom solutions for your specific industrial needs.
              </p>
              <Button variant="outline" className="w-full text-xs border-primary text-primary hover:bg-primary hover:text-white">
                Request Lab Service
              </Button>
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <Link key={product.id} href={`/product/${product.id}`}>
                  <Card className="h-full hover:shadow-lg transition-all cursor-pointer group flex flex-col">
                    <div className="h-48 p-8 bg-white flex items-center justify-center border-b">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="h-full w-auto object-contain"
                      />
                    </div>
                    <CardContent className="p-6 flex-1 flex flex-col">
                      <div className="mb-4">
                        <span className="text-xs font-bold text-gold uppercase tracking-wider bg-gold/10 px-2 py-1 rounded">
                          {product.category}
                        </span>
                      </div>
                      <h3 className="font-bold text-primary text-lg mb-2 leading-tight group-hover:text-blue-700 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {product.description}
                      </p>
                      
                      <div className="mt-auto pt-4 border-t flex justify-between items-center">
                        <span className="text-xs text-gray-400 font-mono">ID: {product.technicalSpecs["CAS No"] || "N/A"}</span>
                        <Button size="sm" variant="ghost" className="text-primary hover:bg-primary/5 p-0 h-auto font-semibold">
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-24 bg-gray-50 rounded-lg border border-dashed">
                <p className="text-lg text-muted-foreground">No products found matching your criteria.</p>
                <Button variant="link" onClick={() => {setSearch(""); setSelectedCategories([])}}>Clear Filters</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
