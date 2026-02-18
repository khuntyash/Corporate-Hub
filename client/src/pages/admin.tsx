import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useApp } from "@/lib/store";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Package, ShoppingCart, BarChart3, Plus, Edit, Trash, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminDashboard() {
  const { user, products } = useApp();
  const [, setLocation] = useLocation();

  if (!user || user.role !== "admin") {
    // Basic protection (client-side only for mockup)
    setLocation("/auth");
    return null;
  }

  // Mock Users
  const users = [
    { id: 1, name: "John Doe", company: "Acme Corp", email: "john@acme.com", role: "verified" },
    { id: 2, name: "Jane Smith", company: "Global Industries", email: "jane@global.com", role: "unverified" },
    { id: 3, name: "Robert Fox", company: "ChemTech", email: "robert@chemtech.com", role: "verified" },
  ];

  return (
    <Layout>
      <div className="bg-primary text-white border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gold text-primary font-bold px-2 py-1 rounded text-xs">ADMIN</div>
            <h1 className="font-bold text-lg">Management Console</h1>
          </div>
          <p className="text-sm opacity-70">Logged in as {user.email}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
           <Card>
             <CardContent className="p-6 flex items-center justify-between">
               <div>
                 <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                 <h2 className="text-2xl font-bold text-primary">$1.2M</h2>
               </div>
               <BarChart3 className="h-8 w-8 text-gold" />
             </CardContent>
           </Card>
           <Card>
             <CardContent className="p-6 flex items-center justify-between">
               <div>
                 <p className="text-sm font-medium text-muted-foreground">Pending Orders</p>
                 <h2 className="text-2xl font-bold text-primary">12</h2>
               </div>
               <ShoppingCart className="h-8 w-8 text-blue-500" />
             </CardContent>
           </Card>
           <Card>
             <CardContent className="p-6 flex items-center justify-between">
               <div>
                 <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                 <h2 className="text-2xl font-bold text-primary">854</h2>
               </div>
               <Users className="h-8 w-8 text-green-500" />
             </CardContent>
           </Card>
           <Card>
             <CardContent className="p-6 flex items-center justify-between">
               <div>
                 <p className="text-sm font-medium text-muted-foreground">Products</p>
                 <h2 className="text-2xl font-bold text-primary">{products.length}</h2>
               </div>
               <Package className="h-8 w-8 text-purple-500" />
             </CardContent>
           </Card>
        </div>

        <Tabs defaultValue="products">
          <TabsList className="mb-6">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="pages">CMS Pages</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Product Catalog</CardTitle>
                  <CardDescription>Manage inventory and listings</CardDescription>
                </div>
                <Button className="bg-primary"><Plus className="mr-2 h-4 w-4"/> Add Product</Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell><img src={product.image} className="h-8 w-8 object-contain" /></TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>${product.price}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-red-500"><Trash className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Approve or block user accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>{u.company}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <Badge variant={u.role === 'verified' ? 'default' : 'secondary'}>{u.role}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {u.role === 'unverified' && (
                             <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-8">
                               <Check className="mr-1 h-3 w-3" /> Approve
                             </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pages">
            <Card>
              <CardHeader>
                <CardTitle>Content Management System</CardTitle>
                <CardDescription>Edit site content live</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {["Home Page", "About Us", "Infrastructure", "Global Presence", "Privacy Policy"].map((page) => (
                    <div key={page} className="flex items-center justify-between p-4 border rounded hover:bg-gray-50">
                      <span className="font-medium">{page}</span>
                      <Button variant="outline" size="sm">Edit Content</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
