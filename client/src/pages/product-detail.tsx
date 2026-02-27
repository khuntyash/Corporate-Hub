import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useApp, Product } from "@/lib/store";
import { ChemicalImage } from "@/components/chemical-image";
import { useRoute, Link, useLocation } from "wouter";
import { ArrowLeft, Minus, Plus, ShoppingCart, FileText, CheckCircle } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import InquiryModal from "@/components/inquiry-modal";

export default function ProductDetail() {
  const [, params] = useRoute("/product/:id");
  const { products, addToCart, user } = useApp();
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [isInquiryOpen, setIsInquiryOpen] = useState(false);

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
    if (!user) {
      toast({
        title: "Login Required",
        description: "You must be logged in to request a quote or send an inquiry.",
        variant: "destructive",
      });
      setLocation("/auth");
      return;
    }
    setIsInquiryOpen(true);
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Image & Documents */}
          <div className="lg:col-span-3 space-y-8">
            <div className="bg-white border p-4 flex items-center justify-center">
              <ChemicalImage
                src={product.image}
                alt={product.name}
                casNumber={product.casNumber}
                className="w-full h-auto object-contain max-h-[300px]"
              />
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4 uppercase">Documents</h3>
              <div className="space-y-3">
                <a
                  href={`https://wa.me/919737488866?text=I'm interested in the Certificate of Analysis for product: ${encodeURIComponent(product.name)} (SKU: ${product.sku})`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-primary hover:underline text-sm"
                >
                  <FileText className="h-4 w-4 mr-2" /> Certificate of Analysis
                </a>
                <a
                  href={`https://wa.me/919737488866?text=I'm interested in the TDS / Properties Sheet for product: ${encodeURIComponent(product.name)} (SKU: ${product.sku})`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-primary hover:underline text-sm"
                >
                  <FileText className="h-4 w-4 mr-2" /> TDS / Properties Sheet
                </a>
              </div>
            </div>
          </div>

          {/* Middle Column: Details Grid */}
          <div className="lg:col-span-6 flex flex-col pt-2">
            <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
            <p className="text-primary font-bold mb-4">Code: {product.sku}</p>

            {product.synonyms && typeof product.synonyms === 'string' && (
              <p className="text-sm text-gray-600 mb-6">Synonyms: <span dangerouslySetInnerHTML={{ __html: product.synonyms }} /></p>
            )}

            <div className="space-y-2 mt-4">
              <div className="grid grid-cols-2 py-3 border-t border-b border-gray-100 text-sm">
                <div className="flex">
                  <span className="font-semibold w-28 text-gray-800">CAS</span>
                  <span className="text-primary">{product.casNumber || "-"}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-28 text-gray-800">Mol. Formula</span>
                  <span className="text-gray-700" dangerouslySetInnerHTML={{ __html: (product.molFormula && typeof product.molFormula === 'string') ? product.molFormula : "-" }} />
                </div>
              </div>

              <div className="grid grid-cols-2 py-3 border-b border-gray-100 text-sm">
                <div className="flex">
                  <span className="font-semibold w-28 text-gray-800">HSN Code</span>
                  <span className="text-gray-700">{product.hsnCode || "-"}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-28 text-gray-800">Mol. Weight</span>
                  <span className="text-gray-700">{product.molWeight || "-"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 py-3 border-b border-gray-100 text-sm">
                <div className="flex">
                  <span className="font-semibold w-28 text-gray-800">Packing</span>
                  <span className="text-gray-700">{product.packingType || "-"}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-28 text-gray-800">GST Tax Rate</span>
                  <span className="text-gray-700">{product.gstTaxRate || "-"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Pricing & Cart */}
          <div className="lg:col-span-3">
            <div className="flex justify-end items-center mb-4 gap-4">
              <a
                href={`https://wa.me/919737488866?text=I'm interested in your product: ${encodeURIComponent(product.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 transition-all text-[#25D366]"
                title="Contact on WhatsApp"
              >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                </svg>
              </a>
              <Link href="/products">
                <Button variant="default" size="sm" className="bg-[#1c3882] hover:bg-blue-900 rounded-full h-8 px-5">
                  &lt; BACK
                </Button>
              </Link>
            </div>
            <div className="border bg-gray-50/50 rounded-sm overflow-hidden">
              <div className="grid grid-cols-2 bg-gray-100 p-3 text-sm font-semibold text-center border-b text-gray-700">
                <div>Packings</div>
                <div>Price (INR)</div>
              </div>

              <div className="divide-y text-sm text-center text-gray-700">
                {product.productPackings ? (
                  product.productPackings.map((pack: any, idx: number) => (
                    <div key={idx} className="grid grid-cols-2 p-3 bg-white">
                      <div className="font-medium text-gray-800">{pack.size}</div>
                      <div>{pack.price}</div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="grid grid-cols-2 p-3 bg-white items-center">
                      <div className="font-medium text-gray-800">100 mg</div>
                      <div>{(product.price * 0.1).toFixed(2)}</div>
                    </div>
                    <div className="grid grid-cols-2 p-3 bg-white items-center">
                      <div className="font-medium text-gray-800">1 gm</div>
                      <div>{Number(product.price).toFixed(2)}</div>
                    </div>
                  </>
                )}
                <div className="grid grid-cols-2 p-3 bg-white items-center">
                  <div className="font-medium text-gray-800">Custom size</div>
                  <div className="text-primary cursor-pointer hover:underline" onClick={handleInquiry}>POR</div>
                </div>
              </div>

              <div className="p-5 bg-white flex flex-col items-center border-t gap-3">
                <Button variant="default" className="text-xs h-8 bg-[#1c3882] hover:bg-blue-900 rounded-full w-[200px]" onClick={handleInquiry}>
                  Request Quote
                </Button>
                <Button variant="default" className="text-xs h-8 border border-[#1c3882] text-[#1c3882] bg-transparent hover:bg-blue-50 rounded-full w-[200px]" onClick={handleAddToCart}>
                  Add to Cart
                </Button>
              </div>
            </div>

            {!user && (
              <p className="text-xs text-red-500 mt-3 text-center">
                * Login required to purchase directly.
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-12 border-t mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <h2 className="text-xl font-bold mb-6 border-b pb-2">DESCRIPTION</h2>
            <div
              className="prose max-w-none text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: product.description || "No description available for this product." }}
            />

            {product.properties && Object.keys(product.properties).length > 0 && (
              <div className="mt-12">
                <h2 className="text-xl font-bold mb-6 border-b pb-2 uppercase">Properties</h2>
                <div className="bg-gray-50 rounded-lg border overflow-hidden">
                  <Table>
                    <TableBody>
                      {Object.entries(product.properties).map(([key, value]) => (
                        <TableRow key={key}>
                          <TableCell className="font-semibold w-1/3 bg-gray-100/50">{key}</TableCell>
                          <TableCell className="text-gray-700" dangerouslySetInnerHTML={{ __html: value }} />
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <InquiryModal
        isOpen={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
        product={product}
      />
    </Layout >
  );
}
