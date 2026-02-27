import { Link, useLocation } from "wouter";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { ShoppingCart, User, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AdminToolbar } from "@/lib/content";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, cart, logout, products } = useApp();
  const [location] = useLocation();
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      {/* Top Bar - Corporate Info */}
      <div className="bg-primary text-primary-foreground py-2 text-xs hidden md:block">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex gap-6">
            <span>Global HQ: Surat, India</span>
            <span>Support: +91 9737488866</span>
            <span>Email: kishan.kothiya@gmail.com</span>
          </div>
          <div className="flex gap-4">

            <Link href="/global-presence" className="hover:text-gold transition-colors">Global Presence</Link>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <a className="flex items-center gap-2 group">
              <div className="h-10 w-10 bg-primary rounded-sm flex items-center justify-center">
                <span className="text-gold font-serif font-bold text-xl">D</span>
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-xl text-primary leading-none group-hover:text-primary/90 transition-colors">
                  DUAL LIFE
                </span>
                <span className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                  Chemicals
                </span>
              </div>
            </a>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link href="/">
                    <a className={navigationMenuTriggerStyle()}>Home</a>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href="/products">
                    <a className={navigationMenuTriggerStyle()}>Products</a>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href="/team">
                    <a className={navigationMenuTriggerStyle()}>Team</a>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href="/about">
                    <a className={navigationMenuTriggerStyle()}>Company</a>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href="/contact">
                    <a className={navigationMenuTriggerStyle()}>Contact Us</a>
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <div className="h-6 w-px bg-border mx-2"></div>

            <div className="flex items-center gap-4">
              <Link href="/cart">
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-gold text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>

              {user ? (
                <div className="flex items-center gap-4">
                  <div className="text-right hidden lg:block">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                  </div>
                  <Link href={user.role === 'admin' ? '/admin' : '/dashboard'}>
                    <Button variant="outline" size="sm">
                      My Account
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={logout} title="Logout">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link href="/auth">
                    <Button variant="ghost" size="sm">Log In</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Trigger */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col gap-6 mt-6">
                  <Link href="/" className="text-lg font-medium">Home</Link>
                  <Link href="/products" className="text-lg font-medium">Products</Link>
                  <Link href="/team" className="text-lg font-medium">Team</Link>
                  <Link href="/about" className="text-lg font-medium">Company</Link>
                  <Link href="/contact" className="text-lg font-medium">Contact Us</Link>

                  <Link href="/cart" className="text-lg font-medium flex justify-between">
                    Cart
                    <span className="bg-gold text-white px-2 rounded-full text-sm">{cartCount}</span>
                  </Link>
                  <div className="h-px bg-border my-2"></div>
                  {user ? (
                    <>
                      <Link href="/dashboard" className="text-lg font-medium">My Dashboard</Link>
                      <Button onClick={logout} variant="destructive" className="w-full">Logout</Button>
                    </>
                  ) : (
                    <>
                      <Link href="/auth">
                        <Button variant="outline" className="w-full">Log In</Button>
                      </Link>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-gold rounded-sm flex items-center justify-center">
                  <span className="text-primary font-serif font-bold text-lg">D</span>
                </div>
                <span className="font-display font-bold text-lg text-white">DUAL LIFE Chemicals</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Precision in Chemistry. Power in Global Trade. We provide industrial-grade chemical solutions for the modern world.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-gold mb-4 uppercase tracking-wider text-sm">Company</h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>

                <li><Link href="/global-presence" className="hover:text-white transition-colors">Global Presence</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gold mb-4 uppercase tracking-wider text-sm">Contact</h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>Headquarters: Surat, India</li>
                <li>Phone: +91 9737488866</li>
                <li>Email: kishan.kothiya@gmail.com</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
            <p>&copy; 2025 Dual Life Chemicals. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white">Privacy Policy</a>
              <a href="#" className="hover:text-white">Terms of Trade</a>
              <a href="#" className="hover:text-white">Compliance</a>
            </div>
          </div>
        </div>
      </footer>
      <AdminToolbar />
    </div>
  );
}
