import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertTriangle,
  Filter,
  X,
  Star,
  TrendingUp,
  BarChart3,
  ShoppingCart,
  Eye,
  Copy,
  Save
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
    if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      setProducts(prev => prev.filter(p => p.id !== productId));
    }
  };

  const handleDuplicateProduct = (product: Product) => {
    const duplicatedProduct: Product = {
      ...product,
      id: Date.now().toString(),
      name: `${product.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      variants: product.variants.map(variant => ({
        ...variant,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }))
    };
    setProducts(prev => [...prev, duplicatedProduct]);
  };

  const totalProducts = products.length;
  const totalVariants = products.reduce((sum, product) => sum + product.variants.length, 0);
  const lowStockCount = products.reduce((count, product) => {
    return count + product.variants.filter(variant => 
      variant.stockQuantity <= variant.lowStockThreshold
    ).length;
  }, 0);
  const totalValue = products.reduce((sum, product) => {
    return sum + product.variants.reduce((variantSum, variant) => {
      return variantSum + (variant.stockQuantity * variant.sellingPrice);
    }, 0);
  }, 0);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <img src="/KHA.jpg" alt="KHAATA" className="w-8 h-8 rounded mr-3" />
            Product Management
          </h1>
          <p className="text-gray-600">Manage your inventory and stock levels efficiently</p>
        </div>
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              List
            </button>
          </div>
          <button
            onClick={() => setShowAddProduct(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200 shadow-sm"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Product
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Products</p>
              <p className="text-2xl font-bold">{totalProducts}</p>
            </div>
            <Package className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Variants</p>
              <p className="text-2xl font-bold">{totalVariants}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Low Stock</p>
              <p className="text-2xl font-bold">{lowStockCount}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Inventory Value</p>
              <p className="text-xl font-bold">{formatCurrency(totalValue)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products by name or brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[150px]"
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
                className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Products Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={() => setEditingProduct(product)}
              onDelete={() => handleDeleteProduct(product.id)}
              onDuplicate={() => handleDuplicateProduct(product)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variants</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    onEdit={() => setEditingProduct(product)}
                    onDelete={() => handleDeleteProduct(product.id)}
                    onDuplicate={() => handleDuplicateProduct(product)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredProducts.length === 0 && (
        <div className="text-center py-16">
          <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {searchTerm || selectedCategory 
              ? 'Try adjusting your search criteria or filters to find what you\'re looking for'
              : 'Get started by adding your first product to begin managing your inventory'
            }
          </p>
          <button
            onClick={() => setShowAddProduct(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 shadow-sm"
          >
            <Plus className="w-5 h-5 mr-2 inline" />
            Add Your First Product
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
  onDuplicate: () => void;
}> = ({ product, onEdit, onDelete, onDuplicate }) => {
  const totalStock = product.variants.reduce((sum, variant) => sum + variant.stockQuantity, 0);
  const lowStockVariants = product.variants.filter(v => v.stockQuantity <= v.lowStockThreshold);
  const totalValue = product.variants.reduce((sum, variant) => sum + (variant.stockQuantity * variant.sellingPrice), 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-200 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
            {lowStockVariants.length > 0 && (
              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                Low Stock
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-1">{product.brand}</p>
          <p className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full inline-block">{product.category}</p>
        </div>
        <div className="flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={onEdit}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
            title="Edit Product"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDuplicate}
            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
            title="Duplicate Product"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
            title="Delete Product"
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
              {lowStockVariants.length} variant{lowStockVariants.length > 1 ? 's' : ''} running low
            </span>
          </div>
        </div>
      )}

      {/* Variants */}
      <div className="space-y-3 mb-4">
        {product.variants.map((variant) => (
          <div key={variant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900">{variant.packSize}</p>
                {variant.stockQuantity <= variant.lowStockThreshold && (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
              </div>
              <p className="text-sm text-gray-600">
                Stock: <span className={variant.stockQuantity <= variant.lowStockThreshold ? 'text-red-600 font-medium' : 'text-gray-900'}>
                  {variant.stockQuantity}
                </span> {variant.unit}
              </p>
              {variant.sku && (
                <p className="text-xs text-gray-500">SKU: {variant.sku}</p>
              )}
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900 text-lg">{formatCurrency(variant.sellingPrice)}</p>
              {variant.purchasePrice && (
                <p className="text-sm text-gray-500">Cost: {formatCurrency(variant.purchasePrice)}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="pt-4 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600">Total Stock</p>
            <p className="font-semibold text-gray-900">{totalStock}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Variants</p>
            <p className="font-semibold text-gray-900">{product.variants.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Value</p>
            <p className="font-semibold text-gray-900">{formatCurrency(totalValue)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductRow: React.FC<{
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}> = ({ product, onEdit, onDelete, onDuplicate }) => {
  const totalStock = product.variants.reduce((sum, variant) => sum + variant.stockQuantity, 0);
  const lowStockVariants = product.variants.filter(v => v.stockQuantity <= v.lowStockThreshold);

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900">{product.name}</p>
            {lowStockVariants.length > 0 && (
              <AlertTriangle className="w-4 h-4 text-red-500" />
            )}
          </div>
          <p className="text-sm text-gray-600">{product.brand}</p>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">{product.category}</span>
      </td>
      <td className="px-6 py-4">
        <p className="text-sm text-gray-900">{product.variants.length} variant{product.variants.length > 1 ? 's' : ''}</p>
        <p className="text-xs text-gray-500">Total: {totalStock} units</p>
      </td>
      <td className="px-6 py-4">
        {lowStockVariants.length > 0 ? (
          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
            {lowStockVariants.length} Low Stock
          </span>
        ) : (
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
            In Stock
          </span>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="p-1 text-gray-500 hover:text-blue-600"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDuplicate}
            className="p-1 text-gray-500 hover:text-green-600"
            title="Duplicate"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-gray-500 hover:text-red-600"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

const ProductForm: React.FC<{
  product?: Product | null;
  onSave: (product: any) => void;
  onCancel: () => void;
}> = ({ product, onSave, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: product?.name || '',
    category: product?.category || '',
    brand: product?.brand || '',
    variants: product?.variants || [
      {
        id: Date.now().toString(),
        packSize: '',
        unit: 'pieces',
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
          unit: 'pieces',
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
    if (formData.variants.length > 1) {
      setFormData(prev => ({
        ...prev,
        variants: prev.variants.filter((_, i) => i !== index)
      }));
    }
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
    
    // Validate basic info
    if (currentStep === 1) {
      if (!formData.name || !formData.category || !formData.brand) {
        alert('Please fill in all required fields');
        return;
      }
      setCurrentStep(2);
      return;
    }

    // Validate variants
    const validVariants = formData.variants.filter(v => v.packSize && v.sellingPrice > 0);
    if (validVariants.length === 0) {
      alert('Please add at least one valid variant with pack size and selling price');
      return;
    }

    if (product) {
      onSave({ ...product, ...formData, variants: validVariants });
    } else {
      onSave({ ...formData, variants: validVariants });
    }
  };

  const steps = [
    { number: 1, title: 'Basic Information', description: 'Product name, category, and brand' },
    { number: 2, title: 'Variants & Pricing', description: 'Pack sizes, stock, and pricing details' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-5xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                {product ? 'Edit Product' : 'Add New Product'}
              </h2>
              <p className="text-gray-600 mt-1">
                {currentStep === 1 ? 'Enter basic product information' : 'Configure variants and pricing'}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center mt-6">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  currentStep >= step.number 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step.number}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {currentStep === 1 ? (
            /* Step 1: Basic Information */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Coconut Oil, Rice, Wheat Flour"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Oils, Grains, Spices"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Parachute, India Gate, Tata"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">💡 Quick Tips</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Use clear, descriptive product names</li>
                  <li>• Categories help organize your inventory</li>
                  <li>• Brand names help customers identify products</li>
                </ul>
              </div>
            </div>
          ) : (
            /* Step 2: Variants */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Product Variants</h3>
                <button
                  type="button"
                  onClick={addVariant}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm flex items-center transition-colors duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Variant
                </button>
              </div>

              <div className="space-y-6">
                {formData.variants.map((variant, index) => (
                  <div key={variant.id} className="bg-gray-50 rounded-xl p-6 relative border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Variant {index + 1}</h4>
                      {formData.variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariant(index)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Pack Size *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g., 500ml, 2L, 1kg"
                          value={variant.packSize}
                          onChange={(e) => updateVariant(index, 'packSize', e.target.value)}
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Unit *</label>
                        <select
                          value={variant.unit}
                          onChange={(e) => updateVariant(index, 'unit', e.target.value)}
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="pieces">Pieces</option>
                          <option value="ml">ml</option>
                          <option value="L">Liters</option>
                          <option value="kg">kg</option>
                          <option value="g">Grams</option>
                          <option value="packets">Packets</option>
                          <option value="boxes">Boxes</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={variant.stockQuantity}
                          onChange={(e) => updateVariant(index, 'stockQuantity', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Current stock"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Selling Price *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={variant.sellingPrice}
                          onChange={(e) => updateVariant(index, 'sellingPrice', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Selling price"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Price</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={variant.purchasePrice || ''}
                          onChange={(e) => updateVariant(index, 'purchasePrice', parseFloat(e.target.value) || undefined)}
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Cost price"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Low Stock Alert</label>
                        <input
                          type="number"
                          min="0"
                          value={variant.lowStockThreshold}
                          onChange={(e) => updateVariant(index, 'lowStockThreshold', parseInt(e.target.value) || 5)}
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Minimum stock"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Barcode</label>
                        <input
                          type="text"
                          value={variant.barcode || ''}
                          onChange={(e) => updateVariant(index, 'barcode', e.target.value)}
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Product barcode"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
                        <input
                          type="text"
                          value={variant.sku || ''}
                          onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Stock keeping unit"
                        />
                      </div>
                    </div>

                    {/* Variant Preview */}
                    <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {variant.packSize || 'Pack Size'} - {variant.unit}
                          </p>
                          <p className="text-sm text-gray-600">
                            Stock: {variant.stockQuantity} | Price: {formatCurrency(variant.sellingPrice)}
                          </p>
                        </div>
                        {variant.stockQuantity <= variant.lowStockThreshold && variant.stockQuantity > 0 && (
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                            Low Stock
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">💡 Variant Tips</h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Add different pack sizes (500ml, 1L, 2L)</li>
                  <li>• Set low stock alerts to avoid stockouts</li>
                  <li>• Use SKU codes for easy inventory tracking</li>
                  <li>• Purchase price helps calculate profit margins</li>
                </ul>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-8">
            <div className="flex items-center gap-4">
              {currentStep === 2 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                >
                  ← Previous
                </button>
              )}
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center"
              >
                {currentStep === 1 ? (
                  <>
                    Next →
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {product ? 'Update Product' : 'Add Product'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductManager;