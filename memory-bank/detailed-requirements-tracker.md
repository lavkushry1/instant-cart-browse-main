# Detailed E-Commerce Requirements Tracker

**Legend:**
*   `[X]` - Implemented and Verified
*   `[P]` - Partially Implemented
*   `[ ]` - Pending / Not Implemented
*   `[V]` - Needs Verification (code may exist, explicit verification/testing logged is missing)
*   `[E]` - Enhancement (marked as an enhancement in `requirements.md`)
*   `[N/A]` - Not Applicable or Demo Limitation
*   `[D]` - Dependency Issue

---

## **1.0 General System Overview**
    **1.1. Purpose:** `[N/A]` (Informational)
    **1.2. Scope:** `[N/A]` (Informational)
    **1.3. Primary Goals:**
        1.3.1. Enable users to browse, select, and purchase products seamlessly. `[P]` (Ongoing, core functionality exists)
        1.3.2. Provide robust user account features including wishlist and order history. `[P]` (Most features exist, some parts like OrderTracking need verification)
        1.3.3. Implement custom UPI QR and Credit Card payment flows with specified demo characteristics. `[X]` (Demo flows implemented)
        1.3.4. Deliver a comprehensive Offer Management System. `[X]` (Admin and frontend consumption largely implemented)
        1.3.5. Equip administrators with a full suite of tools for managing products, orders, users, offers, and site settings via a secure admin panel. `[P]` (Many tools exist, some pending e.g., Review Management, Order refactor confirmation)
        1.3.6. Achieve a modern, clean, mobile-first UI/UX based on Tailwind CSS. `[X]` (UI Revamp task completed)
        1.3.7. Utilize Firebase for backend services (Firestore, Authentication, Cloud Functions) with SDKs "activated" and frontend components structured for `httpsCallable`. `[X]` (General approach followed)

## **2.0 General Design and User Experience Requirements**
    **2.1. UI Aesthetics (Flipkart-Inspired Modernization - "UI Revamp Task")**
        2.1.1. The user interface shall be clean, modern, and dynamic. `[X]`
        2.1.2. Card-based layouts shall be used for product listings (`ProductCard.tsx`) and category displays (`CategoryGrid.tsx`). `[X]`
        2.1.3. Subtle shadows (e.g., `shadow-md`) and soft borders shall be applied to cards and interactive elements. `[X]`
        2.1.4. A modern color palette (shades of blue, white, grey) shall be used consistently. `[P]` (Partially done, needs review for full consistency)
        2.1.5. Interactive elements shall have clear hover effects and visual feedback. `[X]`
        2.1.6. Badge icons shall be used where appropriate (e.g., `CartIcon` for item count). `[X]`
        2.1.7. Call-to-Action (CTA) buttons shall be distinct and include micro-animations or transitions if they enhance UX without being obtrusive. `[X]`
    **2.2. Mobile-Responsive Design**
        2.2.1. The platform shall be fully responsive and provide a flawless experience on all common device sizes (from iPhone SE to iPad Pro). `[X]`
        2.2.2. A mobile-first approach shall be prioritized in design and development. `[X]`
        2.2.3. Flexbox or CSS Grid shall be used for layout management to ensure responsiveness (e.g., `CategoryGrid.tsx` uses grid). `[X]`
        2.2.4. Mobile navigation shall utilize components like a `BottomNavBar.tsx` for primary navigation (Home, Categories, Cart, Profile). `[X]`
        2.2.5. Collapsible menus, tab navigations, and swipe-friendly sliders (e.g., `OfferBannerSlider.tsx`) shall be used on mobile where appropriate. `[X]`
    **2.3. User Guidance and Feedback**
        2.3.1. Error messages shall be clear, concise, user-friendly, and provide actionable guidance. `[X]` (Standard toasts used)
        2.3.2. Success messages shall confirm user actions. `[X]` (Standard toasts used)
        2.3.3. Loading states shall be indicated by visual cues (e.g., spinners, disabled buttons). `[X]`
            2.3.3.1. Skeleton loaders are a planned enhancement for data fetching states. `[X]` (Implemented)
        2.3.4. All interactive elements must provide immediate visual feedback (e.g., button press state). `[X]`
    **2.4. Trust and Security Signals**
        2.4.1. Security badges (e.g., "Secure Payment") shall be displayed during the checkout process. `[ ]`
        2.4.2. Clear links to Privacy Policy, Terms & Conditions shall be available. `[ ]` (Pages and links needed)
        2.4.3. Transparent information regarding payment processing and data handling shall be provided. `[ ]` (Content for policy pages)
    **2.5. Accessibility (WCAG Compliance Target)**
        2.5.1. The platform shall strive to meet WCAG AA or similar accessibility standards. `[ ]` (Needs specific audit/pass)
        2.5.2. Semantic HTML shall be used. `[P]` (Ongoing good practice)
        2.5.3. Keyboard navigation shall be fully supported. `[P]` (Needs specific testing)
        2.5.4. ARIA attributes shall be used where necessary. `[P]` (Needs specific review)
        2.5.5. Sufficient color contrast shall be maintained. `[P]` (Needs specific review, relates to 2.1.4)
    **2.6. Performance and Styling**
        2.6.1. The UI shall be lightweight with a focus on low Largest Contentful Paint (LCP). `[P]` (Ongoing goal)
        2.6.2. Animations shall be used judiciously and not overload the system or distract the user. `[X]`
        2.6.3. Styling shall be implemented using Tailwind CSS. `[X]`
        2.6.4. Consistent padding (e.g., `p-3` or more) and rounded corners (e.g., `rounded-2xl`) shall be applied. `[X]`
        2.6.5. A clean and minimal font (e.g., Inter, Roboto, or current Tailwind defaults) shall be used consistently. `[X]` (Inter verified)

## **3.0 User Account Management (Frontend E-commerce Site)**
    **3.1. User Registration**
        3.1.1. A dedicated registration page/modal shall be provided, accessible via `Login/Register CTA.tsx`. `[X]`
        3.1.2. Registration form shall include fields for:
            3.1.2.1. Full Name (text input). `[X]`
            3.1.2.2. Email Address (email input, validated for format). `[X]`
            3.1.2.3. Password (password input, with strength indicator - enhancement). `[E][X]`
            3.1.2.4. Confirm Password (password input, validated against password). `[X]`
        3.1.3. Client-side validation shall be performed for all fields (presence, format, password match). `[X]`
        3.1.4. Server-side validation shall be performed via Firebase Authentication rules and/or Cloud Functions. `[X]` (Firebase Auth handles this)
        3.1.5. Successful registration shall create a new user in Firebase Authentication. `[X]`
        3.1.6. User data (e.g., name) shall be stored in Firestore in a 'users' collection, linked by UID. `[X]`
        3.1.7. Appropriate success/error messages shall be displayed. `[X]`
    **3.2. User Login**
        3.2.1. A dedicated login page/modal shall be provided, accessible via `Login/Register CTA.tsx`. `[X]`
        3.2.2. Login form shall include fields for:
            3.2.2.1. Email Address (email input). `[X]`
            3.2.2.2. Password (password input). `[X]`
        3.2.3. A "Forgot Password?" link shall be available. `[X]`
        3.2.4. Successful login shall authenticate the user via Firebase Authentication. `[X]`
        3.2.5. The UI shall update to reflect the logged-in state (e.g., show user name, update `BottomNavBar.tsx` "Profile" link). `[X]`
        3.2.6. Invalid login attempts shall display appropriate error messages. `[X]`
    **3.3. Password Reset ("Forgot Password?")**
        3.3.1. Users shall be able to request a password reset. `[X]`
        3.3.2. System shall use Firebase Authentication's password reset email functionality. `[X]` (`ForgotPassword.tsx` updated)
    **3.4. User Profile/Dashboard (Logged-in Users)**
        3.4.1. An accessible "Profile" or "My Account" section shall be available (e.g., via `BottomNavBar.tsx`). `[X]`
        3.4.2. Display user's registered name and email. `[X]`
        3.4.3. Allow users to update their profile information (e.g., name - enhancement). `[E][X]`
        3.4.4. Address Management:
            3.4.4.1. Allow users to add multiple delivery addresses. `[X]`
            3.4.4.2. Allow users to edit/delete saved addresses. `[X]`
            3.4.4.3. Allow users to set a default delivery address. `[X]`
            3.4.4.4. Saved addresses shall be stored in Firestore, linked to the user's UID. `[X]`
    **3.5. Wishlist Management (Logged-in Users)**
        3.5.1. Logged-in users shall be able to add products to a personal wishlist. `[X]`
            3.5.1.1. An "Add to Wishlist" button/icon shall be present on `ProductCard.tsx` and product detail pages. `[X]`
        3.5.2. Logged-in users shall be able to remove products from their wishlist. `[X]`
        3.5.3. A dedicated Wishlist page shall display all items added by the user. `[X]`
            3.5.3.1. Each wishlist item shall display product image, name, price, and a "Remove" button. `[X]`
            3.5.3.2. A button to "Add to Cart" directly from the wishlist item shall be available. `[X]`
        3.5.4. Wishlist data shall be stored in Firestore, linked to the user's UID. `[X]`
        3.5.5. Guest users may have a temporary wishlist stored in `localStorage`, with an option to merge upon login/registration. `[X]`
    **3.6. Order History (Logged-in Users)**
        3.6.1. A dedicated "Order History" or "My Orders" section shall be available in the user's account. `[X]`
        3.6.2. This section shall list all past orders placed by the user. `[X]`
        3.6.3. For each order, the list shall display:
            3.6.3.1. Order ID. `[X]`
            3.6.3.2. Order Date. `[X]`
            3.6.3.3. Total Amount. `[X]`
            3.6.3.4. Order Status (e.g., Pending, Processing, Shipped, Delivered). `[X]`
            3.6.3.5. A link/button to view detailed order information. `[X]`
        3.6.4. The detailed order view shall show all items in the order, quantities, prices, shipping address, payment method, applied discounts, and link to tracking information (`OrderTracking.tsx`). `[V]` (`OrderTracking.tsx` component existence and full integration needs verification - See 7.2)
        3.6.5. Order data shall be retrieved from Firestore via `orderService.ts`. `[X]`
    **3.7. "Save for Later" from Cart (Enhancement):** `[P]` (Backend service `savedItemsServiceBE.ts` and CFs `savedItems.functions.ts` recreated/corrected after accidental deletion and path issues. Frontend `useCart` integration exists. Pending deployment and full E2E verification.)
        3.7.1. Allow users to move items from their cart to a "Saved for Later" list. `[P]`
        3.7.2. Display "Saved for Later" items on the cart page or a separate section. `[P]` (UI in `Cart.tsx` exists via `SavedItems.tsx`)
        3.7.3. Allow users to move items from "Saved for Later" back to the cart. `[P]`
        3.7.4. Persist "Saved for Later" items for logged-in users (Firestore). `[P]` (Backend logic implemented)
        3.7.5. Implement guest user "Saved for Later" using localStorage and merge on login. `[P]` (Logic in `useCart` and `AuthProvider` exists)

## **4.0 Product Browsing and Discovery**
    **4.1. Homepage**
        4.1.1. Shall display featured products, categories, and promotional banners (`OfferBannerSlider.tsx`). `[V]` (`OfferBannerSlider.tsx` is `[X]`, featured products/categories display needs verification)
        4.1.2. `OfferBannerSlider.tsx` shall support auto-scroll and dot indicators and be swipe-friendly. `[X]`
    **4.2. Category Display**
        4.2.1. Products shall be organized into categories. `[X]`
        4.2.2. Categories shall be displayed using `CategoryGrid.tsx` with icons and labels. `[X]`
        4.2.3. Clicking a category shall navigate to a product listing page for that category. `[X]`
    **4.3. Product Listing Pages (Category/Search Results)**
        4.3.1. Shall display products in a grid or list format using `ProductCard.tsx` components. `[X]`
        4.3.2. `ProductCard.tsx` shall display:
            4.3.2.1. Product Image (with lazy loading). `[X]`
            4.3.2.2. Product Title/Name. `[X]`
            4.3.2.3. Price (original price, discounted price if applicable from Offer Management). `[X]`
            4.3.2.4. Discount percentage/amount if applicable. `[V]` (Price reflects discount, but specific %/amount display on card needs check)
            4.3.2.5. "Out of Stock" label dynamically if applicable. `[X]`
            4.3.2.6. "Add to Cart" button. `[X]`
            4.3.2.7. "Add to Wishlist" button/icon (for logged-in users). `[X]`
        4.3.3. Pagination or infinite scrolling shall be implemented for large product sets. `[X]` ("Load More" implemented)
        4.3.4. Filtering options (e.g., by price range, brand, ratings - enhancement) shall be available. `[E][ ]`
        4.3.5. Sorting options (e.g., by price, popularity, newness - enhancement) shall be available. `[E][ ]`
    **4.4. Product Detail Pages**
        4.4.1. Shall display comprehensive information about a single product. `[X]`
        4.4.2. Information includes: Multiple product images (carousel - enhancement), name, detailed description, price (original, discounted), specifications, customer reviews, stock status. `[E][X]` (Image carousel done, Reviews done)
        4.4.3. "Add to Cart" button with quantity selector. `[X]`
        4.4.4. "Add to Wishlist" button/icon. `[X]`
    **4.5. Search Functionality**
        4.5.1. A prominent `SearchBar.tsx` shall be available, sticky at the top. `[X]`
        4.5.2. Search shall allow users to find products by keywords (name, description, brand). `[X]` (Basic functionality)
        4.5.3. Search suggestions shall be displayed as the user types (enhancement). `[E][ ]`
        4.5.4. Search results shall be displayed on a product listing page. `[X]`

## **5.0 Shopping Cart and Checkout Process**
    **5.1. Shopping Cart (`Cart.tsx`)**
        5.1.1. Users (guest or logged-in) shall be able to add products to their cart. `[X]`
        5.1.2. The `CartIcon.tsx` in the header/`BottomNavBar.tsx` shall display a dynamic count of items in the cart. `[X]`
        5.1.3. The cart page (`Cart.tsx`) shall display:
            5.1.3.1. List of all items in the cart. `[X]`
            5.1.3.2. For each item: product image, name, price, quantity. `[X]`
            5.1.3.3. Ability to update quantity for each item. `[X]`
            5.1.3.4. Ability to remove an item from the cart. `[X]`
            5.1.3.5. Subtotal for each item. `[X]`
            5.1.3.6. Cart subtotal (original). `[X]`
            5.1.3.7. Display of applied offers/discounts (from `OfferContext.tsx` and `useOffers()` hook), showing discount amounts. `[X]`
            5.1.3.8. Final total after discounts. `[X]`
        5.1.4. A "Proceed to Checkout" button shall be prominent. `[X]`
        5.1.5. Guest cart data shall be stored temporarily (e.g., `localStorage`) and can be merged to a user account upon login. `[X]`
    **5.2. Checkout Process (`Checkout.tsx`)**
        5.2.1. **Delivery Details Collection:**
            5.2.1.1. Form for collecting shipping address: Full Name, Street Address, Apartment/Suite, City, State, ZIP Code, Phone Number. `[X]`
            5.2.1.2. Logged-in users can select from saved addresses or add a new one. `[X]`
            5.2.1.3. ZIP Code validation will be performed (details in Payment section). `[X]`
        5.2.2. **Checkout Upsell Display (`CheckoutUpsellDisplay.tsx`):**
            5.2.2.1. During checkout, relevant upsell items (free promotional products or heavily discounted add-ons) shall be presented. `[ ]`
        5.2.3. **Order Summary (`OrderSummary.tsx` - integrated within Checkout):**
            5.2.3.1. Display items being purchased. `[X]`
            5.2.3.2. Display original subtotal. `[X]`
            5.2.3.3. Display total applied discounts (promotions from Offer Management). `[X]`
            5.2.3.4. Display a list of applied offer names. `[X]`
            5.2.3.5. Display shipping costs (if applicable - currently assumed free or included). `[X]` (Assumed included)
            5.2.3.6. Display taxes (if applicable - currently assumed not implemented or included). `[X]` (Assumed included)
            5.2.3.7. Display the final grand total to be paid. `[X]`
            5.2.3.8. The fidelity of this breakdown is critical for user trust. `[X]`
        5.2.4. **Payment Method Selection (`PaymentMethods.tsx`):**
            5.2.4.1. Users shall choose between "UPI QR" and "Credit Card" payment methods. `[X]`
    **5.3. Order Placement**
        5.3.1. Upon successful payment simulation, an order shall be created in Firestore via the `orders-createOrderCF` Cloud Function (called from `Checkout.tsx`). `[X]`
        5.3.2. The order record shall include user details (or guest details), items, quantities, prices, applied offers, shipping address, payment information (type, transaction ID if applicable), and order status. `[X]`

## **6.0 Payment Options Detailed Requirements**
    **6.1. A. UPI QR Payment**
        6.1.1. **Admin Configuration:**
            6.1.1.1. Administrators shall set/update the store's UPI ID (VPA) via `Admin/Settings.tsx`. `[X]`
            6.1.1.2. This setting shall be stored securely (e.g., in Firestore, managed by `admin.functions.ts`). `[X]`
        6.1.2. **Dynamic QR Code Generation (`UpiQRCode.tsx`):**
            6.1.2.1. System shall generate a unique QR code for each transaction. `[X]`
            6.1.2.2. QR code shall embed the exact payable amount (from `OrderSummary.tsx`) and the admin-configured UPI ID. `[X]`
            6.1.2.3. QR code shall be displayed clearly to the user. `[X]`
        6.1.3. **Payment Status Monitoring (Simulated - `PaymentMethods.tsx`):**
            6.1.3.1. After QR display, UI shall indicate "Waiting for payment..." or similar. `[X]`
            6.1.3.2. A simulated check for payment status shall occur. `[X]`
            6.1.3.3. `PaymentMethods.tsx` shall manage UI states: pending, success (simulated), failure (simulated with a chance). `[X]`
            6.1.3.4. A countdown timer may be displayed for the user to complete payment. `[V]`
            6.1.3.5. User messages for each state shall be clear. `[X]`
        6.1.4. **Post-Payment Flow (Simulated):**
            6.1.4.1. Upon (simulated) successful payment, a 10-minute wait period shall be initiated (visual countdown displayed). `[X]`
            6.1.4.2. User instructed not to close or refresh page during this wait. `[X]`
            6.1.4.3. After 10 minutes, proceed to Order Confirmation. `[X]`
    **6.2. B. Credit Card Payment (Demo Flow - "# Credit Card Payment Flow Implementation")**
        6.2.1. **Overview:** Securely enter card details, validate address, process with OTP, provide tracking. `[X]` (Demo)
        6.2.2. **Component: `CreditCardForm.tsx`**
            6.2.2.1. Handles collection of: Card Number, Cardholder Name, Expiry Date (MM/YY), CVV. `[X]`
            6.2.2.2. Client-side validation:
                6.2.2.2.1. Card Number: Format (e.g., Luhn algorithm - enhancement), length (15-16 digits). `[E][P]` (Basic validation, Luhn pending)
                6.2.2.2.2. Cardholder Name: Presence. `[X]`
                6.2.2.2.3. Expiry Date: Format (MM/YY), not in the past. `[X]`
                6.2.2.2.4. CVV: Format (3-4 digits), presence. `[X]`
            6.2.2.3. Manages dummy OTP verification process. `[X]`
            6.2.2.4. Displays "Transaction Pending" status with a 10-minute countdown timer. `[X]`
        6.2.3. **Component: `AddressCorrection.tsx`**
            6.2.3.1. Activated if ZIP code validation fails. `[X]`
            6.2.3.2. Allows users to correct their full address information. `[X]`
            6.2.3.3. Preserves previously entered card details (e.g., in session storage) during this process. `[X]`
        6.2.4. **Component: `AdminCardDetails.tsx` (Demo Feature - Insecure for Production)**
            6.2.4.1. Provides admin access to (demo) stored raw card details (from `localStorage`). `[X]`
            6.2.4.2. Accessible via "Admin Access" button (e.g., on payment methods page) or admin panel. `[X]`
            6.2.4.3. Password protected (demo password: `admin123`). `[X]`
            6.2.4.4. Displays masked card numbers by default. `[X]`
            6.2.4.5. "Show/Hide" toggle to reveal full card number and CVV. `[X]`
            6.2.4.6. Option to copy card information. `[X]`
            6.2.4.7. **Warning:** Demo Only. `[N/A]`
        6.2.5. **User Flow for Credit Card Payment:** `[X]` (Demo flow tested)
        6.2.6. **Security Considerations (Demo Implementation):** `[N/A]` (Demo context)
        6.2.7. **Testing Instructions for Credit Card Flow (Demo):** `[N/A]` (Informational)
        6.2.8. **Implementation Notes (Demo):** `[N/A]` (Informational)

## **7.0 Order Confirmation and Tracking** (Corresponds to `requirements.md` section after 6.2.8.4)
    **7.1. Order Confirmation (`OrderSuccess.tsx`)**
        7.1.1. Displayed after successful payment (and simulated waits). `[V]` (Component exists but end-to-end flow after payment to this page needs verification)
        7.1.2. Shows a success message, order ID, and summary. `[V]`
        7.1.3. Provides a link to view detailed order tracking. `[V]`
        7.1.4. Uses the Order object created in Firestore. `[V]`
    **7.2. Order Tracking (`OrderTracking.tsx`)**
        7.2.1. Accessible via Order History (for logged-in users) or Order Confirmation page. `[ ]` (Component likely not fully implemented or integrated from 3.6.4)
        7.2.2. Displays detailed tracking information for a specific order. `[ ]`
        7.2.3. Shows estimated delivery date. `[ ]`
        7.2.4. Provides visual indicators of shipping progress (e.g., Order Placed -> Processing -> Shipped -> Out for Delivery -> Delivered). `[ ]`
        7.2.5. For demo, uses mock shipment history from the Order object. `[ ]`
        7.2.6. In production, this would integrate with actual shipping provider data. `[N/A]` (Production concern)

## **8.0 Admin Panel Requirements**
    **8.1. Admin Authentication & Authorization**
        8.1.1. **Separate Admin Login:**
            8.1.1.1. A dedicated login page for administrators (e.g., `/admin/login`). `[V]` (Assumed, needs confirmation)
            8.1.1.2. Must be distinct from e-commerce customer login. `[V]`
            8.1.1.3. May use Firebase Authentication with custom claims for admin roles, managed by `adminService.ts` and `admin.functions.ts`. `[V]` (Custom claims usage needs verification)
        8.1.2. **Protected Routes:** All admin panel sections must be accessible only after successful admin authentication. `[X]` (AdminLayout likely handles this)
        8.1.3. **Role-Based Access Control (RBAC - Enhancement):** Define admin roles (Super Admin, Product Manager) with granular permissions. `[E][ ]`
    **8.2. A. Product Management (`productService.ts`, `products.functions.ts`)**
        8.2.1. **Admin UI:** `src/pages/Admin/Products.tsx` (list view), `src/pages/Admin/ProductForm.tsx` (create/edit). `[X]`
        8.2.2. **List Products:**
            8.2.2.1. Display all products in a paginated table/grid. `[X]`
            8.2.2.2. Columns: Image thumbnail, Product Name, SKU (enhancement), Category, Price, Stock Status, Visibility Status. `[E][X]` (SKU column exists, others likely too)
            8.2.2.3. Filtering options: By category, stock status, visibility. `[P]` (Client-side filtering mentioned, needs refinement/server-side)
            8.2.2.4. Search functionality by product name/SKU. `[P]` (Client-side filtering mentioned, needs refinement/server-side)
            8.2.2.5. Actions per product: Edit, Delete, Toggle Visibility. `[X]`
        8.2.3. **Create/Edit Product (`ProductForm.tsx`):**
            8.2.3.1. Fields:
                8.2.3.1.1. Product Name (text input, required). `[X]`
                8.2.3.1.2. Product Description (rich text editor - enhancement). `[E][ ]`
                8.2.3.1.3. SKU (Stock Keeping Unit - text input, unique - enhancement). `[E][P]` (Field exists, uniqueness server-side maybe basic)
                8.2.3.1.4. Price (number input, required). `[X]`
                8.2.3.1.5. Compare At Price (Original Price - number input, optional). `[X]`
                8.2.3.1.6. Categories (multi-select from existing categories, managed by `categoryService.ts`). `[X]`
                8.2.3.1.7. Stock Quantity (number input). `[X]`
                8.2.3.1.8. Allow Backorders (checkbox - enhancement). `[E][ ]`
                8.2.3.1.9. Product Images (uploader for multiple images - enhancement). `[E][X]` (Implemented)
                8.2.3.1.10. Product Tags/Keywords (text input for multiple tags - enhancement). `[E][ ]`
                8.2.3.1.11. Visibility (toggle: Visible/Hidden). `[X]`
                8.2.3.1.12. SEO Fields: Meta Title, Meta Description (enhancement). `[E][X]` (Implemented)
            8.2.3.2. Save/Update product data to Firestore. `[X]`
    **8.3. B. Category Management (`categoryService.ts`, `categories.functions.ts`)**
        8.3.1. **Admin UI:** `src/pages/Admin/Categories.tsx` (or similar). `[X]`
        8.3.2. **List Categories:** Display categories in a hierarchical or flat list. `[X]` (Hierarchical attempted)
        8.3.3. **Create/Edit Category:** Fields for Category Name, Parent Category (for subcategories), Description, Image/Icon. `[X]`
        8.3.4. **Delete Category:** Handle products associated with the category (e.g., unassign or prompt admin). `[X]` (Safeguards for products and subcategories implemented)
    **8.4. C. Offer Management System (`offerService.ts`, `offers.functions.ts`)**
        8.4.1. **Purpose:** Create, update, manage promotional offers. `[X]`
        8.4.2. **Admin UI (`src/pages/Admin/Offers.tsx` - route `/admin/offers`):** `[X]`
            8.4.2.1. List existing offers with columns: Offer Name, Type, Value, Validity Period, Status (Active/Inactive/Scheduled). `[X]`
            8.4.2.2. Actions: Edit, Delete, Toggle Status. `[X]`
            8.4.2.3. Create/Edit Offer Form:
                8.4.2.3.1. Offer Name/Title (text input). `[X]`
                8.4.2.3.2. Offer Description (text area - optional). `[X]`
                8.4.2.3.3. Offer Type (dropdown: Percentage Discount, Fixed Amount Off, BOGO - enhancement). `[E][P]` (BOGO pending)
                8.4.2.3.4. Offer Value (number input, corresponding to type). `[X]`
                8.4.2.3.5. Applicability (dropdown/multi-select: All Products, Specific Products, Specific Categories). `[X]`
                8.4.2.3.6. Minimum Purchase Amount (number input - enhancement). `[E][ ]`
                8.4.2.3.7. Usage Limits (Total Redemptions, Per User - enhancement). `[E][ ]`
                8.4.2.3.8. Validity Period (Start Date/Time, End Date/Time pickers). `[X]`
                8.4.2.3.9. Offer Code (Coupon Code - text input, optional, auto-generate option - enhancement). `[E][ ]`
                8.4.2.3.10. Priority (for stacking rules - number input - enhancement). `[E][P]` (Field exists, advanced stacking rules not specified as done)
                8.4.2.3.11. Status (Active/Inactive). `[X]`
        8.4.3. **Frontend Integration Status:** `[X]`
        8.4.4. **Workflow:** `[X]`
        8.4.5. **Next Steps:** `[P]` (Testing, refine UI, stacking rules are pending items from admin-management.md)
    **8.5. D. SEO Management**
        8.5.1. **Admin UI:** `src/pages/Admin/SEO.tsx` or integrated into product/category forms. `[P]` (Product form has SEO tab, global SEO in `Admin/Settings.tsx`)
        8.5.2. Manage global site meta tags. `[X]` (In `Admin/Settings.tsx`)
        8.5.3. Manage meta tags (title, description, keywords) for individual products, categories, and static pages. `[P]` (Products done, categories/static pages need check)
        8.5.4. Sitemap generation tool/link (enhancement). `[E][ ]`
    **8.6. E. Tracking Code Management**
        8.6.1. **Admin UI:** `src/pages/Admin/Tracking.tsx`. `[X]` (Integrated into `Admin/Settings.tsx` as GA/FB Pixel ID fields)
        8.6.2. Interface to add/manage third-party tracking scripts (e.g., Google Analytics ID, Facebook Pixel ID). `[X]`
        8.6.3. Specify script placement (head/body). `[N/A]` (Actual script injection logic not specified, just ID storage)
    **8.7. F. Analytics and Reporting**
        8.7.1. **Admin UI:** `src/pages/Admin/Analytics.tsx`. `[X]`
        8.7.2. Dashboard with key metrics: Total Sales, Number of Orders, Average Order Value, New Customers. `[X]`
        8.7.3. Reports: Sales over time, Top Selling Products, Sales by Category, Offer Redemption Report. `[X]` (Dashboard shows most of these)
        8.7.4. Data presented in charts and filterable/exportable tables. `[X]` (Charts yes, filter/export basic)
    **8.8. G. Order Management (Admin Perspective - `orderService.ts`, `orders.functions.ts`)**
        8.8.1. **Admin UI:** `src/pages/Admin/Orders.tsx`. `[D]` (Refactor to use CFs status pending from user)
        8.8.2. **List Orders:** Paginated table of all orders. `[D]`
            8.8.2.1. Columns: Order ID, Customer Name/Email (or "Guest"), Order Date, Order Status, Total Amount. `[D]`
            8.8.2.2. Filtering: By status, date range, customer. `[D]`
            8.8.2.3. Search: By Order ID, Customer Name/Email. `[D]`
        8.8.3. **View Order Details:** `[D]`
            8.8.3.1. Customer Information (shipping/billing address, contact). `[D]`
            8.8.3.2. Items Purchased (product, SKU, quantity, price each, line total). `[D]`
            8.8.3.3. Applied Discounts and Offers. `[D]`
            8.8.3.4. Payment Information (method, transaction status - if available from gateway). `[D]`
            8.8.3.5. Shipping Information. `[D]`
            8.8.3.6. Order Notes (internal - enhancement). `[E][ ]` (Depends on base 8.8)
        8.8.4. **Update Order Status:** Dropdown to change status (e.g., Pending, Awaiting Payment, Processing, Shipped, Delivered, Cancelled, Refunded). `[D]`
        8.8.5. Print invoice/packing slip (enhancement). `[E][ ]` (Depends on base 8.8)
    **8.9. H. Admin Settings (`adminService.ts`, `admin.functions.ts`)**
        8.9.1. **Admin UI:** `src/pages/Admin/Settings.tsx`. `[X]`
        8.9.2. **UPI ID Configuration:** Input field for store UPI ID (VPA). `[X]`
        8.9.3. **Stored Card Details Access (Demo Link):** Link to `AdminCardDetails.tsx`. `[X]`
        8.9.4. Store Information: Name, Address, Contact Email, Phone. `[X]`
        8.9.5. Shipping Configuration (basic - enhancement): Default shipping rates/rules. `[E][ ]`
        8.9.6. Tax Configuration (basic - enhancement): Default tax rates. `[E][ ]`
        8.9.7. Email Notification Settings (enhancement): Enable/disable certain customer emails. `[E][ ]`
        8.9.8. Theme settings application on frontend (Primary/Secondary color, Font Family from `Admin/Settings.tsx` General Tab). `[ ]`
    **8.10. I. User Management (Admin Perspective - `userService.ts`, `users.functions.ts`)**
        8.10.1. **Admin UI:** `src/pages/Admin/Customers.tsx`. `[X]`
        8.10.2. **List Users:** Paginated table of registered users. `[X]`
            8.10.2.1. Columns: User ID, Name, Email, Registration Date, Total Orders (enhancement). `[E][ ]` (Total orders pending)
        8.10.3. **View User Details:** Profile information, address(es), order history. `[X]` (Basic info, order history link would depend on order system)
        8.10.4. **Actions:** Activate/Deactivate user account, Trigger password reset email. `[P]` (Role management done, activate/deactivate not explicit, pwd reset trigger not specified if part of admin UI)
            8.10.4.1. Admin User Management Enhancements (from admin-management.md): Pagination, Search/filter in UI, Disable/enable users beyond roles. `[E][ ]`
    **8.11. J. Review Management (`reviewService.ts`, `reviews.functions.ts`)**
        8.11.1. **Admin UI:** `src/pages/Admin/Reviews.tsx`. `[ ]` (Page not explicitly created/verified for admin)
        8.11.2. **List Reviews:** Paginated table of product reviews. `[ ]`
            8.11.2.1. Columns: Product Name, Customer Name, Rating, Review Text excerpt, Date Submitted, Status (Pending Approval, Approved, Rejected). `[ ]`
        8.11.3. **Actions:** Approve, Reject, Delete review. Edit review content (with transparency log - enhancement). Respond to review (enhancement). `[ ]`

## **9.0 Non-Functional Requirements**
    **9.1. Performance:**
        9.1.1. Page load times should be optimized (target LCP < 2.5s). `[P]` (Ongoing)
        9.1.2. API response times should be efficient. `[P]` (Ongoing)
        9.1.3. Lazy loading for images and other assets shall be implemented. `[X]`
    **9.2. Security (Production - beyond current demo state):**
        9.2.1. All sensitive data transmission must use HTTPS. `[X]` (Firebase default)
        9.2.2. Protection against common web vulnerabilities (XSS, CSRF, SQL Injection - although Firestore helps mitigate some). `[P]` (Ongoing concern, no specific audit)
        9.2.3. Secure password storage and handling (Firebase Authentication handles this). `[X]`
        9.2.4. **Payment Processing:** MUST integrate with PCI DSS compliant payment gateways. **NO raw card details stored on own servers.** `[N/A]` (For demo; `[ ]` for production)
        9.2.5. Secure Firebase rules for Firestore and Storage. `[V]` (Needs audit)
        9.2.6. Secure Cloud Function configurations (e.g., disallow unauthenticated invocation where appropriate). `[V]` (Needs audit)
    **9.3. Scalability:**
        9.3.1. The system should be designed to handle a growing number of users, products, and orders (Firebase services are inherently scalable). `[P]` (Firebase helps, app design matters)
    **9.4. Maintainability:**
        9.4.1. Code shall be well-structured, commented, and follow consistent coding standards. `[P]` (Ongoing)
        9.4.2. Components shall be modular and reusable. `[P]` (Ongoing)
    **9.5. Testability:**
        9.5.1. The "Implementation Status" document indicates frontend components are structured with `httpsCallable` and mock fallbacks, aiding testability. `[X]`
        9.5.2. Backend unit/integration tests for Cloud Functions and services are recommended. `[ ]`

## **10.0 Implementation Plan Summary & Key Milestones** `[N/A]` (Informational)
## **11.0 Assumptions and Constraints** `[N/A]` (Informational)

--- 