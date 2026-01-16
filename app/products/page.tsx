// app/products/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getProducts } from '@/actions/search-products';
import { deleteProduct } from '@/actions/delete-product';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import ProductHeaderActions from "@/components/products/product-header-actions";
import { ExportButton } from '@/components/export-button';
import EditProductModal from '@/components/products/edit-product-modal';
import { Product } from '@/types/products';
import { SearchBar } from '@/components/products/search-bar';
import FilterPopover from '@/components/products/filter-popover';
import ProductDetailPanel from '@/components/products/product-detail-panel';

// Note: Supabase client is now initialized inside the function that uses it.

export default function ProductsPage() {
  const [productType, setProductType] = useState<'sofa' | 'bed'>('sofa');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewedProduct, setViewedProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const pageSize = 10;

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const handleViewClick = (product: Product) => {
    setViewedProduct(product);
  };

  const handleClosePanel = () => {
    setViewedProduct(null);
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { products, totalCount } = await getProducts(productType, filters, currentPage, pageSize, searchQuery);
      setDisplayedProducts(products);
      setTotalPages(Math.ceil(totalCount / pageSize));
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setDisplayedProducts([]);
    } finally {
      setLoading(false);
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
  };

  const handleDelete = async (product: Product) => {
    const confirmation = confirm(`Are you sure you want to delete ${product.model_name}?`);
    if (confirmation) {
      try {
        await deleteProduct(String(product.id), productType);
        fetchProducts();
      } catch (error) {
        console.error("Failed to delete product:", error);
        alert("Failed to delete product. Please try again.");
      }
    }
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 container mx-auto px-4 py-8 transition-all duration-300 ease-in-out">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold">Our Products</h1>
        <div className="flex items-center gap-4">
          <SearchBar
            onSearch={handleSearch} // UPDATED: Use the new stable handler
            productType={productType}
            filters={filters}
          />
          {productType === 'sofa' && <FilterPopover onFilterChange={handleFilterChange} />}
          <ExportButton
            source="products"
            productType={productType}
            columns={[
              { key: 'id', label: 'Product ID' },
              { key: 'model_name', label: 'Model Name' },
              { key: 'description', label: 'Description' },
              { key: 'price', label: 'Price' },
              { key: 'stock_quantity', label: 'Stock Quantity' },
            ]}
          />
          <ProductHeaderActions />
        </div>
      </div>

      {/* Toggle Buttons */}
      <div className="flex gap-2 mb-8">
        <Button 
          onClick={() => setProductType('sofa')}
          variant={productType === 'sofa' ? 'default' : 'outline'}
        >
          Sofas
        </Button>
        <Button 
          onClick={() => setProductType('bed')}
          variant={productType === 'bed' ? 'default' : 'outline'}
        >
          Beds
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <p className="text-gray-500">Loading products...</p>
        </div>
      ) : displayedProducts.length > 0 ? (
        <div className={`grid gap-8 ${viewedProduct ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}`}>
          {displayedProducts.map((product) => (
            <Card key={`${productType}-${product.id}`}>
              <CardContent className="p-0">
                <div className="relative h-64 bg-gray-100 ">
                  {product.reference_image_url && typeof product.reference_image_url === 'string' && product.reference_image_url.trim() !== '' ? (
                    <Image
                      src={product.reference_image_url}
                      alt={product.model_name || 'Product Image'}
                      fill={true}
                      style={{objectFit: "cover"}}
                      className="rounded-t-lg"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No Image
                    </div>
                  )}
                </div>
              </CardContent>
              <CardHeader>
                <CardTitle>{product.model_name}</CardTitle>
                <CardDescription>{product.description}</CardDescription>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => handleViewClick(product)}>
                    View
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEditClick(product)}>
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(product)}>
                    Delete
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500">No {productType}s found. Add one to get started!</p>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <Button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span>Page {currentPage} of {totalPages}</span>
          <Button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      <EditProductModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        product={selectedProduct}
        onProductUpdate={() => {
          setIsEditModalOpen(false);
          fetchProducts();
        }}
      />
      </div>
      <div className={`transition-all ease-in-out ${viewedProduct ? 'w-full max-w-md' : 'max-w-0'} overflow-hidden sticky top-0 h-screen overflow-y-auto`}>
        <div className="w-full">
          <ProductDetailPanel product={viewedProduct} onClose={handleClosePanel} />
        </div>
      </div>
    </div>
  );
}
