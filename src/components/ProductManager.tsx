import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertTriangle,
  Filter,
  X
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Product, ProductVariant } from '../types';
import { formatCurrency } from '../utils/calculations';

const ProductManager: React.FC = () => {
  const { products, setProducts } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const categories = [...new Set(products.map(p => p.category))];
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...productData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setProducts(prev => [...prev, newProduct]);
    setShowAddProduct(false);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => 
      p.id === updatedProduct.id 
        ? { ...updatedProduct, updatedAt: new Date().toISOString() }
        : p
    ));
    setEditingProduct(null);
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setProducts(prev => prev.filter(p => p.id !== productId));
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Management</h1>
          <p className="text-gray-600">Manage your inventory and stock levels</p>
        </div>
        <button
          onClick={() => setShowAddProduct(true)}
          className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Product
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            {(searchTerm || selectedCategory) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                }}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onEdit={() => setEditingProduct(product)}
            onDelete={() => handleDeleteProduct(product.id)}
          />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedCategory 
              ? 'Try adjusting your search or filters'
              : 'Get started by adding your first product'
            }
          </p>
          <button
            onClick={() => setShowAddProduct(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Add Product
          </button>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {(showAddProduct || editingProduct) && (
        <ProductForm
          product={editingProduct}
          onSave={editingProduct ? handleUpdateProduct : handleAddProduct}
          onCancel={() => {
            setShowAddProduct(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
};

const ProductCard: React.FC<{
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ product, onEdit, onDelete }) => {
  const totalStock = product.variants.reduce((sum, variant) => sum + variant.stockQuantity, 0);
  const lowStockVariants = product.variants.filter(v => v.stockQuantity <= v.lowStockThreshold);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
          <p className="text-sm text-gray-600">{product.brand} • {product.category}</p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={onEdit}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stock Alert */}
      {lowStockVariants.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
            <span className="text-sm font-medium text-red-800">
              {lowStockVariants.length} variant{lowStockVariants.length > 1 ? 's' : ''} low on stock
            </span>
          </div>
        </div>
      )}

      {/* Variants */}
      <div className="space-y-3">
        {product.variants.map((variant) => (
          <div key={variant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">{variant.packSize}</p>
              <p className="text-sm text-gray-600">Stock: {variant.stockQuantity} {variant.unit}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">{formatCurrency(variant.sellingPrice)}</p>
              {variant.stockQuantity <= variant.lowStockThreshold && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Low Stock
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Total Stock: {totalStock} units</span>
          <span>{product.variants.length} variant{product.variants.length > 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
};

const ProductForm: React.FC<{
  product?: Product | null;
  onSave: (product: any) => void;
  onCancel: () => void;
}> = ({ product, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    category: product?.category || '',
    brand: product?.brand || '',
    variants: product?.variants || [
      {
        id: Date.now().toString(),
        packSize: '',
        unit: 'ml',
        stockQuantity: 0,
        sellingPrice: 0,
        purchasePrice: 0,
        lowStockThreshold: 5,
        barcode: '',
        sku: ''
      }
    ]
  });

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          id: Date.now().toString(),
          packSize: '',
          unit: 'ml',
          stockQuantity: 0,
          sellingPrice: 0,
          purchasePrice: 0,
          lowStockThreshold: 5,
          barcode: '',
          sku: ''
        }
      ]
    }));
  };

  const removeVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const updateVariant = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => 
        i === index ? { ...variant, [field]: value } : variant
      )
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (product) {
      onSave({ ...product, ...formData });
    } else {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Name*</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category*</label>
              <input
                type="text"
                required
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Brand*</label>
              <input
                type="text"
                required
                value={formData.brand}
                onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Variants */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Product Variants</h3>
              <button
                type="button"
                onClick={addVariant}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm flex items-center transition-colors duration-200"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Variant
              </button>
            </div>

            <div className="space-y-4">
              {formData.variants.map((variant, index) => (
                <div key={variant.id} className="bg-gray-50 rounded-lg p-4 relative">
                  {formData.variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pack Size*</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., 500ml, 2L, 1kg"
                        value={variant.packSize}
                        onChange={(e) => updateVariant(index, 'packSize', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit*</label>
                      <select
                        value={variant.unit}
                        onChange={(e) => updateVariant(index, 'unit', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="ml">ml</option>
                        <option value="L">L</option>
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="pieces">pieces</option>
                        <option value="packets">packets</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity*</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={variant.stockQuantity}
                        onChange={(e) => updateVariant(index, 'stockQuantity', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price*</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={variant.sellingPrice}
                        onChange={(e) => updateVariant(index, 'sellingPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={variant.purchasePrice || ''}
                        onChange={(e) => updateVariant(index, 'purchasePrice', parseFloat(e.target.value) || undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Alert</label>
                      <input
                        type="number"
                        min="0"
                        value={variant.lowStockThreshold}
                        onChange={(e) => updateVariant(index, 'lowStockThreshold', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                      <input
                        type="text"
                        value={variant.barcode || ''}
                        onChange={(e) => updateVariant(index, 'barcode', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                      <input
                        type="text"
                        value={variant.sku || ''}
                        onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
            >
              {product ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductManager;