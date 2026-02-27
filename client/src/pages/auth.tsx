import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useApp } from "@/lib/store";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const { login, initiateRegister, verifyRegister, user } = useApp();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    // If we are mid-registration, default to the register tab
    return sessionStorage.getItem("auth_registerStep") === "2" ? "register" : "login";
  });

  // ... existing useEffect

  // Login State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register State
  const [registerStep, setRegisterStep] = useState<1 | 2>(() => {
    const saved = sessionStorage.getItem("auth_registerStep");
    return saved ? (Number(saved) as 1 | 2) : 1;
  });
  const [otpValue, setOtpValue] = useState("");
  const [regEmail, setRegEmail] = useState(() => {
    return sessionStorage.getItem("auth_regEmail") || "";
  });
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regMobile, setRegMobile] = useState("");
  const [regCountryCode, setRegCountryCode] = useState("+91"); // Default to India
  const [regError, setRegError] = useState("");

  // Sync Registration State to Session Storage to survive mobile tab reloads
  useEffect(() => {
    sessionStorage.setItem("auth_registerStep", registerStep.toString());
    sessionStorage.setItem("auth_regEmail", regEmail);
  }, [registerStep, regEmail]);

  // ... handleLogin remains same

  // Login Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const success = await login(loginEmail, loginPassword);

    setLoading(false);

    if (success) {
      // Check if user is admin and redirect accordingly
      const storedUser = JSON.parse(localStorage.getItem("auth_user") || "{}");
      if (storedUser.role === "admin") {
        setLocation("/admin");
      } else {
        setLocation("/dashboard");
      }
    }
  };

  const handleRegisterInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");

    // Validate passwords match
    if (regPassword !== regConfirmPassword) {
      setRegError("Passwords do not match");
      return;
    }

    // Validate Email
    if (!regEmail.includes('@') || !regEmail.includes('.')) {
      setRegError("Please enter a valid email address containing an '@' symbol and domain.");
      return;
    }

    // Validate Mobile
    if (!/^\d{10}$/.test(regMobile)) {
      setRegError("Mobile number must be exactly 10 digits");
      return;
    }

    setLoading(true);

    const fullPhone = `${regCountryCode}${regMobile}`;

    const { success } = await initiateRegister({
      email: regEmail,
      password: regPassword,
      firstName: regFirstName,
      lastName: regLastName,
      phone: fullPhone,
    });

    setLoading(false);

    if (success) {
      setRegisterStep(2);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit code sent to your email",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const success = await verifyRegister(regEmail, otpValue);
    setLoading(false);

    if (success) {
      // Clear form properties
      setRegEmail("");
      setRegPassword("");
      setRegConfirmPassword("");
      setRegFirstName("");
      setRegLastName("");
      setRegMobile("");
      setRegCountryCode("+91");
      setRegError("");
      setOtpValue("");
      setRegisterStep(1);

      // Clear from storage so next time starts fresh
      sessionStorage.removeItem("auth_registerStep");
      sessionStorage.removeItem("auth_regEmail");

      // Navigate to dashboard
      setLocation("/dashboard");
    }
  };


  return (
    <Layout>
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center py-12 bg-gray-50">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-display font-bold text-primary">Welcome</h1>
            <p className="mt-2 text-gray-600">Sign in to your account or create a new one</p>
          </div>

          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle className="sr-only">Authentication</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="register">Create Account</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email or Username <span className="text-red-500">*</span></Label>
                      <Input
                        id="email"
                        type="text"
                        placeholder="your@email.com or admin"
                        required
                        value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        required
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                      />
                    </div>

                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sign In
                    </Button>
                  </form>

                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                    <strong>Note:</strong> You must create an account first before you can sign in. Use the "Create Account" tab to register.
                  </div>
                </TabsContent>

                <TabsContent value="register">
                  {registerStep === 1 ? (
                    <form onSubmit={handleRegisterInitiate} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="reg-firstName">First Name <span className="text-red-500">*</span></Label>
                          <Input
                            id="reg-firstName"
                            type="text"
                            placeholder="John"
                            required
                            value={regFirstName}
                            onChange={e => setRegFirstName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reg-lastName">Last Name <span className="text-red-500">*</span></Label>
                          <Input
                            id="reg-lastName"
                            type="text"
                            placeholder="Doe"
                            required
                            value={regLastName}
                            onChange={e => setRegLastName(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reg-email">Email <span className="text-red-500">*</span></Label>
                        <Input
                          id="reg-email"
                          type="email"
                          placeholder="john@example.com"
                          required
                          pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
                          title="Please provide a valid email address with an @ symbol"
                          value={regEmail}
                          onChange={e => {
                            setRegEmail(e.target.value);
                            setRegError("");
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reg-mobile">Mobile Number <span className="text-red-500">*</span></Label>
                        <div className="flex gap-2">
                          <div className="w-[100px] shrink-0">
                            <Select value={regCountryCode} onValueChange={setRegCountryCode}>
                              <SelectTrigger>
                                <SelectValue placeholder="Code" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="+91">🇮🇳 +91</SelectItem>
                                <SelectItem value="+1">🇺🇸 +1</SelectItem>
                                <SelectItem value="+44">🇬🇧 +44</SelectItem>
                                <SelectItem value="+41">🇨🇭 +41</SelectItem>
                                <SelectItem value="+86">🇨🇳 +86</SelectItem>
                                <SelectItem value="+65">🇸🇬 +65</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Input
                            id="reg-mobile"
                            type="tel"
                            placeholder="9876543210"
                            required
                            minLength={10}
                            maxLength={10}
                            pattern="\d{10}"
                            title="Please enter exactly 10 digits"
                            value={regMobile}
                            onChange={e => {
                              // Only allow numbers to be typed
                              const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setRegMobile(val);
                              setRegError("");
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reg-password">Password <span className="text-red-500">*</span></Label>
                        <Input
                          id="reg-password"
                          type="password"
                          placeholder="Min 6 characters"
                          required
                          minLength={6}
                          value={regPassword}
                          onChange={e => {
                            setRegPassword(e.target.value);
                            setRegError("");
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reg-confirm-password">Confirm Password <span className="text-red-500">*</span></Label>
                        <Input
                          id="reg-confirm-password"
                          type="password"
                          placeholder="Re-enter password"
                          required
                          value={regConfirmPassword}
                          onChange={e => {
                            setRegConfirmPassword(e.target.value);
                            setRegError("");
                          }}
                        />
                      </div>

                      {regError && (
                        <p className="text-sm text-red-500">{regError}</p>
                      )}

                      <Button type="submit" className="w-full bg-gold hover:bg-gold/90 text-primary font-bold" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Continue
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOTP} className="space-y-6 flex flex-col items-center">
                      <div className="w-full">
                        <Button
                          type="button"
                          variant="ghost"
                          className="pl-0 text-sm h-8 mt-[-10px] mb-4 text-gray-500 hover:text-gray-800"
                          onClick={() => setRegisterStep(1)}
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back to Registration
                        </Button>
                      </div>

                      <div className="text-center space-y-2">
                        <h3 className="text-lg font-medium">Verify your email</h3>
                        <p className="text-sm text-gray-500">
                          We sent a 6-digit verification code to <strong>{regEmail}</strong>
                        </p>
                      </div>

                      <div className="flex justify-center py-4">
                        <InputOTP
                          maxLength={6}
                          value={otpValue}
                          onChange={(val) => setOtpValue(val)}
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} className="w-10 h-12 text-lg" />
                            <InputOTPSlot index={1} className="w-10 h-12 text-lg" />
                            <InputOTPSlot index={2} className="w-10 h-12 text-lg" />
                            <InputOTPSlot index={3} className="w-10 h-12 text-lg" />
                            <InputOTPSlot index={4} className="w-10 h-12 text-lg" />
                            <InputOTPSlot index={5} className="w-10 h-12 text-lg" />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>

                      <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-bold" disabled={loading || otpValue.length !== 6}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Verify & Create Account
                      </Button>

                      <p className="text-xs text-center text-gray-500 mt-4">
                        The code will expire in 10 minutes.
                      </p>
                    </form>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-gray-500">
            <p>By continuing, you agree to our Terms of Service and Privacy Policy.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
