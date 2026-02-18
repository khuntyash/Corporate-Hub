import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useApp } from "@/lib/store";
import { Link, useLocation } from "wouter";
import { Trash2, AlertCircle, Lock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function Cart() {
  const { cart, removeFromCart, user, placeOrder } = useApp();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"cart" | "checkout">("cart");

  // Checkout State
  const [checkoutData, setCheckoutData] = useState({
    company: user?.companyName || "",
    address: "",
    poNumber: "",
  });

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  
  // Tax and Shipping would be calculated here
  const tax = subtotal * 0.08; 
  const shipping = 500; // Flat rate mock
  const total = subtotal + tax + shipping;

  const handleCheckout = () => {
    if (!user) {
      setLocation("/auth");
      return;
    }
    setStep("checkout");
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    placeOrder();
    setLocation("/dashboard");
  };

  if (cart.length === 0 && step === "cart") {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-3xl font-bold font-display text-primary mb-6">Your Cart is Empty</h1>
          <p className="text-muted-foreground mb-8">Start adding items from our product catalog.</p>
          <Link href="/products">
            <Button size="lg">Browse Products</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gray-50 border-b py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-primary font-display">
            {step === "cart" ? "Shopping Cart" : "Secure Checkout"}
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Main Column */}
          <div className="lg:col-span-2">
            {step === "cart" ? (
              <div className="space-y-6">
                {cart.map((item) => (
                  <Card key={item.product.id} className="flex flex-col sm:flex-row p-6 gap-6 items-center">
                    <img src={item.product.image} alt={item.product.name} className="w-24 h-24 object-contain bg-gray-100 rounded p-2" />
                    <div className="flex-1 space-y-2 text-center sm:text-left">
                      <h3 className="font-bold text-lg text-primary">{item.product.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.product.category}</p>
                      <p className="font-mono text-sm">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">${(item.product.price * item.quantity).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">${item.product.price} / unit</p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => removeFromCart(item.product.id)}>
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </Card>
                ))}
              </div>
            ) : (
              <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Shipping & Company Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Company Name</Label>
                          <Input defaultValue={user?.companyName} readOnly className="bg-gray-50" />
                        </div>
                        <div className="space-y-2">
                          <Label>Contact Person</Label>
                          <Input defaultValue={user?.name} readOnly className="bg-gray-50" />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <Label>Shipping Address</Label>
                        <Input required placeholder="Warehouse address..." />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>City</Label>
                          <Input required />
                        </div>
                        <div className="space-y-2">
                          <Label>Postal Code</Label>
                          <Input required />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <Label>Purchase Order (PO) Number</Label>
                        <Input required placeholder="PO-2025-XXXX" />
                     </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Payment Method</CardTitle>
                    <CardDescription>B2B Payment Terms</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-blue-50 p-4 rounded border border-blue-100 mb-4">
                      <p className="font-semibold text-blue-900">Net-30 Invoice</p>
                      <p className="text-sm text-blue-700">Payment due 30 days after shipment. Subject to credit limit.</p>
                    </div>
                    <p className="text-xs text-muted-foreground">By placing this order, you agree to Dual Life Chemicals' Terms of Trade.</p>
                  </CardContent>
                </Card>
              </form>
            )}
          </div>

          {/* Summary Column */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal ({totalItems} items)</span>
                  <span>${subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping (Est.)</span>
                  <span>${shipping.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (8%)</span>
                  <span>${tax.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg text-primary">
                  <span>Total</span>
                  <span>${total.toLocaleString()}</span>
                </div>

                {step === "cart" ? (
                  <>
                    {user?.role === "unverified" ? (
                       <Alert variant="destructive" className="mt-4">
                         <AlertCircle className="h-4 w-4" />
                         <AlertTitle>Verification Required</AlertTitle>
                         <AlertDescription>
                           Your account is currently Unverified. You cannot proceed to checkout until your account is approved by an administrator.
                         </AlertDescription>
                       </Alert>
                    ) : (
                      <Button className="w-full mt-6 bg-gold hover:bg-gold/90 text-primary font-bold" onClick={handleCheckout}>
                        Proceed to Checkout
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Button type="submit" form="checkout-form" className="w-full mt-6 bg-primary hover:bg-primary/90 text-white font-bold">
                      <Lock className="mr-2 h-4 w-4" /> Confirm Order
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => setStep("cart")}>
                      Back to Cart
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </Layout>
  );
}
