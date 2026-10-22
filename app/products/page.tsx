'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from "next/image";
import { toast } from 'sonner';
import { Bed, Eye, ImageOff, Package, Pencil, Sofa, Trash2 } from 'lucide-react';
import { getProducts } from '@/actions/search-products';
import { deleteProduct } from '@/actions/delete-product';
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { EmptyState } from '@/components/ui/empty-state';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import ProductHeaderActions from "@/components/products/product-header-actions";
import { ExportButton } from '@/components/export-button';
import EditProductModal from '@/components/products/edit-product-modal';
import { SearchBar } from '@/components/products/search-bar';
import FilterPopover from '@/components/products/filter-popover';
import ProductDetailPanel from '@/components/products/product-detail-panel';
import { Product } from '@/types/products';
import { cn } from '@/lib/utils';

type ProductType = 'sofa' | 'bed';

const PAGE_SIZE = 12;

const EXPORT_COLUMNS: Record<ProductType, { key: string; label: string }[]> = {
  sofa: [
    { key: 'id', label: 'Product ID' },
    { key: 'model_name', label: 'Model Name' },
    { key: 'description', label: 'Description' },
    { key: 'model_family_configuration', label: 'Configuration' },
    { key: 'upholstery', label: 'Upholstery' },
    { key: 'upholstery_color', label: 'Upholstery Color' },
    { key: 'total_width', label: 'Width' },
    { key: 'total_depth', label: 'Depth' },
    { key: 'total_height', label: 'Height' },
    { key: 'purchase_count', label: 'Times Ordered' },
  ],
  bed: [
    { key: 'id', label: 'Product ID' },
    { key: 'model_name', label: 'Model Name' },
    { key: 'description', label: 'Description' },
    { key: 'bed_size', label: 'Bed Size' },
    { key: 'headboard_type', label: 'Headboard' },
    { key: 'storage_option', label: 'Storage' },
    { key: 'upholstery', label: 'Upholstery' },
    { key: 'upholstery_color', label: 'Upholstery Color' },
    { key: 'purchase_count', label: 'Times Ordered' },
  ],
};

export default function ProductsPage() {
  const [productType, setProductType] = useState<ProductType>('sofa');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewedProduct, setViewedProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Only the newest request may update the list, so slow responses can't
  // overwrite the results of a later search.
  const latestRequest = useRef(0);

  const fetchProducts = useCallback(async () => {
    const requestId = ++latestRequest.current;
    setLoading(true);
    try {
      const result = await getProducts(productType, filters, currentPage, PAGE_SIZE, searchQuery);
      if (requestId !== latestRequest.current) return;
      setProducts(result.products);
      setTotalCount(result.totalCount);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      if (requestId === latestRequest.current) setProducts([]);
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, [productType, filters, currentPage, searchQuery]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const handleFilterChange = (newFilters: Record<string, string>) => {
    setFilters(prevFilters => ({ ...prevFilters, ...newFilters }));
    setCurrentPage(1);
  };

  // Filters are sofa-specific, so switching type starts from a clean slate.
  const handleTypeChange = (type: ProductType) => {
    setProductType(type);
    setFilters({});
    setCurrentPage(1);
    setViewedProduct(null);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    const result = await deleteProduct(String(productToDelete.id), productType);
    setIsDeleting(false);
    setProductToDelete(null);

    if (result.success) {
      toast.success(result.message);
      if (viewedProduct?.id === productToDelete.id) setViewedProduct(null);
      fetchProducts();
    } else {
      toast.error(result.message);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const hasFilters = Boolean(searchQuery) || Object.values(filters).some((value) => value && value !== 'all');
  const TypeIcon = productType === 'sofa' ? Sofa : Bed;

  return (
    <PageContainer fullWidth>
      <PageHeader title="Products" description="Sofa and bed models in the catalogue.">
        <ExportButton key={productType} source="products" productType={productType} columns={EXPORT_COLUMNS[productType]} />
        <ProductHeaderActions onProductsChanged={fetchProducts} />
      </PageHeader>

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
        <SegmentedControl
          aria-label="Product type"
          value={productType}
          onChange={handleTypeChange}
          options={[
            { value: 'sofa', label: 'Sofas', icon: Sofa },
            { value: 'bed', label: 'Beds', icon: Bed },
          ]}
        />
        <SearchBar onSearch={handleSearch} className="flex-1" />
        {productType === 'sofa' && <FilterPopover filters={filters} onFilterChange={handleFilterChange} />}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1">
          {loading && products.length === 0 ? (
            <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2", viewedProduct ? "xl:grid-cols-2 2xl:grid-cols-3" : "lg:grid-cols-3 2xl:grid-cols-4")}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-xl border bg-card" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon={hasFilters ? Package : TypeIcon}
              title={hasFilters ? `No ${productType}s match your search` : `No ${productType}s yet`}
              description={hasFilters ? 'Try a different name or clear the filters.' : 'Add a product to start building the catalogue.'}
            />
          ) : (
            <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 transition-opacity", loading && "opacity-60", viewedProduct ? "xl:grid-cols-2 2xl:grid-cols-3" : "lg:grid-cols-3 2xl:grid-cols-4")}>
              {products.map((product) => (
                <article
                  key={`${productType}-${product.id}`}
                  className={cn(
                    "group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md",
                    viewedProduct?.id === product.id && "border-primary ring-1 ring-primary"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setViewedProduct(product)}
                    className="relative aspect-[4/3] w-full bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    aria-label={`View ${product.model_name}`}
                  >
                    {product.reference_image_url ? (
                      <Image
                        src={product.reference_image_url}
                        alt={product.model_name || 'Product image'}
                        fill
                        sizes="(min-width: 1536px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                        <ImageOff className="size-8" />
                        <span className="text-xs">No image</span>
                      </div>
                    )}
                  </button>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold leading-snug text-foreground">{product.model_name}</h3>
                      {product.customization && <Badge variant="accent">Customised</Badge>}
                    </div>
                    {product.model_family_configuration && (
                      <p className="mt-0.5 text-xs uppercase tracking-wide text-muted-foreground">{product.model_family_configuration}</p>
                    )}
                    <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">
                      {product.description || 'No description'}
                    </p>
                    <div className="mt-4 flex items-center gap-1 border-t pt-3">
                      <Button variant="outline" size="sm" onClick={() => setViewedProduct(product)}>
                        <Eye /> View
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingProduct(product)}>
                        <Pencil /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-auto size-8 text-muted-foreground hover:bg-destructive-soft hover:text-destructive"
                        onClick={() => setProductToDelete(product)}
                        aria-label={`Delete ${product.model_name}`}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <PaginationBar
              className="mt-6"
              page={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              disabled={loading}
              summary={`${totalCount} ${productType}s`}
            />
          )}
        </div>

        {viewedProduct && (
          <div className="w-full shrink-0 lg:w-96">
            <div className="lg:sticky lg:top-6">
              <ProductDetailPanel product={viewedProduct} onClose={() => setViewedProduct(null)} />
            </div>
          </div>
        )}
      </div>

      <EditProductModal
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        product={editingProduct}
        onProductUpdate={() => {
          setEditingProduct(null);
          fetchProducts();
        }}
      />

      <ConfirmDialog
        open={!!productToDelete}
        onOpenChange={(open) => !open && setProductToDelete(null)}
        title={`Delete ${productToDelete?.model_name ?? 'this product'}?`}
        description="The product is removed from the catalogue. Products that are part of existing orders can't be deleted."
        confirmLabel="Delete product"
        destructive
        pending={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </PageContainer>
  );
}
