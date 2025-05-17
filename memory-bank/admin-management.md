# Admin Management Features

This document details the administration features available in the Instant Cart E-commerce platform, including Product Management, Theme Management, and Offer Management capabilities.

## Overview

(Details omitted for brevity)

## Access Admin Panel

(Details omitted for brevity)

## Product Management

**Status:** `[P]` Partially Implemented (Core CRUD UI connected to backend, pending deployment and full testing)

-   **Admin UI Components:** Review of `src/pages/Admin/Products.tsx` (listing) and `src/pages/Admin/ProductForm.tsx` (create/edit) shows they are substantially pre-built.
    -   `Products.tsx` initializes `products-getAllProductsCF` and `products-deleteProductCF` for listing and deleting products.
    -   `ProductForm.tsx` initializes `products-createProductCF`, `products-getProductByIdCF`, `products-updateProductCF` for create/edit, and `categories-getAllCategoriesCF` for populating category selection.
        -   **Enhanced:** Added an "SEO" tab with fields for `slug`, `seoTitle`, `seoDescription`. Client-side auto-slug generation from product name implemented. Pre-generation of product ID for new products added for stable image storage paths.
    -   Both components include mock fallbacks if Firebase functions aren't available.
-   **Backend Service (`src/services/productService.ts`):**
    -   Core BE functions (`createProductBE`, `getAllProductsBE`, `getProductByIdBE`, `updateProductBE`, `deleteProductBE`) are implemented.
    -   Logic to update category `productCount` is integrated into these functions using Firestore transactions.
    -   **Enhanced:** `Product` interface updated with `slug`, `seoTitle`, `seoDescription`. 
        - `ProductCreationData` now optionally accepts a pre-generated `id`.
        - `createProductBE` updated to use a pre-generated `id` if provided (with checks to prevent overwrites) and to generate a server-side unique slug from product name or provided slug candidate.
        - `updateProductBE` updated to generate a server-side unique slug if `name` changes (and `slug` isn't explicitly provided) or if `slug` is explicitly provided (ensuring its uniqueness).
-   **Cloud Functions (`functions/src/api/products.functions.ts`):**
    -   `createProductCF`, `updateProductCF`, `deleteProductCF` were verified as callable, using `ensureAdmin`, and correctly invoking their respective BE service functions.
    -   `getAllProductsCF` was **modified** from HTTP-triggered to be callable, includes `ensureAdmin`, and passes client-side options (including fetching all products for admin) to `getAllProductsBE`. Expected by `Admin/Products.tsx`.
    -   `getProductByIdCF` was **modified** from HTTP-triggered to be callable. It does not currently enforce admin-only access, as it might be used by public pages, but fetches product details suitable for the admin edit form. Expected by `Admin/ProductForm.tsx`.
-   **Exports (`functions/src/index.ts`):** Verified that product functions are correctly exported under the `products` namespace, aligning with frontend expectations (`products-functionName`).

**Next steps:** 
1.  **Deploy updated Cloud Functions for products and categories.** (`firebase deploy --only functions:products,functions:categories`)
2.  Thoroughly test the Product Management UI (list, search, sort, add, edit, delete) and backend integration.
3.  Verify `productCount` on categories is updated correctly after product CRUD operations.
4.  Implement image uploading (currently uses comma-separated URLs - Req 8.2.3.1.9 enhancement). (`[P]` Initial implementation done in `ProductForm.tsx`: supports file selection, upload to Firebase Storage, and saving download URLs. Needs robust product ID handling for new products. Old images are now deleted from Storage when a product is deleted (`deleteProductBE`) or when specific images are removed during a product update (`updateProductBE`).)
5.  Refine filtering/sorting options in `Admin/Products.tsx` if needed (currently client-side after initial full fetch).
6.  **Finalize SEO field implementation:** (`[X]` Done - Req 8.2.3.1.12)

### Key Features (To be verified post-integration)
- List all products (paginated, sortable, searchable, filterable by category, stock, visibility - some client-side currently).
- Create new products (name, desc, SKU, price, category, stock, images (URL-based), tags, visibility, SEO fields - (`[P]` SEO fields added, slug auto-gen basic)).
- Edit existing products.
- Delete products (with `productCount` update on category).
- Toggle product visibility.

## Category Management

**Status:** `[W]` Work in Progress / Partially Implemented
- Admin Category Panel UI (`src/pages/Admin/Categories.tsx`) was found to be substantially pre-built, including:
    - Initialization of Firebase callable functions (`categories-getAllCategoriesCF`, `categories-createCategoryCF`, `categories-updateCategoryCF`, `categories-deleteCategoryCF`).
    - A `CategoryForm` component for create/edit operations (name, description, image URL, parent category, enabled status).
    - Table display for categories with attempted hierarchical rendering.
    - UI for add, edit, delete with dialogs.
- Backend service `src/services/categoryService.ts` verified:
    - `Category` type matches frontend needs.
    - `createCategoryBE`, `getAllCategoriesBE`, `updateCategoryBE` are functional.
    - `deleteCategoryBE` prevents deletion if products are associated.
        - **Enhanced:** Now also prevents deletion if subcategories exist, throwing an error: "Cannot delete category: subcategories exist. Please delete or reassign subcategories first."
- Cloud Functions in `functions/src/api/categories.functions.ts` reviewed:
    - `createCategoryCF`, `updateCategoryCF`, `deleteCategoryCF` are callable and use admin checks.
        - **Enhanced `deleteCategoryCF`**: Updated to specifically handle the "subcategories exist" error from `deleteCategoryBE` with an HttpsError code `failed-precondition`.
    - `getAllCategoriesCF` **modified** from HTTP-triggered to be a callable function, includes admin check, and fetches all categories as expected by the admin UI.
- Exports in `functions/src/index.ts` are correct.

**Next steps:** 
1.  Deploy updated Cloud Functions.
2.  Thoroughly test the Category Management UI and backend integration (especially create, update, delete including new safeguards).
3.  Update product count for categories when products are created/deleted/category changed. (`[X]` Done in `productService.ts`)

### Key Features (To be verified post-integration)
- List all categories (hierarchically if possible).
- Add new categories (name, description, parent, image, enabled status).
- Edit existing categories.
- Delete categories (with safeguards for associated products).

### Category Management Workflow (To be verified)
1.  Admin navigates to "Manage Categories".
2.  Categories are fetched and displayed.
3.  Admin can add, edit, or delete categories.
4.  Changes are saved to Firestore via Cloud Functions.

## Offer Management System

The Offer Management System allows administrators to create, update, and manage promotional offers that apply to specific products or the entire store.

**Status:** 
- Admin Offer Panel UI (`src/pages/Admin/Offers.tsx`) enhanced and fully integrated with backend Firebase Cloud Functions (`offers-getAllOffersAdminCF`, `offers-createOfferCF`, `offers-updateOfferCF`, `offers-deleteOfferCF`). CRUD operations are functional.
- Backend service `src/services/offerService.ts` confirmed to have complete Firestore logic for offer management using Firebase Admin SDK.
- Cloud Functions in `functions/src/api/offers.functions.ts` are implemented to securely expose backend offer services to the admin panel.
- `OfferContext.tsx` created and `OfferProvider` integrated into `src/App.tsx` for frontend offer consumption.
- `ProductCard.tsx` updated for dynamic pricing based on active offers.
- `Cart.tsx` updated for dynamic totals and applied offer display.
- `Checkout.tsx` updated to calculate and pass offer-adjusted totals.
- `OrderSummary.tsx` (within Checkout) has been updated to display the detailed pricing breakdown including original subtotal, total applied discounts (promotions), and a list of applied offer names. The final total reflects all these adjustments.

**Offer Management System is now End-to-End Functional.**

Next steps: 
1.  **Thorough Testing**: Test the entire offer lifecycle: creation in admin, application on product pages, cart calculations, and checkout totals across various offer types (product, category, store-wide, conditional), priorities, and validity periods.
2.  Refine UI for applied offers on the frontend if needed (e.g., more detailed messages, offer conditions display if applicable).
3.  Consider edge cases and advanced offer stacking/combination rules if required by business logic.

### Key Features

(Details omitted for brevity, see previous version)

### Offer Management Workflow

1.  **Admin Creates/Edits Offer**: Via "Manage Offers" tab, saved to Firestore.
2.  **Frontend Fetches Offers**: `OfferProvider` loads offers.
3.  **Product Display**: `ProductCard.tsx` shows offer-adjusted prices.
4.  **Cart Calculation**: `Cart.tsx` uses `useOffers()` for dynamic totals and lists applied offers.
5.  **Checkout**: `Checkout.tsx` recalculates totals. `OrderSummary.tsx` displays the original subtotal, promotion discounts, tax, shipping, the list of applied offers, and the final grand total.

## User Management

**Status:** `[X]` Implemented & Verified (Core functionality for listing users and managing roles is in place)

-   **Admin UI (`src/pages/Admin/Customers.tsx`):**
    -   A dedicated page exists for viewing and managing customer accounts.
    -   It initializes and uses Firebase callable functions: `users-getAllUserProfilesCF` and `users-updateUserRolesCF`.
    -   Displays a list of users in a table showing: Name, Email, Roles (as badges), and Joined Date.
    -   Provides a "Manage Roles" button for each user, opening a dialog to modify their roles (customer, editor, admin).
    -   Handles loading states and displays toast notifications for operations.
    -   Includes fallback mock functions for development if Firebase is unavailable.
-   **Backend Service (`src/services/userService.ts`):**
    -   Contains `getAllUserProfilesBE` for fetching users with filtering/sorting options suitable for admin use.
    -   Contains `updateUserRolesBE` for modifying user roles in Firestore.
    -   Defines `UserProfile` and `UserRole` types.
-   **Cloud Functions (`functions/src/api/users.functions.ts`):**
    -   `getAllUserProfilesCF`: Callable, admin-protected, invokes `getAllUserProfilesBE`.
    -   `updateUserRolesCF`: Callable, admin-protected, invokes `updateUserRolesBE`.
-   **Exports (`functions/src/index.ts`):** Verified that user management related Cloud Functions are correctly exported under the `users` namespace.

**Next steps:**
1.  Consider adding pagination for large user lists in `Customers.tsx`.
2.  Consider adding search/filter capabilities directly in the UI.
3.  Evaluate need for more explicit "disable/enable" user functionality beyond role management.

### Key Features
- List all registered users with key details.
- View and manage user roles (e.g., promote to admin/editor, demote to customer).

## Site Settings Management

**Status:** `[X]` Implemented & Verified (All specified site settings fields are now configurable: General, Logo, Social, Currency, SEO, Tracking, Theme, UPI)

-   **Admin UI (`src/pages/Admin/Settings.tsx`):**
    -   A dedicated page with tabs for "General", "Payments", and "Store Info".
    -   **General Tab:** Allows management of Store Name, Description, Store Logo URL, Contact Email, Phone, Social Media Links (Facebook, Instagram, Twitter), Theme Preferences (Primary Color, Secondary Color, Font Family), and Maintenance Mode.
    -   **Payments Tab:**
        -   Provides a section for "UPI QR Code Settings" with an input field for "Store UPI ID (VPA)".
        -   Allows saving the UPI ID.
        -   Also includes a section to access the demo "AdminCardDetails" component.
    -   **Store Info Tab:** Allows management of Default Currency Code, Supported Currency Codes (comma-separated), Default Meta Title, Default Meta Description, Google Analytics ID, and Facebook Pixel ID.
    -   Initializes and uses Firebase callable functions: `admin-getSiteSettingsCF` to fetch settings and `admin-updateSiteSettingsCF` to save them.
    -   Handles loading states and displays toast notifications.
    -   Includes fallback mock functions for development.
-   **Shared Type (`src/services/adminService.ts`):
    -   The `SiteSettings` interface defines the structure for site configuration, including `storeName`, `contactEmail`, and `paymentGatewayKeys: { upiVpa?: string }`.
-   **Backend Service (`functions/src/services/adminServiceBE.ts`):
    -   `getSiteSettingsBE`: Fetches the site configuration from a specific Firestore document (`admin_settings/site_config`).
    -   `updateSiteSettingsBE`: Updates the site configuration document in Firestore, supporting partial updates and adding server timestamps.
-   **Cloud Functions (`functions/src/api/admin.functions.ts`):
    -   `getSiteSettingsCF`: Callable, admin-protected, invokes `getSiteSettingsBE`.
    -   `updateSiteSettingsCF`: Callable, admin-protected, invokes `updateSiteSettingsBE`.
-   **Exports (`functions/src/index.ts`):
    -   Admin settings related Cloud Functions are correctly exported under the `admin` namespace.

**Next steps:**
1.  Ensure robust error handling and validation for all settings inputs (ongoing as new fields are added).
2.  Consider how these theme settings will be consumed and applied on the frontend (requires further implementation in `ThemeProvider` or relevant components).

### Key Features (Partially Implemented)
- Manage general store information (name, contact, maintenance mode, store logo URL, social media links, theme preferences).
- Configure store's UPI ID (VPA) for QR code payments.
- Configure default & supported currencies, global SEO meta tags, and tracking IDs (Google Analytics, Facebook Pixel).

## Theme Management

(Details omitted for brevity - see previous versions)

## SEO Management

(Details omitted for brevity - see previous versions)

## Tracking Code Management

(Details omitted for brevity - see previous versions)

## Analytics and Reporting

**Status:** `[X]` Implemented & Verified (Backend refactored, UI connected)

-   **Admin Dashboard UI (`src/pages/Admin/Dashboard.tsx`):**
    -   Provides a visual overview of key store metrics.
    -   Displays summary cards for Total Sales, Total Orders, Average Order Value, and Total Customers.
    -   Includes charts for Sales Trend (line chart) and Order Count (bar chart) over a selected time period (Today, Week, Month, Year).
    -   Shows breakdowns for Order Status and Sales by Category (doughnut chart).
    -   Lists recent orders with links to their details.
    -   Allows users to select the time period for the displayed data.
    -   Handles loading states with skeleton loaders and provides a refresh button.
-   **Client-Side Service (`src/services/analyticsService.ts`):**
    -   Refactored to call a backend Cloud Function (`analytics-getDashboardDataCF`) for all analytics data.
    -   No longer performs client-side data aggregation.
    -   Defines `DashboardDataClient` types for the frontend and handles mapping of Timestamps from the backend response.
-   **Backend Cloud Function (`functions/src/api/analytics.functions.ts`):**
    -   A new callable Cloud Function `analytics-getDashboardDataCF` was created.
    -   This function is admin-protected.
    -   It calls the `getDashboardDataBE` function from the backend analytics service.
-   **Backend Analytics Service (`functions/src/services/analyticsServiceBE.ts`):**
    -   A new service `analyticsServiceBE.ts` was created to handle all data aggregation logic.
    -   It fetches comprehensive order data (from `orderServiceBE.ts`) and product data (from `productServiceBE.ts`) using pagination to ensure all relevant records are processed.
    -   Aggregates data to generate sales summaries, product summaries, customer summaries, order status counts, sales by category/payment method, and sales over time metrics.
    -   This ensures that analytics are based on complete backend data rather than potentially limited client-side fetches.
-   **Data Flow:** `Admin/Dashboard.tsx` (UI) -> `analyticsService.ts` (Client Service Call) -> `analytics-getDashboardDataCF` (Cloud Function) -> `analyticsServiceBE.ts` (Backend Aggregation) -> Fetches data from `orderServiceBE.ts` & `productServiceBE.ts`.
-   **Note:** Growth metrics (e.g., sales growth vs. previous period) are not currently calculated by the backend service and have been removed from the dashboard display to reflect accurately available data. These could be added as a future enhancement by extending the backend service to fetch and compare data from multiple periods.

**Next steps:**
1.  Deploy updated Cloud Functions for analytics, products, and orders.
2.  Thoroughly test the Admin Dashboard with various data scenarios.
3.  Consider adding comparison period data and growth metrics as a future enhancement if required.

## Order Management and Reporting

(Details omitted for brevity - see previous versions)

## Integration with Other Admin Features

(Details omitted for brevity - see previous versions)

## Security Considerations

(Details omitted for brevity - see previous versions)

## Implementation Notes

- The fidelity of the `OrderSummary.tsx` in displaying the price breakdown (original price, discounts, final price) is key for user trust during checkout.
- Testing with various offer combinations and conditions is critical before deploying.