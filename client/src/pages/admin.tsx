import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useApp } from "@/lib/store";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Package, ShoppingCart, BarChart3, Plus, Edit, Trash, Check, Loader2, UserCheck, UserX, Building2, Tag, Upload, Settings, Save, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: string;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string;
  } | null;
  shippingAddress?: string | null;
}

interface Product {
  id: string;
  name: string;
  category: string;
  subCategory?: string | null;
  price: string;
  stockQuantity: number;
  isActive: boolean;
  sku: string;
  description: string | null;
  properties: string | null;
  imageUrl?: string | null;
  casNumber?: string | null;
}

interface Company {
  id: string;
  name: string;
  email: string;
  type: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  isActive: boolean;
  createdAt: string;
  taxId?: string | null;
  postalCode?: string | null;
  website?: string | null;
  logo?: string | null;
}

interface Inquiry {
  id: string;
  productName: string;
  buyerName: string;
  buyerEmail: string;
  buyerCompany?: string;
  buyerPhone?: string;
  subject: string;
  message: string;
  quantity?: string;
  status: string;
  createdAt: string;
  priority: string;
}

// No predefined categories - admin can add custom ones
const DEFAULT_CATEGORIES: string[] = [];

export default function AdminDashboard() {
  const { user, isLoading } = useApp();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [subCategories, setSubCategories] = useState<Record<string, Set<string>>>({});
  // We also keep a flat list of all known categories to persist even empty ones
  const [persistedCategories, setPersistedCategories] = useState<Record<string, string[]>>({}); // Category -> SubCategories[]
  const [loading, setLoading] = useState(true);

  // Product dialog state
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isProductEditing, setIsProductEditing] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    category: "",
    subCategory: "",
    price: "",
    stockQuantity: 0,
    description: "",
    properties: "",
    imageUrl: "",
    casNumber: "",
    synonyms: "",
    molFormula: "",
    molWeight: "",
    hsnCode: "",
    packingType: "",
    gstTaxRate: "",
    productPackings: [] as { size: string, price: string }[]
  });

  // Company dialog state
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
  const [isCompanyEditing, setIsCompanyEditing] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyForm, setCompanyForm] = useState({
    name: "",
    email: "",
    taxId: "",
    type: "both",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    website: "",
    logo: ""
  });

  // Category dialog state
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isCategoryEditing, setIsCategoryEditing] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");

  // SubCategory dialog state
  const [isSubCategoryDialogOpen, setIsSubCategoryDialogOpen] = useState(false);
  const [isSubCategoryEditing, setIsSubCategoryEditing] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState<string | null>(null);
  const [subCategoryParent, setSubCategoryParent] = useState(""); // Parent category for new sub-category
  const [subCategoryName, setSubCategoryName] = useState("");

  const [uploading, setUploading] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    shippingFee: "500",
    taxRate: "0.08"
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Inquiry dialog state
  const [isInquiryDialogOpen, setIsInquiryDialogOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  const openViewInquiry = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setIsInquiryDialogOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'product' | 'company') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Please upload an image file", variant: "destructive" });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        if (type === 'product') {
          setProductForm(prev => ({ ...prev, imageUrl: data.url }));
        } else {
          setCompanyForm(prev => ({ ...prev, logo: data.url }));
        }
        toast({ title: "Image uploaded successfully" });
      } else {
        toast({ title: "Failed to upload image", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error uploading image", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  // Redirect if not admin - wait for loading first
  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      setLocation("/auth");
    } else if (user.role !== "admin") {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);


  // Fetch data
  useEffect(() => {
    if (user?.role === "admin") {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    setLoading(true);
    try {
      const usersRes = await fetch("/api/admin/users", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (usersRes.ok) {
        setUsers(await usersRes.json());
      }

      const ordersRes = await fetch("/api/admin/orders", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (ordersRes.ok) {
        setOrders(await ordersRes.json());
      }

      const productsRes = await fetch("/api/products");
      let productsData: Product[] = [];
      if (productsRes.ok) {
        productsData = await productsRes.json();
        setProducts(productsData);
      }

      const companiesRes = await fetch("/api/admin/companies", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (companiesRes.ok) {
        setCompanies(await companiesRes.json());
      }

      const inquiriesRes = await fetch("/api/admin/inquiries", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (inquiriesRes.ok) {
        setInquiries(await inquiriesRes.json());
      }

      const contentRes = await fetch("/api/admin/content", {
        headers: { "Authorization": `Bearer ${token}` }
      });

      let persistedStructure: Record<string, string[]> = {};

      if (contentRes.ok) {
        const content = await contentRes.json();

        // 1. Set Settings
        setSettings({
          shippingFee: content.config_shipping_fee?.draftContent || content.config_shipping_fee?.content || "500",
          taxRate: content.config_tax_rate?.draftContent || content.config_tax_rate?.content || "0.08"
        });

        // 2. Parse Persisted Categories
        const structure = content.category_structure?.content || content.category_structure?.draftContent;
        if (structure) {
          try {
            persistedStructure = JSON.parse(structure);
            setPersistedCategories(persistedStructure);
          } catch (e) {
            console.error("Failed to parse category structure", e);
          }
        }
      }

      const uniqueCategories = new Set(productsData.map((p: Product) => p.category));
      // Add persisted categories
      Object.keys(persistedStructure).forEach(c => uniqueCategories.add(c));

      if (uniqueCategories.size > 0) {
        setCategories(Array.from(uniqueCategories));
      } else {
        setCategories([]);
      }

      // Derive sub-categories
      const subCatMap: Record<string, Set<string>> = {};

      // 1. Initialize with persisted structure
      Object.entries(persistedStructure).forEach(([cat, subs]) => {
        subCatMap[cat] = new Set(subs);
      });

      // 2. Add derived from products
      uniqueCategories.forEach(cat => {
        if (!subCatMap[cat]) subCatMap[cat] = new Set();
      });

      productsData.forEach(p => {
        if (p.subCategory && subCatMap[p.category]) {
          subCatMap[p.category].add(p.subCategory);
        }
      });
      setSubCategories(subCatMap);

    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Product handlers
  const openAddProduct = () => {
    setIsProductEditing(false);
    setEditingProduct(null);
    // Use first category if available, otherwise empty
    const defaultCategory = categories.length > 0 ? categories[0] : "";
    setProductForm({
      name: "",
      sku: "",
      category: defaultCategory,
      subCategory: "",
      price: "",
      stockQuantity: 0,
      description: "",
      properties: "",
      imageUrl: "",
      casNumber: "",
      synonyms: "",
      molFormula: "",
      molWeight: "",
      hsnCode: "",
      packingType: "",
      gstTaxRate: "",
      productPackings: []
    });
    setIsProductDialogOpen(true);
  };

  const openEditProduct = (product: Product) => {
    setIsProductEditing(true);
    setEditingProduct(product);
    // Handle both images array and imageUrl field
    const productAny = product as any;
    const imageUrl = productAny.images?.[0] || productAny.imageUrl || "";
    setProductForm({
      name: product.name,
      sku: product.sku,
      category: product.category,
      subCategory: product.subCategory || "",
      price: product.price,
      stockQuantity: product.stockQuantity,
      description: product.description || "",
      properties: product.properties || "",
      imageUrl: imageUrl,
      casNumber: product.casNumber || "",
      synonyms: (product as any).synonyms || "",
      molFormula: (product as any).molFormula || "",
      molWeight: (product as any).molWeight || "",
      hsnCode: (product as any).hsnCode || "",
      packingType: (product as any).packingType || "",
      gstTaxRate: (product as any).gstTaxRate || "",
      productPackings: (product as any).productPackings || []
    });
    setIsProductDialogOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.sku) {
      toast({ title: "Please fill in all required fields (Name, SKU)", variant: "destructive" });
      return;
    }

    const token = localStorage.getItem("auth_token");
    setIsSubmitting(true);

    try {
      const url = isProductEditing
        ? `/api/admin/products/${editingProduct?.id}`
        : "/api/admin/products";
      const method = isProductEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: productForm.name,
          sku: productForm.sku,
          category: productForm.category,
          subCategory: productForm.subCategory,
          price: productForm.price,
          stockQuantity: productForm.stockQuantity,
          description: productForm.description || undefined,
          properties: productForm.properties || undefined,
          images: productForm.imageUrl ? [productForm.imageUrl] : undefined,
          casNumber: productForm.casNumber || undefined,
          synonyms: productForm.synonyms || undefined,
          molFormula: productForm.molFormula || undefined,
          molWeight: productForm.molWeight || undefined,
          hsnCode: productForm.hsnCode || undefined,
          packingType: productForm.packingType || undefined,
          gstTaxRate: productForm.gstTaxRate || undefined,
          productPackings: productForm.productPackings.length > 0 ? productForm.productPackings : undefined
        })
      });

      if (res.ok) {
        toast({ title: isProductEditing ? "Product updated" : "Product added successfully" });
        setIsProductDialogOpen(false);
        fetchData();
      } else {
        const data = await res.json();
        toast({ title: data.message || "Failed to save product", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Failed to save product", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const token = localStorage.getItem("auth_token");
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        toast({ title: "Product deleted" });
        fetchData();
      }
    } catch (error) {
      toast({ title: "Failed to delete product", variant: "destructive" });
    }
  };

  // Company handlers
  const openAddCompany = () => {
    setIsCompanyEditing(false);
    setEditingCompany(null);
    setCompanyForm({
      name: "",
      email: "",
      taxId: "",
      type: "both",
      phone: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      website: "",
      logo: ""
    });
    setIsCompanyDialogOpen(true);
  };

  const openEditCompany = (company: Company) => {
    setIsCompanyEditing(true);
    setEditingCompany(company);
    setCompanyForm({
      name: company.name,
      email: company.email,
      taxId: company.taxId || "",
      type: company.type,
      phone: company.phone || "",
      address: company.address || "",
      city: company.city || "",
      state: company.state || "",
      country: company.country || "",
      postalCode: company.postalCode || "",
      website: company.website || "",
      logo: company.logo || ""
    });
    setIsCompanyDialogOpen(true);
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyForm.name || !companyForm.email) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    const token = localStorage.getItem("auth_token");
    setIsSubmitting(true);

    try {
      const url = isCompanyEditing
        ? `/api/admin/companies/${editingCompany?.id}`
        : "/api/admin/companies";
      const method = isCompanyEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: companyForm.name,
          email: companyForm.email,
          taxId: companyForm.taxId || undefined,
          type: companyForm.type,
          phone: companyForm.phone || undefined,
          address: companyForm.address || undefined,
          city: companyForm.city || undefined,
          state: companyForm.state || undefined,
          country: companyForm.country || undefined,
          postalCode: companyForm.postalCode || undefined,
          website: companyForm.website || undefined,
          logo: companyForm.logo || undefined
        })
      });

      if (res.ok) {
        toast({ title: isCompanyEditing ? "Company updated" : "Owner/Company added successfully" });
        setIsCompanyDialogOpen(false);
        fetchData();
      } else {
        const data = await res.json();
        toast({ title: data.message || "Failed to save company", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Failed to save company", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    const token = localStorage.getItem("auth_token");
    try {
      const res = await fetch(`/api/admin/companies/${companyId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        toast({ title: "Company deleted" });
        fetchData();
      }
    } catch (error) {
      toast({ title: "Failed to delete company", variant: "destructive" });
    }
  };

  // Category handlers
  const openAddCategory = () => {
    setIsCategoryEditing(false);
    setEditingCategory(null);
    setCategoryName("");
    setIsCategoryDialogOpen(true);
  };

  const openEditCategory = (category: string) => {
    setIsCategoryEditing(true);
    setEditingCategory(category);
    setCategoryName(category);
    setIsCategoryDialogOpen(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName) {
      toast({ title: "Please enter a category name", variant: "destructive" });
      return;
    }

    const categoryLower = categoryName.toLowerCase().trim();

    // Save to site_content
    const saveStructure = async (newCategories: string[], newSubCategories: Record<string, Set<string>>) => {
      const structure: Record<string, string[]> = {};
      newCategories.forEach(cat => {
        structure[cat] = Array.from(newSubCategories[cat] || []);
      });

      try {
        const token = localStorage.getItem("auth_token");
        await fetch("/api/admin/content", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ key: "category_structure", value: JSON.stringify(structure) })
        });

        // Auto-publish to make it live immediately
        await fetch("/api/admin/content/publish", {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        });
      } catch (e) {
        console.error("Failed to save category structure", e);
      }
    };

    if (isCategoryEditing && editingCategory) {
      // Edit mode: replace old category with new one
      if (categoryLower !== editingCategory) {
        if (categories.includes(categoryLower)) {
          toast({ title: "Category already exists", variant: "destructive" });
          return;
        }
        const newCats = categories.map(c => c === editingCategory ? categoryLower : c);
        setCategories(newCats);

        // Move sub-categories
        const newSubs = { ...subCategories };
        newSubs[categoryLower] = newSubs[editingCategory] || new Set();
        delete newSubs[editingCategory];
        setSubCategories(newSubs);

        // Update products with old category to new category
        const updatedProducts = products.map(p =>
          p.category === editingCategory ? { ...p, category: categoryLower } : p
        );
        setProducts(updatedProducts);

        saveStructure(newCats, newSubs);
      }
      toast({ title: "Category updated" });
    } else {
      // Add mode
      if (categories.includes(categoryLower)) {
        toast({ title: "Category already exists", variant: "destructive" });
        return;
      }
      const newCats = [...categories, categoryLower];
      setCategories(newCats);

      const newSubs = { ...subCategories };
      newSubs[categoryLower] = new Set();
      setSubCategories(newSubs);

      saveStructure(newCats, newSubs);
      toast({ title: "Category added successfully" });
    }
    setIsCategoryDialogOpen(false);
  };

  const handleDeleteCategory = (category: string) => {
    if (DEFAULT_CATEGORIES.includes(category)) {
      toast({ title: "Cannot delete default categories", variant: "destructive" });
      return;
    }
    const newCats = categories.filter(c => c !== category);
    setCategories(newCats);

    // Also remove from subCategories
    const newSubs = { ...subCategories };
    delete newSubs[category];
    setSubCategories(newSubs);

    // Save to site_content
    const saveStructure = async () => {
      try {
        const structure: Record<string, string[]> = {};
        newCats.forEach(cat => {
          structure[cat] = Array.from(newSubs[cat] || []);
        });
        const token = localStorage.getItem("auth_token");
        await fetch("/api/admin/content", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ key: "category_structure", value: JSON.stringify(structure) })
        });
        await fetch("/api/admin/content/publish", { method: "POST", headers: { "Authorization": `Bearer ${token}` } });
      } catch (e) { console.error(e); }
    };
    saveStructure();

    toast({ title: "Category deleted" });
  };

  // Sub-Category handlers
  const openAddSubCategory = (parentCategory?: string) => {
    setIsSubCategoryEditing(false);
    setEditingSubCategory(null);
    setSubCategoryParent(parentCategory || (categories.length > 0 ? categories[0] : ""));
    setSubCategoryName("");
    setIsSubCategoryDialogOpen(true);
  };

  const openEditSubCategory = (parentCategory: string, subCategory: string) => {
    setIsSubCategoryEditing(true);
    setEditingSubCategory(subCategory);
    setSubCategoryParent(parentCategory);
    setSubCategoryName(subCategory);
    setIsSubCategoryDialogOpen(true);
  };

  const handleSubCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subCategoryParent || !subCategoryName) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }

    // In a real app with a relational DB, we'd POST to an API.
    // Since our schema derives sub-categories from products, we don't strictly *need* to persist them 
    // until a product uses them. However, to make the UI feel responsive, we'll update the local state.
    // BUT, if we want them to persist *without* products, we'd need a separate table.
    // Given the current architecture (derived from products), "adding" a sub-category likely just means
    // making it available in the UI until it's used. 
    // Wait, if it's derived from products, it will disappear if no product uses it on refresh.
    // To solve this properly without schema changes, we can't persist empty sub-categories.
    // BUT, the user asked to "add" them.
    // If I add it effectively only in local state, it's confusing.
    // However, I can't change the database schema right now without a bigger refactor (creating a Categories table).
    // Let's assume for now the user accepts that they must creation is primarily to facilitate product creation.
    // OR, we can just update the local state and let them create a product with it immediately.

    const currentSubs = subCategories[subCategoryParent] || new Set();

    // Check for duplicates only if adding new or renaming to an existing name
    if (!isSubCategoryEditing || editingSubCategory !== subCategoryName) {
      if (currentSubs.has(subCategoryName)) {
        toast({ title: "Sub-category already exists", variant: "destructive" });
        return;
      }
    }

    // Update local state
    const newSubs = new Set(currentSubs);
    if (isSubCategoryEditing && editingSubCategory) {
      newSubs.delete(editingSubCategory);

      // Update products having the old subcategory
      const updatedProducts = products.map(p =>
        (p.category === subCategoryParent && p.subCategory === editingSubCategory) ?
          { ...p, subCategory: subCategoryName } : p
      );
      setProducts(updatedProducts);
    }
    newSubs.add(subCategoryName);

    const updatedSubCategories = {
      ...subCategories,
      [subCategoryParent]: newSubs
    };
    setSubCategories(updatedSubCategories);

    // Save to site_content
    const saveStructure = async () => {
      try {
        const structure: Record<string, string[]> = {};
        categories.forEach(cat => {
          structure[cat] = Array.from(updatedSubCategories[cat] || []);
        });
        const token = localStorage.getItem("auth_token");
        await fetch("/api/admin/content", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ key: "category_structure", value: JSON.stringify(structure) })
        });
        await fetch("/api/admin/content/publish", { method: "POST", headers: { "Authorization": `Bearer ${token}` } });
      } catch (e) { console.error(e); }
    };
    saveStructure();

    toast({ title: isSubCategoryEditing ? "Sub-category updated" : "Sub-category added" });
    setIsSubCategoryDialogOpen(false);
  };

  const handleDeleteSubCategory = (parentCategory: string, subCategory: string) => {
    const currentSubs = subCategories[parentCategory] || new Set();
    const newSubs = new Set(currentSubs);
    newSubs.delete(subCategory);

    const updatedSubCategories = {
      ...subCategories,
      [parentCategory]: newSubs
    };
    setSubCategories(updatedSubCategories);

    // Save to site_content
    const saveStructure = async () => {
      try {
        const structure: Record<string, string[]> = {};
        categories.forEach(cat => {
          structure[cat] = Array.from(updatedSubCategories[cat] || []);
        });
        const token = localStorage.getItem("auth_token");
        await fetch("/api/admin/content", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ key: "category_structure", value: JSON.stringify(structure) })
        });
        await fetch("/api/admin/content/publish", { method: "POST", headers: { "Authorization": `Bearer ${token}` } });
      } catch (e) { console.error(e); }
    };
    saveStructure();

    toast({ title: "Sub-category deleted" });
  };

  // User handlers
  const handleApproveUser = async (userId: string) => {
    const token = localStorage.getItem("auth_token");
    try {
      const res = await fetch(`/api/admin/users/${userId}/approve`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        toast({ title: "User approved successfully" });
        fetchData();
      }
    } catch (error) {
      toast({ title: "Failed to approve user", variant: "destructive" });
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    const token = localStorage.getItem("auth_token");
    try {
      const res = await fetch(`/api/admin/users/${userId}/deactivate`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        toast({ title: "User deactivated" });
        fetchData();
      }
    } catch (error) {
      toast({ title: "Failed to deactivate user", variant: "destructive" });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const token = localStorage.getItem("auth_token");
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        toast({ title: "User deleted" });
        fetchData();
      } else {
        const data = await res.json();
        toast({ title: data.message || "Failed to delete user", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Failed to delete user", variant: "destructive" });
    }
  };

  const handlePromoteUser = async (userId: string) => {
    const token = localStorage.getItem("auth_token");
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ role: "admin" })
      });

      if (res.ok) {
        toast({ title: "User promoted to Admin" });
        fetchData();
      } else {
        const data = await res.json();
        toast({ title: data.message || "Failed to promote user", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Failed to promote user", variant: "destructive" });
    }
  };

  // Settings handlers
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    const token = localStorage.getItem("auth_token");

    try {
      // Update shipping fee
      await fetch("/api/admin/content", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ key: "config_shipping_fee", value: settings.shippingFee })
      });

      // Update tax rate
      await fetch("/api/admin/content", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ key: "config_tax_rate", value: settings.taxRate })
      });

      // Publish changes
      await fetch("/api/admin/content/publish", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });

      toast({ title: "Settings saved and published successfully" });
    } catch (error) {
      toast({ title: "Failed to save settings", variant: "destructive" });
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Order handlers
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    const token = localStorage.getItem("auth_token");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast({ title: "Order status updated" });
        fetchData();
      }
    } catch (error) {
      toast({ title: "Failed to update order", variant: "destructive" });
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    const token = localStorage.getItem("auth_token");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        toast({ title: "Order deleted successfully" });
        fetchData();
      } else {
        const data = await res.json();
        toast({ title: data.message || "Failed to delete order", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Failed to delete order", variant: "destructive" });
    }
  };

  const handleDeleteInquiry = async (inquiryId: string) => {
    const token = localStorage.getItem("auth_token");
    try {
      const res = await fetch(`/api/admin/inquiries/${inquiryId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        toast({ title: "Inquiry deleted successfully" });
        fetchData();
      } else {
        const data = await res.json();
        toast({ title: data.message || "Failed to delete inquiry", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Failed to delete inquiry", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.totalAmount || "0"), 0);
  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const activeUsers = users.filter(u => u.isActive).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-green-500";
      case "shipped": return "bg-blue-500";
      case "confirmed": return "bg-indigo-500";
      case "cancelled": return "bg-red-500";
      default: return "bg-yellow-500";
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>


      </Layout>
    );
  }

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
                <h2 className="text-2xl font-bold text-primary">₹{totalRevenue.toLocaleString()}</h2>
              </div>
              <BarChart3 className="h-8 w-8 text-gold" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Orders</p>
                <h2 className="text-2xl font-bold text-primary">{pendingOrders}</h2>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-500" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <h2 className="text-2xl font-bold text-primary">{activeUsers}</h2>
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

        <Tabs defaultValue="users">
          <TabsList className="mb-6">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="owners">Owners</TabsTrigger>
            <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user accounts and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.firstName} {u.lastName}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>{u.phone || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {u.role === "employee" ? "User" : u.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={u.isActive ? "bg-green-500" : "bg-red-500"}>
                              {u.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {u.role !== "admin" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                  onClick={() => handlePromoteUser(u.id)}
                                >
                                  <UserCheck className="mr-1 h-3 w-3" /> Make Admin
                                </Button>
                              )}
                              {u.isActive ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-orange-500 border-orange-200 hover:bg-orange-50"
                                  onClick={() => handleDeactivateUser(u.id)}
                                >
                                  <UserX className="mr-1 h-3 w-3" /> Deactivate
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleApproveUser(u.id)}
                                >
                                  <UserCheck className="mr-1 h-3 w-3" /> Activate
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
                                    handleDeleteUser(u.id);
                                  }
                                }}
                              >
                                <Trash className="mr-1 h-3 w-3" /> Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Order Management</CardTitle>
                <CardDescription>View and manage all orders</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>Shipping Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No orders found
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.orderNumber}</TableCell>
                          <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {order.user ? (
                              <div className="flex flex-col">
                                <span className="font-medium">{order.user.firstName} {order.user.lastName}</span>
                                <span className="text-xs text-muted-foreground">{order.user.email}</span>
                              </div>
                            ) : "Unknown User"}
                          </TableCell>
                          <TableCell>{order.user?.phone || "-"}</TableCell>
                          <TableCell className="max-w-[200px] truncate" title={order.shippingAddress || ""}>
                            {order.shippingAddress || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{order.paymentStatus}</Badge>
                          </TableCell>
                          <TableCell className="text-right">₹{parseFloat(order.totalAmount).toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <select
                                className="border rounded px-2 py-1 text-sm bg-white"
                                value={order.status}
                                onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this order? This action cannot be undone.")) {
                                    handleDeleteOrder(order.id);
                                  }
                                }}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>Manage global application settings</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveSettings} className="space-y-6 max-w-xl">
                  <div className="space-y-2">
                    <Label htmlFor="shippingFee">Delivery Fee (₹)</Label>
                    <Input
                      id="shippingFee"
                      value={settings.shippingFee}
                      onChange={(e) => setSettings({ ...settings, shippingFee: e.target.value })}
                      placeholder="500"
                    />
                    <p className="text-xs text-muted-foreground">Fixed delivery fee applied to all orders.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Tax Rate (Decimal)</Label>
                    <Input
                      id="taxRate"
                      value={settings.taxRate}
                      onChange={(e) => setSettings({ ...settings, taxRate: e.target.value })}
                      placeholder="0.18"
                    />
                    <p className="text-xs text-muted-foreground">e.g. 0.18 for 18% GST</p>
                  </div>

                  <Button type="submit" disabled={isSavingSettings}>
                    {isSavingSettings ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" /> Save Configure
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inquiries">
            <Card>
              <CardHeader>
                <CardTitle>Inquiries</CardTitle>
                <CardDescription>View and manage product inquiries</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inquiries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No inquiries found
                        </TableCell>
                      </TableRow>
                    ) : (
                      inquiries.map((inquiry) => (
                        <TableRow key={inquiry.id}>
                          <TableCell>{new Date(inquiry.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="font-medium">{inquiry.subject}</TableCell>
                          <TableCell>{inquiry.productName}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{inquiry.buyerName}</span>
                              <span className="text-xs text-muted-foreground">{inquiry.buyerEmail}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              inquiry.priority === 'urgent' ? 'text-red-500 border-red-200' :
                                inquiry.priority === 'high' ? 'text-orange-500 border-orange-200' :
                                  'text-blue-500 border-blue-200'
                            }>
                              {inquiry.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={inquiry.status === 'pending' ? 'secondary' : 'default'}>
                              {inquiry.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2 text-center">
                              <Button variant="ghost" size="sm" onClick={() => openViewInquiry(inquiry)}>View</Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this inquiry? This action cannot be undone.")) {
                                    handleDeleteInquiry(inquiry.id);
                                  }
                                }}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Product Catalog</CardTitle>
                  <CardDescription>Manage inventory and listings</CardDescription>
                </div>
                <Button className="bg-primary" onClick={openAddProduct}>
                  <Plus className="mr-2 h-4 w-4" /> Add Product
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No products found
                        </TableCell>
                      </TableRow>
                    ) : (
                      products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.category}</TableCell>
                          <TableCell>₹{parseFloat(product.price).toLocaleString()}</TableCell>
                          <TableCell>{product.stockQuantity}</TableCell>
                          <TableCell>
                            <Badge className={product.isActive ? "bg-green-500" : "bg-red-500"}>
                              {product.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditProduct(product)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="owners">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Owner/Company Management</CardTitle>
                  <CardDescription>Manage companies and organizations</CardDescription>
                </div>
                <Button className="bg-primary" onClick={openAddCompany}>
                  <Plus className="mr-2 h-4 w-4" /> Add Owner
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No owners/companies found
                        </TableCell>
                      </TableRow>
                    ) : (
                      companies.map((company) => (
                        <TableRow key={company.id}>
                          <TableCell className="font-medium">{company.name}</TableCell>
                          <TableCell>{company.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{company.type}</Badge>
                          </TableCell>
                          <TableCell>{company.city && company.country ? `${company.city}, ${company.country}` : "-"}</TableCell>
                          <TableCell>
                            <Badge className={company.isActive ? "bg-green-500" : "bg-red-500"}>
                              {company.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditCompany(company)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500"
                              onClick={() => handleDeleteCompany(company.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Category Management</CardTitle>
                  <CardDescription>Manage product categories and sub-categories</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => openAddSubCategory()}>
                    <Plus className="mr-2 h-4 w-4" /> Add Sub-Category
                  </Button>
                  <Button className="bg-primary" onClick={openAddCategory}>
                    <Plus className="mr-2 h-4 w-4" /> Add Category
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category Name</TableHead>
                      <TableHead>Sub-Categories</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No categories found
                        </TableCell>
                      </TableRow>
                    ) : (
                      categories.map((category) => {
                        const productCount = products.filter(p => p.category === category).length;
                        const subs = subCategories[category] ? Array.from(subCategories[category]) : [];

                        return (
                          <TableRow key={category}>
                            <TableCell className="font-medium capitalize">{category}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-2">
                                {subs.length > 0 ? subs.map(sub => (
                                  <Badge key={sub} variant="secondary" className="flex items-center gap-1.5 pr-1.5 text-xs py-1">
                                    <span>{sub}</span>
                                    <div className="flex items-center gap-1 border-l pl-1.5 ml-1 border-border/50">
                                      <button
                                        onClick={() => openEditSubCategory(category, sub)}
                                        className="text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                                        title="Edit sub-category"
                                      >
                                        <Edit className="h-3 w-3" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteSubCategory(category, sub)}
                                        className="text-muted-foreground hover:text-red-500 transition-colors focus:outline-none"
                                        title="Delete sub-category"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </Badge>
                                )) : (
                                  <span className="text-muted-foreground text-xs italic">None</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{productCount} products</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditCategory(category)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openAddSubCategory(category)}
                                title="Add Sub-Category"
                              >
                                <Tag className="h-4 w-4" />
                              </Button>
                              {!DEFAULT_CATEGORIES.includes(category) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-500"
                                  onClick={() => handleDeleteCategory(category)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isProductEditing ? "Edit Product" : "Add New Product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleProductSubmit}>
            <div className="grid gap-4 py-4 pr-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="Enter product name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    placeholder="Enter SKU"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="casNumber">CAS Number</Label>
                  <Input
                    id="casNumber"
                    value={productForm.casNumber}
                    onChange={(e) => setProductForm({ ...productForm, casNumber: e.target.value })}
                    placeholder="Enter CAS Number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="molFormula">Mol. Formula</Label>
                  <Input
                    id="molFormula"
                    value={productForm.molFormula}
                    onChange={(e) => setProductForm({ ...productForm, molFormula: e.target.value })}
                    placeholder="C9H14N3O7P"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="molWeight">Mol. Weight</Label>
                  <Input
                    id="molWeight"
                    value={productForm.molWeight}
                    onChange={(e) => setProductForm({ ...productForm, molWeight: e.target.value })}
                    placeholder="307.20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hsnCode">HSN Code</Label>
                  <Input
                    id="hsnCode"
                    value={productForm.hsnCode}
                    onChange={(e) => setProductForm({ ...productForm, hsnCode: e.target.value })}
                    placeholder="29420090"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="packingType">Packing Type</Label>
                  <Input
                    id="packingType"
                    value={productForm.packingType}
                    onChange={(e) => setProductForm({ ...productForm, packingType: e.target.value })}
                    placeholder="Vial / Bottle"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstTaxRate">GST Tax Rate</Label>
                  <Input
                    id="gstTaxRate"
                    value={productForm.gstTaxRate}
                    onChange={(e) => setProductForm({ ...productForm, gstTaxRate: e.target.value })}
                    placeholder="18%"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="synonyms">Synonyms</Label>
                <Input
                  id="synonyms"
                  value={productForm.synonyms}
                  onChange={(e) => setProductForm({ ...productForm, synonyms: e.target.value })}
                  placeholder="e.g. Deoxycytidylic acid, dCMP"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={productForm.category}
                    onValueChange={(value) => setProductForm({ ...productForm, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subCategory">Sub Category</Label>
                  <Select
                    value={productForm.subCategory || ""}
                    onValueChange={(value) => setProductForm({ ...productForm, subCategory: value })}
                    disabled={!productForm.category}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={productForm.category ? "Select sub-category" : "Select category first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {productForm.category && subCategories[productForm.category] && Array.from(subCategories[productForm.category]).map((sub) => (
                        <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                      ))}
                      {!productForm.category && <SelectItem value="" disabled>Select a category first</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Product Packings Section */}
              <div className="space-y-4 border p-4 rounded-md bg-gray-50/50">
                <div className="flex justify-between items-center">
                  <Label className="text-base font-semibold">Packings & Prices</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setProductForm({
                        ...productForm,
                        productPackings: [...productForm.productPackings, { size: "", price: "" }]
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Packing
                  </Button>
                </div>

                {productForm.productPackings.map((packing, index) => (
                  <div key={index} className="flex gap-4 items-end bg-white p-3 border rounded shadow-sm">
                    <div className="space-y-2 flex-1">
                      <Label>Size / Packing (e.g. 100 mg, 1 gm)</Label>
                      <Input
                        value={packing.size}
                        onChange={(e) => {
                          const newPackings = [...productForm.productPackings];
                          newPackings[index].size = e.target.value;
                          setProductForm({ ...productForm, productPackings: newPackings });
                        }}
                        placeholder="Size"
                      />
                    </div>
                    <div className="space-y-2 flex-1">
                      <Label>Price (INR or "POR")</Label>
                      <Input
                        value={packing.price}
                        onChange={(e) => {
                          const newPackings = [...productForm.productPackings];
                          newPackings[index].price = e.target.value;
                          setProductForm({ ...productForm, productPackings: newPackings });
                        }}
                        placeholder="Price"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 mb-0.5"
                      onClick={() => {
                        const newPackings = productForm.productPackings.filter((_, i) => i !== index);
                        setProductForm({ ...productForm, productPackings: newPackings });
                      }}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {productForm.productPackings.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2 italic bg-white border border-dashed rounded">
                    No custom packings added. Default price will be used.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Enter product description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specifications">Properties</Label>
                <Textarea
                  id="properties"
                  value={productForm.properties}
                  onChange={(e) => setProductForm({ ...productForm, properties: e.target.value })}
                  placeholder="Enter product properties"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Product Image</Label>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-4 items-center">
                    <div className="flex-1">
                      <Input
                        id="imageUpload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'product')}
                        disabled={uploading}
                      />
                    </div>
                    {productForm.imageUrl && (
                      <div className="relative w-16 h-16 border rounded overflow-hidden flex-shrink-0">
                        <img
                          src={productForm.imageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                    {uploading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>
                  {productForm.imageUrl && (
                    <p className="text-xs text-muted-foreground break-all">
                      File: {productForm.imageUrl.split('/').pop()}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsProductDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  isProductEditing ? "Update Product" : "Add Product"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Company Dialog */}
      <Dialog open={isCompanyDialogOpen} onOpenChange={setIsCompanyDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{isCompanyEditing ? "Edit Company" : "Add New Owner/Company"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCompanySubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={companyForm.name}
                    onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                    placeholder="Enter company name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Email *</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={companyForm.email}
                    onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                    placeholder="company@example.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID</Label>
                  <Input
                    id="taxId"
                    value={companyForm.taxId}
                    onChange={(e) => setCompanyForm({ ...companyForm, taxId: e.target.value })}
                    placeholder="Enter Tax ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyType">Type</Label>
                  <Select
                    value={companyForm.type}
                    onValueChange={(value) => setCompanyForm({ ...companyForm, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buyer">Buyer</SelectItem>
                      <SelectItem value="seller">Seller</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={companyForm.phone}
                  onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={companyForm.address}
                  onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                  placeholder="Enter address"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={companyForm.city}
                    onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                    placeholder="Enter city"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={companyForm.state}
                    onChange={(e) => setCompanyForm({ ...companyForm, state: e.target.value })}
                    placeholder="Enter state"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={companyForm.country}
                    onChange={(e) => setCompanyForm({ ...companyForm, country: e.target.value })}
                    placeholder="Enter country"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={companyForm.postalCode}
                    onChange={(e) => setCompanyForm({ ...companyForm, postalCode: e.target.value })}
                    placeholder="Enter postal code"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={companyForm.website}
                  onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Company Logo</Label>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-4 items-center">
                    <div className="flex-1">
                      <Input
                        id="logoUpload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'company')}
                        disabled={uploading}
                      />
                    </div>
                    {companyForm.logo && (
                      <div className="relative w-16 h-16 border rounded overflow-hidden flex-shrink-0">
                        <img
                          src={companyForm.logo}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                    {uploading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>
                  {companyForm.logo && (
                    <p className="text-xs text-muted-foreground break-all">
                      File: {companyForm.logo.split('/').pop()}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCompanyDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  isCompanyEditing ? "Update Company" : "Add Owner"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{isCategoryEditing ? "Edit Category" : "Add New Category"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCategorySubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="categoryName">Category Name *</Label>
                <Input
                  id="categoryName"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Enter category name"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {isCategoryEditing ? "Update Category" : "Add Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sub-Category Dialog */}
      <Dialog open={isSubCategoryDialogOpen} onOpenChange={setIsSubCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{isSubCategoryEditing ? "Edit Sub-Category" : "Add New Sub-Category"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubCategorySubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="parentCategory">Parent Category *</Label>
                <Select
                  value={subCategoryParent}
                  onValueChange={setSubCategoryParent}
                  disabled={isSubCategoryEditing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subCategoryName">Sub-Category Name *</Label>
                <Input
                  id="subCategoryName"
                  value={subCategoryName}
                  onChange={(e) => setSubCategoryName(e.target.value)}
                  placeholder="Enter sub-category name"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsSubCategoryDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {isSubCategoryEditing ? "Update Sub-Category" : "Add Sub-Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Inquiry Details Dialog */}
      <Dialog open={isInquiryDialogOpen} onOpenChange={setIsInquiryDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Inquiry Details</DialogTitle>
            <DialogDescription>
              Received on {selectedInquiry && new Date(selectedInquiry.createdAt).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm mb-1 text-muted-foreground">Product</h4>
                  <p className="text-sm font-medium">{selectedInquiry.productName}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1 text-muted-foreground">Buyer</h4>
                  <p className="text-sm font-medium">{selectedInquiry.buyerName}</p>
                  <p className="text-xs text-muted-foreground">{selectedInquiry.buyerEmail}</p>
                  {selectedInquiry.buyerPhone && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium mr-1">Phone:</span>
                      {selectedInquiry.buyerPhone}
                    </p>
                  )}
                  {selectedInquiry.buyerCompany && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium mr-1">Company:</span>
                      {selectedInquiry.buyerCompany}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1 text-muted-foreground">Subject</h4>
                <p className="text-sm">{selectedInquiry.subject}</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1 text-muted-foreground">Message</h4>
                <div className="text-sm border p-3 rounded-md bg-muted/30 whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                  {selectedInquiry.message}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {selectedInquiry.quantity && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1 text-muted-foreground">Quantity</h4>
                    <p className="text-sm">{selectedInquiry.quantity}</p>
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-sm mb-1 text-muted-foreground">Status</h4>
                  <Badge variant={selectedInquiry.status === 'pending' ? 'secondary' : 'default'}>
                    {selectedInquiry.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsInquiryDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
