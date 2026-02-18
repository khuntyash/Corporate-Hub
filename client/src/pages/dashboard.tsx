import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/lib/store";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, User as UserIcon, Settings, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { user, logout } = useApp();
  const [, setLocation] = useLocation();

  if (!user) {
    setLocation("/auth");
    return null;
  }

  // Mock Orders
  const orders = [
    { id: "ORD-2025-001", date: "2025-02-15", status: "Processing", items: 2, total: 12500 },
    { id: "ORD-2025-002", date: "2025-01-20", status: "Shipped", items: 5, total: 45000 },
    { id: "ORD-2025-003", date: "2024-12-10", status: "Completed", items: 1, total: 2800 },
  ];

  return (
    <Layout>
       <div className="bg-primary text-white py-12">
        <div className="container mx-auto px-4 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-display font-bold mb-2">My Account</h1>
            <p className="text-blue-200">Manage your orders and company profile.</p>
          </div>
          <div className="text-right">
             <p className="font-bold text-gold text-lg">{user.companyName}</p>
             <div className="flex items-center justify-end gap-2 mt-1">
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
            <TabsTrigger value="orders"><Package className="mr-2 h-4 w-4"/> Order History</TabsTrigger>
            <TabsTrigger value="profile"><UserIcon className="mr-2 h-4 w-4"/> Company Profile</TabsTrigger>
            <TabsTrigger value="docs"><FileText className="mr-2 h-4 w-4"/> Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.map(order => (
                    <div key={order.id} className="flex flex-col sm:flex-row items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
                         <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                           #
                         </div>
                         <div>
                           <p className="font-bold text-primary">{order.id}</p>
                           <p className="text-sm text-muted-foreground">Placed on {order.date}</p>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end mt-4 sm:mt-0">
                         <div className="text-right">
                           <p className="font-bold">${order.total.toLocaleString()}</p>
                           <p className="text-xs text-muted-foreground">{order.items} Items</p>
                         </div>
                         <Badge className={
                           order.status === 'Completed' ? 'bg-green-500' :
                           order.status === 'Shipped' ? 'bg-blue-500' : 'bg-yellow-500'
                         }>
                           {order.status}
                         </Badge>
                         <Button variant="ghost" size="sm">View</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Details</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Profile management is available for verified admin accounts only.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
