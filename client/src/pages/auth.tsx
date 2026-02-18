import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp } from "@/lib/store";
import { useLocation } from "wouter";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const { login } = useApp();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  
  // Login State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginRole, setLoginRole] = useState("verified"); // Dev shortcut to select role

  // Register State
  const [registerEmail, setRegisterEmail] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    login(loginEmail, loginRole as any);
    setLoading(false);
    setLocation(loginRole === 'admin' ? '/admin' : '/dashboard');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Auto login as unverified after register
    login(registerEmail, "unverified");
    setLoading(false);
    setLocation("/dashboard");
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center py-12 bg-gray-50">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-display font-bold text-primary">Corporate Portal</h1>
            <p className="mt-2 text-gray-600">Secure access for verified partners.</p>
          </div>

          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle className="sr-only">Authentication</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Work Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="name@company.com" 
                        required 
                        value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" type="password" required />
                    </div>
                    
                    {/* Dev Tool: Select Role */}
                    <div className="space-y-2 pt-2 border-t mt-4">
                      <Label className="text-xs text-muted-foreground">Dev Mode: Select Role to Emulate</Label>
                      <select 
                        className="w-full text-sm border rounded p-2"
                        value={loginRole}
                        onChange={(e) => setLoginRole(e.target.value)}
                      >
                        <option value="verified">Verified User (Can Buy)</option>
                        <option value="unverified">Unverified User (Restricted)</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>

                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Access Portal
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Work Email</Label>
                      <Input 
                        id="reg-email" 
                        type="email" 
                        placeholder="name@company.com" 
                        required 
                        value={registerEmail}
                        onChange={e => setRegisterEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Mobile Number</Label>
                      <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Create Password</Label>
                      <Input id="reg-password" type="password" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company Name</Label>
                      <Input id="company" type="text" required />
                    </div>

                    <div className="bg-blue-50 p-4 rounded text-xs text-blue-800 border border-blue-100">
                      Note: All new accounts require manual verification by our compliance team before orders can be processed.
                    </div>

                    <Button type="submit" className="w-full bg-gold hover:bg-gold/90 text-primary font-bold" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Submit Application
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <div className="text-center text-sm text-gray-500">
            <p>Protected by reCAPTCHA and Subject to our Privacy Policy.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
