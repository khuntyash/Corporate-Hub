import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Filter, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useApp, proxyImg } from "@/lib/store";
import { ChemicalImage } from "@/components/chemical-image";
import { Link, useLocation } from "wouter";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";

const PRODUCTS_PER_PAGE = 24;

export default function Products() {
  const { products, isLoading } = useApp();
  const [location] = useLocation();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  /* 
    Logic for hierarchical categories:
    1. Group products by Category -> SubCategory
    2. Filter logic:
       - If a Category is selected, show all its products (unless specific subcategories are selected? 
         Let's keep it simple: Select Category -> Show all. Select SubCategory -> Show specific.)
       - Actually, typical pattern:
         [ ] Category A
             [ ] Sub 1
             [ ] Sub 2
         Selecting Category A selects all subs.
         Selecting Sub 1 selects Sub 1.
         
    Let's use a simpler approach for now to match the user's likely expectation of refinement.
    - We track selectedCategories (High level)
    - We track selectedSubCategories (Low level)
  */

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const topRef = useRef<HTMLDivElement>(null);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filters change
  useEffect(() => setCurrentPage(1), [debouncedSearch, selectedCategories, selectedSubCategories]);

  // Parse query params for category
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const categoryParam = params.get("category");
    if (categoryParam) {
      setSelectedCategories([categoryParam]);
      setExpandedCategories([categoryParam]);
    } else {
      setSelectedCategories([]);
    }
  }, [location]);

  // Build Hierarchy using useMemo for performance
  const hierarchy = useMemo(() => {
    const h = new Map<string, Set<string>>();
    products.forEach(p => {
      if (!h.has(p.category)) h.set(p.category, new Set());
      if (p.subCategory) h.get(p.category)!.add(p.subCategory);
    });
    return h;
  }, [products]);

  const categories = useMemo(() => Array.from(hierarchy.keys()).sort(), [hierarchy]);

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  }, []);

  const toggleSubCategory = useCallback((subCat: string) => {
    setSelectedSubCategories(prev =>
      prev.includes(subCat) ? prev.filter(c => c !== subCat) : [...prev, subCat]
    );
  }, []);

  // Memoized filtered products
  const filteredProducts = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return products.filter(p => {
      // 1. Search Filter
      const matchesSearch = !q ||
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.casNumber && p.casNumber.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // 2. Category/SubCategory Filter
      const isCategorySelected = selectedCategories.length > 0;
      const isSubCategorySelected = selectedSubCategories.length > 0;

      // If nothing is selected, show everything (that matches search)
      if (!isCategorySelected && !isSubCategorySelected) return true;

      // If specific subcategories are selected, they take precedence within their parent
      // But typically, we want to show anything that matches ANY of the selected categories or subcategories.

      const categoryMatch = selectedCategories.includes(p.category);
      const subCategoryMatch = p.subCategory ? selectedSubCategories.includes(p.subCategory) : false;

      return categoryMatch || subCategoryMatch;
    });
  }, [products, debouncedSearch, selectedCategories, selectedSubCategories]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  if (isLoading) {
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
      <div className="bg-gray-50 border-b py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-primary font-display mb-4">Product Catalog</h1>
          <p className="text-muted-foreground max-w-2xl">
            Explore our comprehensive range of industrial chemicals. All products are certified and available for bulk export.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-4 text-sm text-muted-foreground" ref={topRef}>
          Showing {filteredProducts.length > 0 ? ((currentPage - 1) * PRODUCTS_PER_PAGE) + 1 : 0}–{Math.min(currentPage * PRODUCTS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length} products
        </div>

        {/* Top Full-Width Search Bar */}
        <div className="mb-8 w-full max-w-5xl">
          <div className="flex w-full border border-gray-300 rounded-[3px] bg-white overflow-hidden shadow-sm focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
            <div className="flex items-center pl-4 pr-3 py-3 bg-white text-gray-800 text-sm cursor-pointer whitespace-nowrap hover:bg-gray-50 transition-colors">
              <span className="mr-2">Products</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary mt-0.5"><path d="m6 9 6 6 6-6" /></svg>
            </div>

            <div className="w-px h-7 bg-gray-300 my-auto mx-1"></div>

            <input
              type="text"
              placeholder="Type in Product Names, Product Numbers, or CAS Numbers to see suggestions."
              className="flex-1 px-4 py-3 text-sm outline-none bg-transparent placeholder:text-gray-500 min-w-0"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <button
              className="bg-[#5c3a92] hover:bg-[#4b2f7a] text-white px-6 flex items-center justify-center transition-colors"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="w-full lg:w-64 space-y-8 flex-shrink-0">
            <div>
              {/* Search removed from sidebar, moved to top */}

              <div className="space-y-4">
                <div className="flex items-center gap-2 font-bold text-primary pb-2 border-b">
                  <Filter className="h-4 w-4" /> Categories
                </div>

                <div className="space-y-2">
                  {categories.map(category => {
                    const subCats = Array.from(hierarchy.get(category)!).sort();
                    const isExpanded = expandedCategories.includes(category);

                    return (
                      <div key={category} className="border rounded-md px-3 py-2 bg-white">
                        <div
                          className="flex items-center justify-between cursor-pointer py-1"
                          onClick={() => toggleCategory(category)}
                        >
                          <span className="font-semibold text-sm">{category}</span>
                          <span className="text-xs text-muted-foreground">{isExpanded ? '−' : '+'}</span>
                        </div>

                        {isExpanded && (
                          <div className="mt-2 pl-2 space-y-2 border-l-2 border-gray-100 ml-1">
                            {/* Option to select "All {Category}" could go here, but let's just list subcats */}
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`cat-${category}`}
                                checked={selectedCategories.includes(category)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedCategories(prev => [...prev, category]);
                                  } else {
                                    setSelectedCategories(prev => prev.filter(c => c !== category));
                                  }
                                }}
                              />
                              <label htmlFor={`cat-${category}`} className="text-sm cursor-pointer select-none">All {category}</label>
                            </div>

                            {subCats.map(sub => (
                              <div key={sub} className="flex items-center space-x-2">
                                <Checkbox
                                  id={sub}
                                  checked={selectedSubCategories.includes(sub)}
                                  onCheckedChange={() => toggleSubCategory(sub)}
                                />
                                <label
                                  htmlFor={sub}
                                  className="text-sm text-gray-600 cursor-pointer select-none"
                                >
                                  {sub}
                                </label>
                              </div>
                            ))}
                            {subCats.length === 0 && (
                              <p className="text-xs text-muted-foreground italic pl-6">No sub-categories</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>


          </div>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedProducts.map((product) => (
                <Link key={product.id} href={`/product/${product.id}`}>
                  <Card className="h-full hover:shadow-xl transition-all cursor-pointer group flex flex-col border-border/50 overflow-hidden">
                    <div className="relative aspect-[4/3] bg-white overflow-hidden border-b">
                      <div className="absolute inset-0 p-6 flex items-center justify-center bg-gray-50/50 group-hover:bg-white transition-colors">
                        <ChemicalImage
                          src={product.image}
                          alt={product.name}
                          casNumber={product.casNumber}
                          className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="absolute top-3 left-3">
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-primary/90 px-2 py-1 rounded shadow-sm">
                          {product.category || "General"}
                        </span>
                      </div>
                    </div>

                    <CardContent className="p-5 flex-1 flex flex-col">
                      <h3 className="font-sans font-bold text-primary text-xl mb-2 leading-tight group-hover:text-blue-700 transition-colors line-clamp-2">
                        {product.name}
                      </h3>

                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                        {product.description || "Premium industrial grade chemical product. Available for bulk export and domestic supply."}
                      </p>

                      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">CAS Number</span>
                          <span className="text-xs font-mono text-gray-700">{product.casNumber || "N/A"}</span>
                        </div>
                        <Button size="sm" className="bg-gray-900 text-white hover:bg-primary px-4 h-8 rounded-full text-xs font-medium transition-colors shadow-sm">
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <Button
                  variant="outline" size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-9 w-9 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  // Smart page window: show pages around current
                  let page: number;
                  if (totalPages <= 7) page = i + 1;
                  else if (currentPage <= 4) page = i + 1;
                  else if (currentPage >= totalPages - 3) page = totalPages - 6 + i;
                  else page = currentPage - 3 + i;
                  return (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(page)}
                      className="h-9 w-9 p-0 text-sm"
                    >
                      {page}
                    </Button>
                  );
                })}

                <Button
                  variant="outline" size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-9 w-9 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {filteredProducts.length === 0 && (
              <div className="text-center py-24 bg-gray-50 rounded-lg border border-dashed">
                <p className="text-lg text-muted-foreground">No products found matching your criteria.</p>
                <Button variant="link" onClick={() => { setSearch(""); setSelectedCategories([]) }}>Clear Filters</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
