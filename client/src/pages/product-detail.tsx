import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useApp, Product } from "@/lib/store";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Minus, Plus, ShoppingCart, FileText, CheckCircle } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

export default function ProductDetail() {
  const [, params] = useRoute("/product/:id");
  const { products, addToCart, user } = useApp();
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();

  const product = products.find(p => p.id === params?.id);

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold">Product not found</h1>
          <Link href="/products"><Button className="mt-4">Back to Catalog</Button></Link>
        </div>
      </Layout>
    );
  }

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  const handleInquiry = () => {
    toast({
      title: "Inquiry Sent",
      description: "Our sales team will contact you shortly regarding bulk pricing.",
    });
  };

  return (
    <Layout>
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <Link href="/products">
            <Button variant="ghost" size="sm" className="pl-0 hover:pl-0 hover:bg-transparent text-muted-foreground hover:text-primary">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Catalog
            </Button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Image */}
          <div className="bg-white border rounded-lg p-12 flex items-center justify-center min-h-[400px]">
            <img src={product.image} alt={product.name} className="max-w-full max-h-[400px] object-contain" />
          </div>

          {/* Right: Details */}
          <div>
            <div className="mb-6">
              <Badge className="bg-blue-100 text-primary border-blue-200 hover:bg-blue-200 mb-4 rounded-sm px-3 py-1">
                {product.category}
              </Badge>
              <h1 className="text-4xl font-bold text-primary font-display mb-4">{product.name}</h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                {product.description}
              </p>
              
              <div className="flex items-center gap-4 mb-8 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" /> In Stock
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" /> Export Ready
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" /> ISO Certified
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border mb-8">
              <div className="flex flex-col sm:flex-row gap-6 items-end">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">Quantity (Metric Tons/Units)</span>
                  <div className="flex items-center">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-10 w-10 rounded-r-none border-r-0"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <div className="h-10 w-16 border-y flex items-center justify-center bg-white font-mono">
                      {quantity}
                    </div>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-10 w-10 rounded-l-none border-l-0"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex-1 flex gap-3 w-full">
                  <Button onClick={handleAddToCart} className="flex-1 h-10 bg-primary hover:bg-primary/90 text-white">
                    <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
                  </Button>
                  <Button onClick={handleInquiry} variant="outline" className="flex-1 h-10 border-primary text-primary hover:bg-primary/5">
                    Request Quote
                  </Button>
                </div>
              </div>
              {!user && (
                <p className="text-xs text-red-500 mt-3 flex items-center">
                  * Login required to view wholesale pricing and complete purchase.
                </p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-bold text-primary mb-4 border-b pb-2">Technical Specifications</h3>
              <Table>
                <TableBody>
                  {Object.entries(product.technicalSpecs).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell className="font-medium text-gray-600 w-1/3">{key}</TableCell>
                      <TableCell>{value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-8 flex gap-4">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <FileText className="mr-2 h-4 w-4" /> Download MSDS
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <FileText className="mr-2 h-4 w-4" /> Download COA Spec
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
