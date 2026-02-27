import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/lib/store";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, User as UserIcon, FileText, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: string;
  createdAt: string;
}

export default function Dashboard() {
  const { user, logout, isLoading } = useApp();
  const [, setLocation] = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);



  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setLoadingOrders(false);
        return;
      }

      try {
        const response = await fetch("/api/orders", {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setOrders(data);
        }
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-500";
      case "shipped":
        return "bg-blue-500";
      case "confirmed":
        return "bg-indigo-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-yellow-500";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Redirect should happen in useEffect, but for now this safe return prevents crash
    // Ideally use: useEffect(() => { if (!user && !isLoading) setLocation("/auth") }, [user, isLoading])
    // But setLocation is allowed here if we return null immediately
    setLocation("/auth");
    return null;
  }

  return (
    <Layout>
      <div className="bg-primary text-white py-12">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row sm:justify-between items-start sm:items-end gap-6">
          <div>
            <h1 className="text-3xl font-display font-bold mb-2">My Account</h1>
            <p className="text-blue-200">Manage your orders and profile.</p>
          </div>
          <div className="w-full sm:w-auto text-left sm:text-right border-t border-white/20 pt-4 sm:pt-0 sm:border-t-0">
            <p className="font-bold text-gold text-lg">{user.name}</p>
            <div className="flex items-center justify-start sm:justify-end gap-2 mt-1">
              <span className="text-sm opacity-80">{user.email}</span>
              <Badge variant={user.role === 'verified' ? 'default' : 'secondary'} className="uppercase text-[10px]">
                {user.role}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="orders" className="space-y-8">
          <TabsList>
            <TabsTrigger value="orders"><Package className="mr-2 h-4 w-4" /> Order History</TabsTrigger>
            <TabsTrigger value="profile"><UserIcon className="mr-2 h-4 w-4" /> Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Your Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingOrders ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No orders yet</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setLocation("/products")}
                    >
                      Browse Products
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map(order => (
                      <div key={order.id} className="flex flex-col sm:flex-row items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
                          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                            #
                          </div>
                          <div>
                            <p className="font-bold text-primary">{order.orderNumber}</p>
                            <p className="text-sm text-muted-foreground">Placed on {formatDate(order.createdAt)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end mt-4 sm:mt-0">
                          <div className="text-right">
                            <p className="font-bold">₹{parseFloat(order.totalAmount).toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">{order.paymentStatus}</p>
                          </div>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                          <Button variant="ghost" size="sm">View</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Name</label>
                    <p className="font-medium">{user.name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Email</label>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Account Status</label>
                    <p className="font-medium capitalize">{user.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </Layout>
  );
}
