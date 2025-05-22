import { HomeBanner } from '../components/marketing/HomeBanner';
import { TopCategoriesShowcase } from '../components/categories/CategoryShowcase';
import { ProductShowcase } from '../components/products/ProductShowcase';
import { useEffect, useState } from 'react';
import { Product } from '../types/product';

// Mock data for product showcase
const mockProducts1: Product[] = [
  {
    id: 'p1',
    name: 'Apple iPhone 13 (128GB) - Midnight',
    description: 'The latest iPhone with A15 Bionic chip, 128GB storage, and advanced camera system.',
    price: 59999,
    compareAtPrice: 69900,
    images: ['https://rukminim1.flixcart.com/image/312/312/ktketu80/mobile/s/l/c/iphone-13-mlpf3hn-a-apple-original-imag6vzz5qvejz8z.jpeg'],
    discount: 15,
    featured: 1,
    stock: 10,
    tags: ['Apple', 'Smartphone'],
    category: 'Electronics',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'p2',
    name: 'Samsung Galaxy S21 FE 5G (Graphite, 128 GB)',
    description: 'Samsung Galaxy S21 FE 5G with Exynos 2100, 128GB storage, and triple camera system.',
    price: 34999,
    compareAtPrice: 49999,
    images: ['https://rukminim1.flixcart.com/image/312/312/kzpw2vk0/mobile/d/z/o/galaxy-s21-fe-5g-lavender-8gb-128gb-storage-sm-g990ezaiinu-original-imagbrzchh73gcgy.jpeg'],
    discount: 30,
    featured: 0,
    stock: 20,
    tags: ['Samsung', 'Smartphone'],
    category: 'Electronics',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'p3',
    name: 'APPLE MacBook Air M1 - (8 GB/256 GB SSD/Mac OS Big Sur) MGN63HN/A',
    description: 'Apple MacBook Air with the revolutionary M1 chip, 8GB RAM and 256GB SSD storage.',
    price: 84990,
    compareAtPrice: 99900,
    images: ['https://rukminim1.flixcart.com/image/312/312/kp5sya80/computer/n/g/u/macbook-air-apple-original-imag3ebnaugtgntp.jpeg'],
    discount: 15,
    featured: 1,
    stock: 5,
    tags: ['Apple', 'Laptop'],
    category: 'Electronics',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'p4',
    name: 'SONY WH-1000XM4 Bluetooth Headphone',
    description: 'Industry-leading noise cancelling wireless headphones with premium sound quality.',
    price: 24990,
    compareAtPrice: 29990,
    images: ['https://rukminim1.flixcart.com/image/612/612/kfeamq80/headphone/2/g/u/wh-1000xm4-sony-original-imafvvphghjdtxps.jpeg'],
    discount: 15,
    featured: 0,
    stock: 12,
    tags: ['Sony', 'Headphone'],
    category: 'Electronics',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'p5',
    name: 'OnePlus 10 Pro 5G (Volcanic Black, 128 GB)',
    description: 'OnePlus 10 Pro with Snapdragon 8 Gen 1, 128GB storage, and Hasselblad camera system.',
    price: 61999,
    compareAtPrice: 66999,
    images: ['https://rukminim1.flixcart.com/image/312/312/xif0q/mobile/y/7/g/10-pro-5g-le2121-oneplus-original-imagm9sypzgzegm.jpeg'],
    discount: 8,
    featured: 0,
    stock: 8,
    tags: ['OnePlus', 'Smartphone'],
    category: 'Electronics',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'p6',
    name: 'ASUS TUF Gaming F15 Core i5 10th Gen',
    description: 'Gaming laptop with 10th Gen Intel Core i5, dedicated NVIDIA GPU, and military-grade durability.',
    price: 59990,
    compareAtPrice: 70990,
    images: ['https://rukminim1.flixcart.com/image/312/312/xif0q/computer/s/e/z/-original-imaggkhefhu9ntfd.jpeg'],
    discount: 15,
    featured: 0,
    stock: 3,
    tags: ['ASUS', 'Laptop', 'Gaming'],
    category: 'Electronics',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const mockProducts2: Product[] = [
  {
    id: 'p7',
    name: 'Puma Men White Sneakers',
    description: 'Stylish white sneakers from Puma, perfect for casual wear with excellent comfort.',
    price: 2099,
    compareAtPrice: 4199,
    images: ['https://rukminim1.flixcart.com/image/580/696/knt7zbk0/shoe/m/r/e/7-5-374572-puma-white-black-original-imag2eynkpah6urf.jpeg'],
    discount: 50,
    featured: 0,
    stock: 25,
    tags: ['Puma', 'Shoes', 'Men'],
    category: 'Fashion',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'p8',
    name: 'Printed Men Round Neck Blue T-Shirt',
    description: 'Comfortable cotton round neck t-shirt with modern print design.',
    price: 349,
    compareAtPrice: 1499,
    images: ['https://rukminim1.flixcart.com/image/580/696/xif0q/t-shirt/k/1/n/m-ts12-vebnor-original-imagp45bhjtevf6r.jpeg'],
    discount: 76,
    featured: 0,
    stock: 100,
    tags: ['T-shirt', 'Men'],
    category: 'Fashion',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'p9',
    name: 'Women Floral Print Kurta with Palazzos',
    description: 'Elegant floral print kurta with matching palazzo pants, perfect for casual and festive occasions.',
    price: 699,
    compareAtPrice: 2499,
    images: ['https://rukminim1.flixcart.com/image/580/696/krntoy80/ethnic-set/n/u/i/xxl-2003-blue-libas-original-imag5efnjxs6dony.jpeg'],
    discount: 72,
    featured: 0,
    stock: 30,
    tags: ['Kurta', 'Women'],
    category: 'Fashion',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'p10',
    name: 'Fossil Gen 5 Smartwatch with Brown Strap',
    description: 'Premium smartwatch with Wear OS, heart rate monitoring, and customizable watch faces.',
    price: 19995,
    compareAtPrice: 22995,
    images: ['https://rukminim1.flixcart.com/image/580/696/k2jbyq80pkrrdj/watch-refurbished/z/j/x/c-ftw4026-fossil-original-imafkg33bhbhsxu8.jpeg'],
    discount: 13,
    featured: 1,
    stock: 7,
    tags: ['Fossil', 'Watch'],
    category: 'Fashion',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'p11',
    name: 'Wildcraft Hustle Backpack 30L',
    description: 'Durable 30L backpack with multiple compartments and comfortable straps for daily use.',
    price: 1499,
    compareAtPrice: 2999,
    images: ['https://rukminim1.flixcart.com/image/580/696/kbqu4sw0/backpack/3/p/v/hustle-2-8903338059592-backpack-wildcraft-original-imaftxnnjj7xsgfh.jpeg'],
    discount: 50,
    featured: 0,
    stock: 15,
    tags: ['Wildcraft', 'Backpack'],
    category: 'Fashion',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const mockProducts3: Product[] = [
  {
    id: 'p12',
    name: 'Pigeon Favourite Electric Kettle',
    description: 'Fast electric kettle with automatic shut-off and boil-dry protection for everyday use.',
    price: 499,
    compareAtPrice: 1195,
    images: ['https://rukminim1.flixcart.com/image/612/612/kcau9ow0/electric-kettle/v/z/3/pigeon-favourite-original-imaftj5gzgdgzrmx.jpeg'],
    discount: 58,
    featured: 0,
    stock: 50,
    tags: ['Kitchen', 'Appliance'],
    category: 'Home',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'p13',
    name: 'SAMSUNG 198 L Direct Cool Single Door Refrigerator',
    description: 'Energy-efficient refrigerator with digital display and stabilizer-free operation.',
    price: 15990,
    compareAtPrice: 18990,
    images: ['https://rukminim1.flixcart.com/image/300/300/kbs9k7k0/refrigerator-new/9/g/v/rr21t2h2wcu-hl-samsung-original-imaft25qtuqvmjcn.jpeg'],
    discount: 16,
    featured: 1,
    stock: 10,
    tags: ['Samsung', 'Refrigerator'],
    category: 'Appliances',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'p14',
    name: 'AJANTA Wall Clock',
    description: 'Classic analog wall clock with silent movement and decorative design for home or office.',
    price: 349,
    compareAtPrice: 549,
    images: ['https://rukminim1.flixcart.com/image/612/612/khp664w0-0/wall-clock/o/x/2/handcrafted-wooden-clock-w-06-analog-ajanta-original-imafxnyyhzemz8cy.jpeg'],
    discount: 36,
    featured: 0,
    stock: 100,
    tags: ['Clock', 'Home Decor'],
    category: 'Home',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const HomePage = () => {
  return (
    <div className="flex flex-col bg-flipkart-gray-background">
      {/* Main Banner */}
      <section>
        <HomeBanner />
      </section>

      {/* Top Categories */}
      <section className="container px-4 mt-4">
        <TopCategoriesShowcase />
      </section>
      
      {/* Product Showcases */}
      <section className="container px-4 mt-3">
        <ProductShowcase 
          title="Best of Electronics" 
          viewAllLink="/category/electronics"
          products={mockProducts1}
          backgroundImage="https://rukminim1.flixcart.com/fk-p-flap/278/278/image/7593e7b6640822c1.jpg"
        />
      </section>
      
      <section className="container px-4 mt-3">
        <ProductShowcase 
          title="Fashion Top Deals" 
          viewAllLink="/category/fashion"
          products={mockProducts2}
          backgroundImage="https://rukminim1.flixcart.com/fk-p-flap/278/278/image/31d46a8fd93eeedd.jpg"
        />
      </section>
      
      <section className="container px-4 mt-3 mb-4">
        <ProductShowcase 
          title="Home & Kitchen Essentials" 
          viewAllLink="/category/home-kitchen"
          products={mockProducts3}
          backgroundImage="https://rukminim1.flixcart.com/fk-p-flap/278/278/image/898b527fdf29b17a.jpg"
        />
      </section>
    </div>
  );
}; 