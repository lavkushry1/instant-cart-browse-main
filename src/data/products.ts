import { Product as ProductType, Category } from '../types';

export const categories: Category[] = [
  {
    id: 1,
    name: 'Electronics',
    slug: 'electronics',
    subcategories: [
      { id: 101, name: 'Laptops', slug: 'laptops' },
      { id: 102, name: 'Smartphones', slug: 'smartphones' },
      { id: 103, name: 'Tablets', slug: 'tablets' },
      { id: 104, name: 'Accessories', slug: 'accessories' }
    ]
  },
  {
    id: 2,
    name: 'Clothing',
    slug: 'clothing',
    subcategories: [
      { id: 201, name: 'Men', slug: 'men' },
      { id: 202, name: 'Women', slug: 'women' },
      { id: 203, name: 'Kids', slug: 'kids' }
    ]
  },
  {
    id: 3,
    name: 'Home & Kitchen',
    slug: 'home-kitchen',
    subcategories: [
      { id: 301, name: 'Furniture', slug: 'furniture' },
      { id: 302, name: 'Appliances', slug: 'appliances' },
      { id: 303, name: 'Decor', slug: 'decor' }
    ]
  },
  {
    id: 4,
    name: 'Beauty',
    slug: 'beauty',
    subcategories: [
      { id: 401, name: 'Skincare', slug: 'skincare' },
      { id: 402, name: 'Makeup', slug: 'makeup' },
      { id: 403, name: 'Haircare', slug: 'haircare' },
      { id: 404, name: 'Fragrances', slug: 'fragrances' }
    ]
  }
];

export const products: ProductType[] = [
  {
    id: 1,
    name: 'Premium Ultrabook',
    price: 1299.99,
    image: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b',
    category: 'electronics',
    rating: 4.8,
    description: 'Powerful ultrabook with the latest processor, 16GB RAM, and 512GB SSD storage. Perfect for professionals and power users.',
    brand: 'TechMaster',
    inStock: true,
    discount: 10,
    features: [
      '11th Gen Intel Core i7',
      '16GB DDR4 RAM',
      '512GB NVMe SSD',
      '14-inch 4K Display',
      'Backlit Keyboard'
    ],
    specifications: {
      'Processor': 'Intel Core i7-1165G7',
      'Memory': '16GB LPDDR4X',
      'Storage': '512GB PCIe NVMe M.2 SSD',
      'Display': '14-inch 4K UHD (3840 x 2160)',
      'Graphics': 'Intel Iris Xe Graphics',
      'Operating System': 'Windows 11 Pro',
      'Battery': 'Up to 12 hours',
      'Weight': '1.2 kg'
    }
  },
  {
    id: 2,
    name: 'Ultra HD Smart TV',
    price: 899.99,
    image: 'https://images.unsplash.com/photo-1461151304267-38535e780c79',
    category: 'electronics',
    rating: 4.5,
    description: '55-inch Ultra HD Smart TV with stunning picture quality and smart features. Connect to your favorite streaming services effortlessly.',
    brand: 'ViewPro',
    inStock: true,
    features: [
      '55-inch 4K UHD Display',
      'Smart TV Capabilities',
      'HDR Support',
      'Voice Control',
      'Multiple HDMI Ports'
    ],
    specifications: {
      'Screen Size': '55 inches',
      'Resolution': '3840 x 2160 (4K UHD)',
      'Refresh Rate': '120Hz',
      'Connectivity': 'Wi-Fi, Bluetooth, HDMI x4, USB x3',
      'Audio': '20W Speakers with Dolby Atmos',
      'Smart TV Platform': 'WebOS 6.0',
      'Dimensions': '1230 x 710 x 60 mm',
      'Weight': '16.2 kg'
    }
  },
  {
    id: 3,
    name: 'Wireless Noise-Cancelling Headphones',
    price: 249.99,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
    category: 'electronics',
    rating: 4.7,
    description: 'Premium wireless headphones with active noise cancellation for immersive sound experience. Perfect for travel and work.',
    brand: 'AudioPeak',
    inStock: true,
    discount: 20,
    features: [
      'Active Noise Cancellation',
      'Wireless Bluetooth 5.2',
      '30-hour Battery Life',
      'Quick Charge Technology',
      'Premium Sound Quality'
    ],
    specifications: {
      'Type': 'Over-ear',
      'Connectivity': 'Bluetooth 5.2, 3.5mm jack',
      'Battery Life': 'Up to 30 hours with ANC on',
      'Charging': 'USB-C, 10 min charge for 5 hours playback',
      'Frequency Response': '20Hz - 20kHz',
      'Weight': '250g',
      'Features': 'Touch controls, voice assistant support, foldable design',
      'Colors': 'Black, Silver, Navy Blue'
    }
  },
  {
    id: 4,
    name: 'Smart Fitness Tracker',
    price: 129.99,
    image: 'https://images.unsplash.com/photo-1576243345690-4e4b79b63288',
    category: 'electronics',
    rating: 4.3,
    description: 'Advanced fitness tracker with heart rate monitor, sleep tracking, and smart notifications. Water-resistant for swimming.',
    brand: 'FitTech',
    inStock: true,
    features: [
      '24/7 Heart Rate Monitoring',
      'Sleep Tracking',
      'Water Resistant (50m)',
      'GPS Tracking',
      'Smart Notifications'
    ],
    specifications: {
      'Display': '1.4-inch AMOLED touchscreen',
      'Battery Life': 'Up to 7 days',
      'Water Resistance': '5 ATM (50m)',
      'Sensors': 'Heart rate, accelerometer, gyroscope, GPS',
      'Connectivity': 'Bluetooth 5.0',
      'Compatibility': 'iOS 10.0+, Android 5.0+',
      'Weight': '32g',
      'Materials': 'Aluminum case, silicone band'
    }
  },
  {
    id: 5,
    name: 'Casual Denim Jacket',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1543076447-215ad9ba6923',
    category: 'clothing',
    rating: 4.4,
    description: 'Classic denim jacket with a modern fit. Perfect for casual outings and everyday wear.',
    brand: 'UrbanStyle',
    inStock: true,
    features: [
      'Premium Denim Material',
      'Classic Button Front',
      'Multiple Pockets',
      'Adjustable Cuffs',
      'Versatile Design'
    ],
    specifications: {
      'Material': '100% Cotton Denim',
      'Fit': 'Regular fit',
      'Closure': 'Button front',
      'Pockets': 'Two chest pockets, two side pockets',
      'Care': 'Machine wash cold, tumble dry low',
      'Origin': 'Imported'
    }
  },
  {
    id: 6,
    name: 'Modern Coffee Table',
    price: 199.99,
    image: 'https://images.unsplash.com/photo-1605365070248-299a182a2ca6',
    category: 'home-kitchen',
    rating: 4.2,
    description: 'Elegant coffee table with modern design. Features storage space and durable construction.',
    brand: 'HomeElegance',
    inStock: true,
    discount: 15,
    features: [
      'Modern Design',
      'Built-in Storage',
      'Durable Construction',
      'Easy Assembly',
      'Scratch-resistant Surface'
    ],
    specifications: {
      'Material': 'Engineered wood with oak veneer',
      'Dimensions': '100cm x 50cm x 45cm (L x W x H)',
      'Weight': '15kg',
      'Color': 'Oak/Black',
      'Assembly': 'Required, tools included',
      'Storage': 'Open shelf and drawer'
    }
  },
  {
    id: 7,
    name: 'Anti-Aging Moisturizer',
    price: 39.99,
    image: 'https://images.unsplash.com/photo-1570194065650-d766e6a42e58',
    category: 'beauty',
    rating: 4.6,
    description: 'Advanced anti-aging moisturizer with hyaluronic acid and retinol. Reduces fine lines and improves skin texture.',
    brand: 'DermaGlow',
    inStock: true,
    features: [
      'With Hyaluronic Acid',
      'Contains Retinol',
      'Paraben-free',
      '24-hour Hydration',
      'Reduces Fine Lines'
    ],
    specifications: {
      'Size': '50ml',
      'Skin Type': 'All skin types',
      'Key Ingredients': 'Hyaluronic acid, retinol, vitamin E, peptides',
      'Application': 'Morning and evening',
      'Benefits': 'Hydration, anti-aging, skin firming',
      'Expiry': '12 months after opening'
    }
  },
  {
    id: 8,
    name: 'Premium Smartphone',
    price: 999.99,
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab',
    category: 'electronics',
    rating: 4.9,
    description: 'Flagship smartphone with cutting-edge camera, powerful processor, and all-day battery life. Features a stunning OLED display.',
    brand: 'GalaxyTech',
    inStock: true,
    features: [
      'Triple Camera System',
      '5G Connectivity',
      'All-day Battery Life',
      'OLED Display',
      'Water Resistant'
    ],
    specifications: {
      'Display': '6.5-inch OLED (3200 x 1440)',
      'Processor': 'Octa-core 2.8GHz',
      'Memory': '8GB RAM, 256GB Storage',
      'Camera': 'Triple rear (48MP + 12MP + 12MP), 32MP front',
      'Battery': '4500mAh, fast charging',
      'OS': 'Android 12',
      'Dimensions': '158 x 74 x 8.1 mm',
      'Weight': '189g'
    }
  }
];

export const featuredProducts = [1, 3, 6, 8];
