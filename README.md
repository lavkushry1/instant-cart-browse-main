# Welcome to Instant Cart E-commerce

## Overview
This project is an e-commerce platform modeled after Nykaa and Flipkart, focusing on allowing users to purchase products without login and integrating custom payment options including UPI QR code and credit card processing.

## Project Documentation
For detailed information about this project, see the following documentation:

- [Requirements and Implementation Plan](docs/requirements.md) - Overview of project requirements and implementation steps
- [Credit Card Flow Implementation](docs/credit-card-flow.md) - Detailed explanation of the credit card payment process
- [Admin Management Features](docs/admin-management.md) - Documentation for Product, Theme, SEO, Analytics and Order Management tools
- [Implementation Status](docs/implementation-status.md) - Current status of completed and pending features

## Technologies Used
This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Getting Started

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd instant-cart-browse

# Step 3: Install the necessary dependencies
npm i

# Step 4: Start the development server
npm run dev
```

## Key Features

- **Guest Checkout:** Users can browse and purchase without creating an account
- **Dual Payment Options:**
  - UPI QR Code payment with admin-configurable UPI ID
  - Credit Card payment with address validation and OTP verification
- **Order Tracking:** Simulated tracking information after payment processing
- **Admin Management:**
  - Product Management (creation, editing, inventory control)
  - Theme Management (customization, layout building, responsive design)
  - SEO Management (meta data, sitemaps, content optimization)
  - Tracking Code Integration (Google Analytics, Facebook Pixel)
  - Analytics & Reporting (sales data, customer insights, custom reports)
  - Order Management (processing, tracking, returns, reporting)
  - Payment Settings and Card Data Management

## Testing the Credit Card Flow

To test the credit card payment flow:

1. Add products to your cart and proceed to checkout
2. Fill in delivery details and continue to payment
3. Select "Credit Card" as payment method
4. Enter card details
5. To test address validation, enter a ZIP code starting with '9'
6. Correct the address in the address correction form
7. Enter the displayed OTP code
8. Watch the transaction processing with 10-minute countdown
9. View order tracking information

## Admin Access

To access the admin panel:

1. Visit `/admin` or click the "Admin" link in the footer
2. Log in using demo credentials:
   - Username: `admin`
   - Password: `admin123`
3. Access various admin features:
   - Product Management
   - Theme Management
   - SEO Tools
   - Tracking Code Integration
   - Analytics & Reports
   - Order Management
   - Payment Settings

For card details specifically:
1. Click "Admin Access" in the payment methods page 
2. Use the same password: `admin123`
3. View and manage stored card details

## Project Structure

```
src/
├── components/
│   ├── admin/           # Admin interface components
│   │   ├── products/    # Product management components
│   │   ├── themes/      # Theme management components
│   │   ├── seo/         # SEO management components
│   │   ├── tracking/    # Tracking code components
│   │   ├── analytics/   # Analytics and reporting components
│   │   └── orders/      # Order management components
│   ├── checkout/        # Payment and checkout related components
│   │   ├── AddressCorrection.tsx
│   │   ├── AdminCardDetails.tsx
│   │   ├── CreditCardForm.tsx
│   │   ├── OrderTracking.tsx
│   │   └── PaymentMethods.tsx
│   ├── ui/              # UI components from shadcn
│   └── ...              # Other components
├── pages/
│   ├── admin/           # Admin pages
│   │   ├── Products.tsx     # Product management page
│   │   ├── Themes.tsx       # Theme management page
│   │   ├── Seo.tsx          # SEO management page
│   │   ├── Tracking.tsx     # Tracking code management page
│   │   ├── Analytics.tsx    # Analytics dashboard page
│   │   └── Orders.tsx       # Order management page
│   ├── Checkout.tsx     # Main checkout page
│   └── ...              # Other pages
└── ...
```

## Deployment

You can deploy this project to any static site hosting platform like Vercel, Netlify, or GitHub Pages.

## Contributing

Feel free to submit issues or pull requests to improve this project.

## Testing Documentation

This project uses Vitest and React Testing Library for comprehensive testing. The test setup allows us to test components, services, and pages to ensure they function correctly.

### Test Setup

The testing environment is configured with:

- **Vitest** - Fast testing framework compatible with Vite
- **React Testing Library** - For component testing
- **JSDOM** - Browser-like environment for tests
- **User Event** - For simulating user interactions

### Running Tests

You can run tests using the following commands:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate test coverage report
npm run test:coverage
```

### Test Structure

Tests are structured to cover:

1. **UI Components** - Testing UI components for correct rendering and behavior
2. **Pages** - Testing pages for proper functionality and navigation
3. **Business Logic** - Testing business logic for correct implementation

### Current Test Coverage

Currently implemented tests cover:

- Button component
- ProductReviews component  
- Checkout page

### Test Philosophy

Our testing approach follows these principles:

1. **User-centric testing** - Tests focus on how users interact with the application
2. **Integration over unit** - Preference for testing components integrated with their dependencies
3. **Accessibility** - Tests ensure components are accessible

### Future Test Improvements

Future test improvements will include:

- Comprehensive service mocking
- E2E testing with Playwright
- Visual regression testing
- Performance testing
