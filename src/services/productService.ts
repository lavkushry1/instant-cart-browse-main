import { Product } from '@/types/product';
import { FilterOptions } from '@/components/products/ProductFilter';

const PRODUCTS_STORAGE_KEY = 'instantCartProducts';

// Sample products data
const sampleProducts: Product[] = [
  {
    id: "1",
    name: "Smart Watch Pro",
    description: "Track your fitness and stay connected with this premium smartwatch. Features include heart rate monitoring, GPS, and water resistance.",
    price: 2999,
    compareAtPrice: 3499,
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000",
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=1000",
      "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?q=80&w=1000"
    ],
    category: "Electronics",
    tags: ["smartwatch", "fitness", "wearable"],
    stock: 15,
    featured: 1,
    discount: 14,
    createdAt: "2023-04-15T10:30:00Z",
    updatedAt: "2023-05-20T14:45:00Z"
  },
  {
    id: "2",
    name: "Premium Leather Wallet",
    description: "Handcrafted genuine leather wallet with RFID protection. Multiple card slots and compact design.",
    price: 999,
    compareAtPrice: 1299,
    images: [
      "https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=1000",
      "https://images.unsplash.com/photo-1606422364272-2857648e2e71?q=80&w=1000"
    ],
    category: "Accessories",
    tags: ["leather", "wallet", "men"],
    stock: 25,
    featured: 0,
    discount: 23,
    createdAt: "2023-03-10T09:15:00Z",
    updatedAt: "2023-04-05T11:20:00Z"
  },
  {
    id: "3",
    name: "Wireless Noise-Cancelling Headphones",
    description: "Experience premium sound quality with these comfortable wireless headphones featuring active noise cancellation.",
    price: 1499,
    compareAtPrice: 1999,
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000",
      "https://images.unsplash.com/photo-1577174881658-0f30ed549adc?q=80&w=1000"
    ],
    category: "Electronics",
    tags: ["headphones", "wireless", "audio"],
    stock: 10,
    featured: 1,
    discount: 25,
    createdAt: "2023-02-20T15:45:00Z",
    updatedAt: "2023-04-12T10:30:00Z"
  },
  {
    id: "4",
    name: "Organic Cotton T-Shirt",
    description: "Sustainably sourced, soft organic cotton t-shirt with a classic fit. Available in multiple colors.",
    price: 599,
    compareAtPrice: 0,
    images: [
      "https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=1000",
      "https://images.unsplash.com/photo-1562157873-818bc0726f68?q=80&w=1000"
    ],
    category: "Clothing",
    tags: ["t-shirt", "organic", "sustainable"],
    stock: 50,
    featured: 0,
    discount: 0,
    createdAt: "2023-01-15T12:00:00Z",
    updatedAt: "2023-03-01T09:45:00Z"
  },
  {
    id: "5",
    name: "Professional Camera Lens",
    description: "High-quality camera lens for professional photography. Wide aperture for stunning bokeh effects.",
    price: 8999,
    compareAtPrice: 9999,
    images: [
      "https://images.unsplash.com/photo-1616279969780-e1f11cf685bd?q=80&w=1000",
      "https://images.unsplash.com/photo-1617005082133-548c4dd27f2f?q=80&w=1000"
    ],
    category: "Photography",
    tags: ["camera", "lens", "professional"],
    stock: 5,
    featured: 1,
    discount: 10,
    createdAt: "2023-03-25T11:30:00Z",
    updatedAt: "2023-05-10T14:15:00Z"
  },
  {
    id: "6",
    name: "Ceramic Coffee Mug Set",
    description: "Set of 4 handcrafted ceramic coffee mugs. Microwave and dishwasher safe.",
    price: 1199,
    compareAtPrice: 1499,
    images: [
      "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=1000",
      "https://images.unsplash.com/photo-1551539221-b5f9e9dd4a21?q=80&w=1000"
    ],
    category: "Home & Kitchen",
    tags: ["mugs", "ceramic", "coffee"],
    stock: 20,
    featured: 0,
    discount: 20,
    createdAt: "2023-02-05T10:00:00Z",
    updatedAt: "2023-04-15T08:30:00Z"
  }
];

/**
 * Initialize products in local storage if not already present
 */
const initializeProducts = (): void => {
  const existingProducts = localStorage.getItem(PRODUCTS_STORAGE_KEY);
  if (!existingProducts) {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(sampleProducts));
  }
};

// Initialize products on module load
initializeProducts();

/**
 * Get all products
 */
export const getAllProducts = async (): Promise<Product[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  try {
    const productsData = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    return productsData ? JSON.parse(productsData) : [];
  } catch (error) {
    console.error('Failed to load products:', error);
    return [];
  }
};

/**
 * Get product by ID
 */
export const getProductById = async (productId: string): Promise<Product> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const products = await getAllProducts();
  const product = products.find(p => p.id === productId);
  
  if (!product) {
    throw new Error(`Product with ID ${productId} not found`);
  }
  
  return product;
};

/**
 * Get products by category
 */
export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  const products = await getAllProducts();
  return products.filter(p => p.category.toLowerCase() === category.toLowerCase());
};

/**
 * Search products
 */
export const searchProducts = async (query: string): Promise<Product[]> => {
  const products = await getAllProducts();
  const searchTerm = query.toLowerCase();
  
  return products.filter(product => 
    product.name.toLowerCase().includes(searchTerm) || 
    product.description.toLowerCase().includes(searchTerm) ||
    product.category.toLowerCase().includes(searchTerm) ||
    product.tags.some(tag => tag.toLowerCase().includes(searchTerm))
  );
};

/**
 * Get featured products
 */
export const getFeaturedProducts = async (): Promise<Product[]> => {
  const products = await getAllProducts();
  return products.filter(product => product.featured > 0);
};

/**
 * Get products on sale
 */
export const getProductsOnSale = async (): Promise<Product[]> => {
  const products = await getAllProducts();
  return products.filter(product => product.discount > 0);
};

/**
 * Get all available categories
 */
export const getAllCategories = async (): Promise<string[]> => {
  const products = await getAllProducts();
  const categoriesSet = new Set(products.map(product => product.category));
  return Array.from(categoriesSet);
};

/**
 * Get all available tags
 */
export const getAllTags = async (): Promise<string[]> => {
  const products = await getAllProducts();
  const tagsSet = new Set<string>();
  
  products.forEach(product => {
    product.tags.forEach(tag => tagsSet.add(tag));
  });
  
  return Array.from(tagsSet);
};

/**
 * Get maximum product price
 */
export const getMaxProductPrice = async (): Promise<number> => {
  const products = await getAllProducts();
  return Math.max(...products.map(product => product.price), 0);
};

/**
 * Apply filters to products
 */
export const getFilteredProducts = async (filters: FilterOptions): Promise<Product[]> => {
  const products = await getAllProducts();
  
  return products.filter(product => {
    // Filter by categories
    if (filters.categories.length > 0 && !filters.categories.includes(product.category)) {
      return false;
    }
    
    // Filter by tags
    if (filters.tags.length > 0 && !product.tags.some(tag => filters.tags.includes(tag))) {
      return false;
    }
    
    // Filter by price range
    if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
      return false;
    }
    
    // Filter by in-stock
    if (filters.inStock && product.stock <= 0) {
      return false;
    }
    
    // Filter by on-sale
    if (filters.onSale && product.discount <= 0) {
      return false;
    }
    
    return true;
  });
};

/**
 * Get all products for admin management (alias for getAllProducts for clarity)
 */
export const getProducts = async (): Promise<Product[]> => {
  return getAllProducts();
};

/**
 * Delete a product by ID
 */
export const deleteProduct = async (productId: string): Promise<boolean> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  try {
    const products = await getAllProducts();
    const updatedProducts = products.filter(product => product.id !== productId);
    
    // If no product was removed, return false
    if (updatedProducts.length === products.length) {
      return false;
    }
    
    // Save updated products
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(updatedProducts));
    return true;
  } catch (error) {
    console.error(`Failed to delete product ${productId}:`, error);
    throw new Error('Failed to delete product');
  }
};

/**
 * Add a new product
 */
export const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  try {
    const products = await getAllProducts();
    
    // Create new product with ID and timestamps
    const newProduct: Product = {
      ...productData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add to products and save
    const updatedProducts = [...products, newProduct];
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(updatedProducts));
    
    return newProduct;
  } catch (error) {
    console.error('Failed to add product:', error);
    throw new Error('Failed to add product');
  }
};

/**
 * Update an existing product
 */
export const updateProduct = async (productId: string, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Product> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  try {
    const products = await getAllProducts();
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex === -1) {
      throw new Error(`Product with ID ${productId} not found`);
    }
    
    // Update product with new data and updated timestamp
    const updatedProduct: Product = {
      ...products[productIndex],
      ...productData,
      updatedAt: new Date().toISOString()
    };
    
    // Replace old product with updated one
    products[productIndex] = updatedProduct;
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    
    return updatedProduct;
  } catch (error) {
    console.error(`Failed to update product ${productId}:`, error);
    throw new Error('Failed to update product');
  }
}; 