## **Comprehensive E-Commerce Requirements Document: Instant Cart**

**Version:** 1.0
**Date:** May 17, 2025
**Project:** Instant Cart E-Commerce Platform

**1.0 General System Overview**
    1.1. **Purpose:** This document outlines the detailed functional and non-functional requirements for the Instant Cart e-commerce platform, inspired by Nykaa and Flipkart.
    1.2. **Scope:** The system includes a customer-facing e-commerce website with guest checkout and user account management, custom payment integrations (UPI QR and Credit Card with demo flows), an offer management system, and a comprehensive, separately authenticated admin panel for site management.
    1.3. **Primary Goals:**
        1.3.1. Enable users to browse, select, and purchase products seamlessly.
        1.3.2. Provide robust user account features including wishlist and order history.
        1.3.3. Implement custom UPI QR and Credit Card payment flows with specified demo characteristics.
        1.3.4. Deliver a comprehensive Offer Management System.
        1.3.5. Equip administrators with a full suite of tools for managing products, orders, users, offers, and site settings via a secure admin panel.
        1.3.6. Achieve a modern, clean, mobile-first UI/UX based on Tailwind CSS.
        1.3.7. Utilize Firebase for backend services (Firestore, Authentication, Cloud Functions) with SDKs "activated" and frontend components structured for `httpsCallable`.

**2.0 General Design and User Experience Requirements**
    2.1. **UI Aesthetics (Flipkart-Inspired Modernization - "UI Revamp Task")**
        2.1.1. The user interface shall be clean, modern, and dynamic.
        2.1.2. Card-based layouts shall be used for product listings (`ProductCard.tsx`) and category displays (`CategoryGrid.tsx`).
        2.1.3. Subtle shadows (e.g., `shadow-md`) and soft borders shall be applied to cards and interactive elements.
        2.1.4. A modern color palette (shades of blue, white, grey) shall be used consistently. (Partially done in created components).
        2.1.5. Interactive elements shall have clear hover effects and visual feedback.
        2.1.6. Badge icons shall be used where appropriate (e.g., `CartIcon` for item count).
        2.1.7. Call-to-Action (CTA) buttons shall be distinct and include micro-animations or transitions if they enhance UX without being obtrusive.
    2.2. **Mobile-Responsive Design**
        2.2.1. The platform shall be fully responsive and provide a flawless experience on all common device sizes (from iPhone SE to iPad Pro).
        2.2.2. A mobile-first approach shall be prioritized in design and development.
        2.2.3. Flexbox or CSS Grid shall be used for layout management to ensure responsiveness (e.g., `CategoryGrid.tsx` uses grid).
        2.2.4. Mobile navigation shall utilize components like a `BottomNavBar.tsx` for primary navigation (Home, Categories, Cart, Profile).
        2.2.5. Collapsible menus, tab navigations, and swipe-friendly sliders (e.g., `OfferBannerSlider.tsx`) shall be used on mobile where appropriate.
    2.3. **User Guidance and Feedback**
        2.3.1. Error messages shall be clear, concise, user-friendly, and provide actionable guidance.
        2.3.2. Success messages shall confirm user actions.
        2.3.3. Loading states shall be indicated by visual cues (e.g., spinners, disabled buttons).
            2.3.3.1. Skeleton loaders are a planned enhancement for data fetching states.
        2.3.4. All interactive elements must provide immediate visual feedback (e.g., button press state).
    2.4. **Trust and Security Signals**
        2.4.1. Security badges (e.g., "Secure Payment") shall be displayed during the checkout process.
        2.4.2. Clear links to Privacy Policy, Terms & Conditions shall be available.
        2.4.3. Transparent information regarding payment processing and data handling shall be provided.
    2.5. **Accessibility (WCAG Compliance Target)**
        2.5.1. The platform shall strive to meet WCAG AA or similar accessibility standards.
        2.5.2. Semantic HTML shall be used.
        2.5.3. Keyboard navigation shall be fully supported.
        2.5.4. ARIA attributes shall be used where necessary.
        2.5.5. Sufficient color contrast shall be maintained.
    2.6. **Performance and Styling**
        2.6.1. The UI shall be lightweight with a focus on low Largest Contentful Paint (LCP).
        2.6.2. Animations shall be used judiciously and not overload the system or distract the user.
        2.6.3. Styling shall be implemented using Tailwind CSS.
        2.6.4. Consistent padding (e.g., `p-3` or more) and rounded corners (e.g., `rounded-2xl`) shall be applied.
        2.6.5. A clean and minimal font (e.g., Inter, Roboto, or current Tailwind defaults) shall be used consistently.

**3.0 User Account Management (Frontend E-commerce Site)**
    (Leverages Firebase Authentication, `userService.ts`, `users.functions.ts`)
    3.1. **User Registration**
        3.1.1. A dedicated registration page/modal shall be provided, accessible via `Login/Register CTA.tsx`.
        3.1.2. Registration form shall include fields for:
            3.1.2.1. Full Name (text input).
            3.1.2.2. Email Address (email input, validated for format).
            3.1.2.3. Password (password input, with strength indicator - enhancement).
            3.1.2.4. Confirm Password (password input, validated against password).
        3.1.3. Client-side validation shall be performed for all fields (presence, format, password match).
        3.1.4. Server-side validation shall be performed via Firebase Authentication rules and/or Cloud Functions.
        3.1.5. Successful registration shall create a new user in Firebase Authentication.
        3.1.6. User data (e.g., name) shall be stored in Firestore in a 'users' collection, linked by UID.
        3.1.7. Appropriate success/error messages shall be displayed.
    3.2. **User Login**
        3.2.1. A dedicated login page/modal shall be provided, accessible via `Login/Register CTA.tsx`.
        3.2.2. Login form shall include fields for:
            3.2.2.1. Email Address (email input).
            3.2.2.2. Password (password input).
        3.2.3. A "Forgot Password?" link shall be available.
        3.2.4. Successful login shall authenticate the user via Firebase Authentication.
        3.2.5. The UI shall update to reflect the logged-in state (e.g., show user name, update `BottomNavBar.tsx` "Profile" link).
        3.2.6. Invalid login attempts shall display appropriate error messages.
    3.3. **Password Reset ("Forgot Password?")**
        3.3.1. Users shall be able to request a password reset.
        3.3.2. System shall use Firebase Authentication's password reset email functionality.
    3.4. **User Profile/Dashboard (Logged-in Users)**
        3.4.1. An accessible "Profile" or "My Account" section shall be available (e.g., via `BottomNavBar.tsx`).
        3.4.2. Display user's registered name and email.
        3.4.3. Allow users to update their profile information (e.g., name - enhancement).
        3.4.4. Address Management:
            3.4.4.1. Allow users to add multiple delivery addresses.
            3.4.4.2. Allow users to edit/delete saved addresses.
            3.4.4.3. Allow users to set a default delivery address.
            3.4.4.4. Saved addresses shall be stored in Firestore, linked to the user's UID.
    3.5. **Wishlist Management (Logged-in Users)**
        3.5.1. Logged-in users shall be able to add products to a personal wishlist.
            3.5.1.1. An "Add to Wishlist" button/icon shall be present on `ProductCard.tsx` and product detail pages.
        3.5.2. Logged-in users shall be able to remove products from their wishlist.
        3.5.3. A dedicated Wishlist page shall display all items added by the user.
            3.5.3.1. Each wishlist item shall display product image, name, price, and a "Remove" button.
            3.5.3.2. A button to "Add to Cart" directly from the wishlist item shall be available.
        3.5.4. Wishlist data shall be stored in Firestore, linked to the user's UID.
        3.5.5. Guest users may have a temporary wishlist stored in `localStorage`, with an option to merge upon login/registration.
    3.6. **Order History (Logged-in Users)**
        3.6.1. A dedicated "Order History" or "My Orders" section shall be available in the user's account.
        3.6.2. This section shall list all past orders placed by the user.
        3.6.3. For each order, the list shall display:
            3.6.3.1. Order ID.
            3.6.3.2. Order Date.
            3.6.3.3. Total Amount.
            3.6.3.4. Order Status (e.g., Pending, Processing, Shipped, Delivered).
            3.6.3.5. A link/button to view detailed order information.
        3.6.4. The detailed order view shall show all items in the order, quantities, prices, shipping address, payment method, applied discounts, and link to tracking information (`OrderTracking.tsx`).
        3.6.5. Order data shall be retrieved from Firestore via `orderService.ts`.

**4.0 Product Browsing and Discovery**
    4.1. **Homepage**
        4.1.1. Shall display featured products, categories, and promotional banners (`OfferBannerSlider.tsx`).
        4.1.2. `OfferBannerSlider.tsx` shall support auto-scroll and dot indicators and be swipe-friendly.
    4.2. **Category Display**
        4.2.1. Products shall be organized into categories.
        4.2.2. Categories shall be displayed using `CategoryGrid.tsx` with icons and labels.
        4.2.3. Clicking a category shall navigate to a product listing page for that category.
    4.3. **Product Listing Pages (Category/Search Results)**
        4.3.1. Shall display products in a grid or list format using `ProductCard.tsx` components.
        4.3.2. `ProductCard.tsx` shall display:
            4.3.2.1. Product Image (with lazy loading).
            4.3.2.2. Product Title/Name.
            4.3.2.3. Price (original price, discounted price if applicable from Offer Management).
            4.3.2.4. Discount percentage/amount if applicable.
            4.3.2.5. "Out of Stock" label dynamically if applicable.
            4.3.2.6. "Add to Cart" button.
            4.3.2.7. "Add to Wishlist" button/icon (for logged-in users).
        4.3.3. Pagination or infinite scrolling shall be implemented for large product sets.
        4.3.4. Filtering options (e.g., by price range, brand, ratings - enhancement) shall be available.
        4.3.5. Sorting options (e.g., by price, popularity, newness - enhancement) shall be available.
    4.4. **Product Detail Pages**
        4.4.1. Shall display comprehensive information about a single product.
        4.4.2. Information includes: Multiple product images (carousel - enhancement), name, detailed description, price (original, discounted), specifications, customer reviews, stock status.
        4.4.3. "Add to Cart" button with quantity selector.
        4.4.4. "Add to Wishlist" button/icon.
    4.5. **Search Functionality**
        4.5.1. A prominent `SearchBar.tsx` shall be available, sticky at the top.
        4.5.2. Search shall allow users to find products by keywords (name, description, brand).
        4.5.3. Search suggestions shall be displayed as the user types (enhancement).
        4.5.4. Search results shall be displayed on a product listing page.

**5.0 Shopping Cart and Checkout Process**
    5.1. **Shopping Cart (`Cart.tsx`)**
        5.1.1. Users (guest or logged-in) shall be able to add products to their cart.
        5.1.2. The `CartIcon.tsx` in the header/`BottomNavBar.tsx` shall display a dynamic count of items in the cart.
        5.1.3. The cart page (`Cart.tsx`) shall display:
            5.1.3.1. List of all items in the cart.
            5.1.3.2. For each item: product image, name, price, quantity.
            5.1.3.3. Ability to update quantity for each item.
            5.1.3.4. Ability to remove an item from the cart.
            5.1.3.5. Subtotal for each item.
            5.1.3.6. Cart subtotal (original).
            5.1.3.7. Display of applied offers/discounts (from `OfferContext.tsx` and `useOffers()` hook), showing discount amounts.
            5.1.3.8. Final total after discounts.
        5.1.4. A "Proceed to Checkout" button shall be prominent.
        5.1.5. Guest cart data shall be stored temporarily (e.g., `localStorage`) and can be merged to a user account upon login.
    5.2. **Checkout Process (`Checkout.tsx`)**
        5.2.1. **Delivery Details Collection:**
            5.2.1.1. Form for collecting shipping address: Full Name, Street Address, Apartment/Suite, City, State, ZIP Code, Phone Number.
            5.2.1.2. Logged-in users can select from saved addresses or add a new one.
            5.2.1.3. ZIP Code validation will be performed (details in Payment section).
        5.2.2. **Checkout Upsell Display (`CheckoutUpsellDisplay.tsx`):**
            5.2.2.1. During checkout, relevant upsell items (free promotional products or heavily discounted add-ons) shall be presented.
        5.2.3. **Order Summary (`OrderSummary.tsx` - integrated within Checkout):**
            5.2.3.1. Display items being purchased.
            5.2.3.2. Display original subtotal.
            5.2.3.3. Display total applied discounts (promotions from Offer Management).
            5.2.3.4. Display a list of applied offer names.
            5.2.3.5. Display shipping costs (if applicable - currently assumed free or included).
            5.2.3.6. Display taxes (if applicable - currently assumed not implemented or included).
            5.2.3.7. Display the final grand total to be paid.
            5.2.3.8. The fidelity of this breakdown is critical for user trust.
        5.2.4. **Payment Method Selection (`PaymentMethods.tsx`):**
            5.2.4.1. Users shall choose between "UPI QR" and "Credit Card" payment methods.
    5.3. **Order Placement**
        5.3.1. Upon successful payment simulation, an order shall be created in Firestore via the `orders-createOrderCF` Cloud Function (called from `Checkout.tsx`).
        5.3.2. The order record shall include user details (or guest details), items, quantities, prices, applied offers, shipping address, payment information (type, transaction ID if applicable), and order status.

**6.0 Payment Options Detailed Requirements**
    6.1. **A. UPI QR Payment**
        6.1.1. **Admin Configuration:**
            6.1.1.1. Administrators shall set/update the store's UPI ID (VPA) via `Admin/Settings.tsx`.
            6.1.1.2. This setting shall be stored securely (e.g., in Firestore, managed by `admin.functions.ts`).
        6.1.2. **Dynamic QR Code Generation (`UpiQRCode.tsx`):**
            6.1.2.1. System shall generate a unique QR code for each transaction.
            6.1.2.2. QR code shall embed the exact payable amount (from `OrderSummary.tsx`) and the admin-configured UPI ID.
            6.1.2.3. QR code shall be displayed clearly to the user.
        6.1.3. **Payment Status Monitoring (Simulated - `PaymentMethods.tsx`):**
            6.1.3.1. After QR display, UI shall indicate "Waiting for payment..." or similar.
            6.1.3.2. A simulated check for payment status shall occur.
            6.1.3.3. `PaymentMethods.tsx` shall manage UI states: pending, success (simulated), failure (simulated with a chance).
            6.1.3.4. A countdown timer may be displayed for the user to complete payment.
            6.1.3.5. User messages for each state shall be clear.
        6.1.4. **Post-Payment Flow (Simulated):**
            6.1.4.1. Upon (simulated) successful payment, a 10-minute wait period shall be initiated (visual countdown displayed).
            6.1.4.2. User instructed not to close or refresh page during this wait.
            6.1.4.3. After 10 minutes, proceed to Order Confirmation.
    6.2. **B. Credit Card Payment (Demo Flow - "# Credit Card Payment Flow Implementation")**
        6.2.1. **Overview:** Securely enter card details, validate address, process with OTP, provide tracking.
        6.2.2. **Component: `CreditCardForm.tsx`**
            6.2.2.1. Handles collection of: Card Number, Cardholder Name, Expiry Date (MM/YY), CVV.
            6.2.2.2. Client-side validation:
                6.2.2.2.1. Card Number: Format (e.g., Luhn algorithm - enhancement), length (15-16 digits).
                6.2.2.2.2. Cardholder Name: Presence.
                6.2.2.2.3. Expiry Date: Format (MM/YY), not in the past.
                6.2.2.2.4. CVV: Format (3-4 digits), presence.
            6.2.2.3. Manages dummy OTP verification process.
            6.2.2.4. Displays "Transaction Pending" status with a 10-minute countdown timer.
        6.2.3. **Component: `AddressCorrection.tsx`**
            6.2.3.1. Activated if ZIP code validation fails.
            6.2.3.2. Allows users to correct their full address information.
            6.2.3.3. Preserves previously entered card details (e.g., in session storage) during this process.
        6.2.4. **Component: `AdminCardDetails.tsx` (Demo Feature - Insecure for Production)**
            6.2.4.1. Provides admin access to (demo) stored raw card details (from `localStorage`).
            6.2.4.2. Accessible via "Admin Access" button (e.g., on payment methods page) or admin panel.
            6.2.4.3. Password protected (demo password: `admin123`).
            6.2.4.4. Displays masked card numbers by default.
            6.2.4.5. "Show/Hide" toggle to reveal full card number and CVV.
            6.2.4.6. Option to copy card information.
            6.2.4.7. **Warning:** This component and `localStorage` for card details are for **DEMO ONLY** due to extreme security risks and non-compliance with PCI DSS. Production systems MUST use a payment gateway.
        6.2.5. **User Flow for Credit Card Payment:**
            6.2.5.1. **Card Details Entry:** User selects "Credit Card" and fills `CreditCardForm.tsx`.
            6.2.5.2. **Address Validation (ZIP Code):**
                6.2.5.2.1. `CreditCardForm.tsx` calls `validation-validateZipCodeCF` Cloud Function.
                6.2.5.2.2. Demo logic in `validationService.ts` and `validation.functions.ts` flags ZIP codes starting with '9' as invalid.
                6.2.5.2.3. If invalid: Card details stored temporarily, redirect to `AddressCorrection.tsx`, error message shown.
                6.2.5.2.4. After correction: User returns to `CreditCardForm.tsx` with card details pre-filled.
            6.2.5.3. **OTP Verification (Dummy):**
                6.2.5.3.1. After address validation, a dummy OTP is displayed on screen (in `CreditCardForm.tsx`).
                6.2.5.3.2. User enters the OTP. System verifies it matches the displayed one.
            6.2.5.4. **Transaction Processing (Simulated):**
                6.2.5.4.1. Post-OTP, "Transaction Processing" screen appears with a 10-minute countdown.
                6.2.5.4.2. User advised not to close/refresh.
            6.2.5.5. **Order Confirmation and Tracking:** Post-countdown, transition to `OrderSuccess.tsx` and then `OrderTracking.tsx`.
        6.2.6. **Security Considerations (Demo Implementation):**
            6.2.6.1. Card Data Storage (Demo): In `localStorage` for `AdminCardDetails.tsx`.
            6.2.6.2. Input Validation: Client-side in `CreditCardForm.tsx`.
            6.2.6.3. OTP Verification (Dummy): Simulates an extra security layer.
            6.2.6.4. Secure Admin Access (Demo): Password for `AdminCardDetails.tsx`.
        6.2.7. **Testing Instructions for Credit Card Flow (Demo):**
            6.2.7.1. Fill delivery info, select Credit Card.
            6.2.7.2. Enter card details. To test address validation, use ZIP starting with '9'.
            6.2.7.3. Correct address in `AddressCorrection.tsx`.
            6.2.7.4. Re-submit card details.
            6.2.7.5. Enter displayed OTP.
            6.2.7.6. Observe countdown. View tracking.
        6.2.8. **Implementation Notes (Demo):**
            6.2.8.1. 10-minute wait is a UI countdown.
            6.2.8.2. Invalid ZIPs (demo): Start with '9'.
            6.2.8.3. OTP (demo): Displayed on screen.
            6.2.8.4. Stored Card Data (demo): `localStorage`.

**7.0 Order Confirmation and Tracking**
    7.1. **Order Confirmation (`OrderSuccess.tsx`)**
        7.1.1. Displayed after successful payment (and simulated waits).
        7.1.2. Shows a success message, order ID, and summary.
        7.1.3. Provides a link to view detailed order tracking.
        7.1.4. Uses the Order object created in Firestore.
    7.2. **Order Tracking (`OrderTracking.tsx`)**
        7.2.1. Accessible via Order History (for logged-in users) or Order Confirmation page.
        7.2.2. Displays detailed tracking information for a specific order.
        7.2.3. Shows estimated delivery date.
        7.2.4. Provides visual indicators of shipping progress (e.g., Order Placed -> Processing -> Shipped -> Out for Delivery -> Delivered).
        7.2.5. For demo, uses mock shipment history from the Order object.
        7.2.6. In production, this would integrate with actual shipping provider data.

**8.0 Admin Panel Requirements**
    (Admin panel at `/admin`. Leverages Firebase backend services and Cloud Functions with SDKs "activated." Admin UIs like `src/pages/Admin/Products.tsx` use `httpsCallable` structure.)
    8.1. **Admin Authentication & Authorization**
        8.1.1. **Separate Admin Login:**
            8.1.1.1. A dedicated login page for administrators (e.g., `/admin/login`).
            8.1.1.2. Must be distinct from e-commerce customer login.
            8.1.1.3. May use Firebase Authentication with custom claims for admin roles, managed by `adminService.ts` and `admin.functions.ts`.
        8.1.2. **Protected Routes:** All admin panel sections must be accessible only after successful admin authentication.
        8.1.3. **Role-Based Access Control (RBAC - Enhancement):** Define admin roles (Super Admin, Product Manager) with granular permissions.
    8.2. **A. Product Management (`productService.ts`, `products.functions.ts`)**
        8.2.1. **Admin UI:** `src/pages/Admin/Products.tsx` (list view), `src/pages/Admin/ProductForm.tsx` (create/edit).
        8.2.2. **List Products:**
            8.2.2.1. Display all products in a paginated table/grid.
            8.2.2.2. Columns: Image thumbnail, Product Name, SKU (enhancement), Category, Price, Stock Status, Visibility Status.
            8.2.2.3. Filtering options: By category, stock status, visibility.
            8.2.2.4. Search functionality by product name/SKU.
            8.2.2.5. Actions per product: Edit, Delete, Toggle Visibility.
        8.2.3. **Create/Edit Product (`ProductForm.tsx`):**
            8.2.3.1. Fields:
                8.2.3.1.1. Product Name (text input, required).
                8.2.3.1.2. Product Description (rich text editor - enhancement).
                8.2.3.1.3. SKU (Stock Keeping Unit - text input, unique - enhancement).
                8.2.3.1.4. Price (number input, required).
                8.2.3.1.5. Compare At Price (Original Price - number input, optional).
                8.2.3.1.6. Categories (multi-select from existing categories, managed by `categoryService.ts`).
                8.2.3.1.7. Stock Quantity (number input).
                8.2.3.1.8. Allow Backorders (checkbox - enhancement).
                8.2.3.1.9. Product Images (uploader for multiple images - enhancement).
                8.2.3.1.10. Product Tags/Keywords (text input for multiple tags - enhancement).
                8.2.3.1.11. Visibility (toggle: Visible/Hidden).
                8.2.3.1.12. SEO Fields: Meta Title, Meta Description (enhancement).
            8.2.3.2. Save/Update product data to Firestore.
    8.3. **B. Category Management (`categoryService.ts`, `categories.functions.ts`)**
        8.3.1. **Admin UI:** `src/pages/Admin/Categories.tsx` (or similar).
        8.3.2. **List Categories:** Display categories in a hierarchical or flat list.
        8.3.3. **Create/Edit Category:** Fields for Category Name, Parent Category (for subcategories), Description, Image/Icon.
        8.3.4. **Delete Category:** Handle products associated with the category (e.g., unassign or prompt admin).
    8.4. **C. Offer Management System (`offerService.ts`, `offers.functions.ts`)**
        8.4.1. **Purpose:** Create, update, manage promotional offers.
        8.4.2. **Admin UI (`src/pages/Admin/Offers.tsx` - route `/admin/offers`):**
            8.4.2.1. List existing offers with columns: Offer Name, Type, Value, Validity Period, Status (Active/Inactive/Scheduled).
            8.4.2.2. Actions: Edit, Delete, Toggle Status.
            8.4.2.3. Create/Edit Offer Form:
                8.4.2.3.1. Offer Name/Title (text input).
                8.4.2.3.2. Offer Description (text area - optional).
                8.4.2.3.3. Offer Type (dropdown: Percentage Discount, Fixed Amount Off, BOGO - enhancement).
                8.4.2.3.4. Offer Value (number input, corresponding to type).
                8.4.2.3.5. Applicability (dropdown/multi-select: All Products, Specific Products, Specific Categories).
                8.4.2.3.6. Minimum Purchase Amount (number input - enhancement).
                8.4.2.3.7. Usage Limits (Total Redemptions, Per User - enhancement).
                8.4.2.3.8. Validity Period (Start Date/Time, End Date/Time pickers).
                8.4.2.3.9. Offer Code (Coupon Code - text input, optional, auto-generate option - enhancement).
                8.4.2.3.10. Priority (for stacking rules - number input - enhancement).
                8.4.2.3.11. Status (Active/Inactive).
        8.4.3. **Frontend Integration Status (Conceptually Complete, Pending Live Data/Testing):**
            8.4.3.1. `OfferContext.tsx` & `OfferProvider` load offers into app.
            8.4.3.2. `ProductCard.tsx` displays offer-adjusted prices.
            8.4.3.3. `Cart.tsx` uses `useOffers()` for dynamic totals & displays applied offer names/discounts.
            8.4.3.4. `Checkout.tsx` recalculates totals.
            8.4.3.5. `OrderSummary.tsx` shows detailed breakdown: original subtotal, promotion discounts, list of applied offer names, final total. This fidelity is key for user trust.
        8.4.4. **Workflow:** Admin creates/edits offer in `Offers.tsx` -> Saved to Firestore -> `OfferProvider` fetches -> `ProductCard` displays -> `Cart.tsx` calculates -> `Checkout.tsx` finalizes with `OrderSummary.tsx`.
        8.4.5. **Next Steps:** Finalize Firebase setup for `offerService.ts`, conduct thorough testing (various offer types, conditions, priorities, validity, stacking rules - if implemented), refine UI for applied offers (e.g., display offer conditions).
    8.5. **D. SEO Management**
        8.5.1. **Admin UI:** `src/pages/Admin/SEO.tsx` or integrated into product/category forms.
        8.5.2. Manage global site meta tags.
        8.5.3. Manage meta tags (title, description, keywords) for individual products, categories, and static pages.
        8.5.4. Sitemap generation tool/link (enhancement).
    8.6. **E. Tracking Code Management**
        8.6.1. **Admin UI:** `src/pages/Admin/Tracking.tsx`.
        8.6.2. Interface to add/manage third-party tracking scripts (e.g., Google Analytics ID, Facebook Pixel ID).
        8.6.3. Specify script placement (head/body).
    8.7. **F. Analytics and Reporting**
        8.7.1. **Admin UI:** `src/pages/Admin/Analytics.tsx`.
        8.7.2. Dashboard with key metrics: Total Sales, Number of Orders, Average Order Value, New Customers.
        8.7.3. Reports: Sales over time, Top Selling Products, Sales by Category, Offer Redemption Report.
        8.7.4. Data presented in charts and filterable/exportable tables.
    8.8. **G. Order Management (Admin Perspective - `orderService.ts`, `orders.functions.ts`)**
        8.8.1. **Admin UI:** `src/pages/Admin/Orders.tsx`.
        8.8.2. **List Orders:** Paginated table of all orders.
            8.8.2.1. Columns: Order ID, Customer Name/Email (or "Guest"), Order Date, Order Status, Total Amount.
            8.8.2.2. Filtering: By status, date range, customer.
            8.8.2.3. Search: By Order ID, Customer Name/Email.
        8.8.3. **View Order Details:**
            8.8.3.1. Customer Information (shipping/billing address, contact).
            8.8.3.2. Items Purchased (product, SKU, quantity, price each, line total).
            8.8.3.3. Applied Discounts and Offers.
            8.8.3.4. Payment Information (method, transaction status - if available from gateway).
            8.8.3.5. Shipping Information.
            8.8.3.6. Order Notes (internal - enhancement).
        8.8.4. **Update Order Status:** Dropdown to change status (e.g., Pending, Awaiting Payment, Processing, Shipped, Delivered, Cancelled, Refunded).
        8.8.5. Print invoice/packing slip (enhancement).
    8.9. **H. Admin Settings (`adminService.ts`, `admin.functions.ts`)**
        8.9.1. **Admin UI:** `src/pages/Admin/Settings.tsx`.
        8.9.2. **UPI ID Configuration:** Input field for store UPI ID (VPA).
        8.9.3. **Stored Card Details Access (Demo Link):** Link to `AdminCardDetails.tsx` if maintained for extended demo, with clear warnings about its non-production nature.
        8.9.4. Store Information: Name, Address, Contact Email, Phone.
        8.9.5. Shipping Configuration (basic - enhancement): Default shipping rates/rules.
        8.9.6. Tax Configuration (basic - enhancement): Default tax rates.
        8.9.7. Email Notification Settings (enhancement): Enable/disable certain customer emails.
    8.10. **I. User Management (Admin Perspective - `userService.ts`, `users.functions.ts`)**
        8.10.1. **Admin UI:** `src/pages/Admin/Customers.tsx`.
        8.10.2. **List Users:** Paginated table of registered users.
            8.10.2.1. Columns: User ID, Name, Email, Registration Date, Total Orders (enhancement).
        8.10.3. **View User Details:** Profile information, address(es), order history.
        8.10.4. **Actions:** Activate/Deactivate user account, Trigger password reset email.
    8.11. **J. Review Management (`reviewService.ts`, `reviews.functions.ts`)**
        8.11.1. **Admin UI:** `src/pages/Admin/Reviews.tsx`.
        8.11.2. **List Reviews:** Paginated table of product reviews.
            8.11.2.1. Columns: Product Name, Customer Name, Rating, Review Text excerpt, Date Submitted, Status (Pending Approval, Approved, Rejected).
        8.11.3. **Actions:** Approve, Reject, Delete review. Edit review content (with transparency log - enhancement). Respond to review (enhancement).

**9.0 Non-Functional Requirements**
    9.1. **Performance:**
        9.1.1. Page load times should be optimized (target LCP < 2.5s).
        9.1.2. API response times should be efficient.
        9.1.3. Lazy loading for images and other assets shall be implemented.
    9.2. **Security (Production - beyond current demo state):**
        9.2.1. All sensitive data transmission must use HTTPS.
        9.2.2. Protection against common web vulnerabilities (XSS, CSRF, SQL Injection - although Firestore helps mitigate some).
        9.2.3. Secure password storage and handling (Firebase Authentication handles this).
        9.2.4. **Payment Processing:** MUST integrate with PCI DSS compliant payment gateways. **NO raw card details stored on own servers.**
        9.2.5. Secure Firebase rules for Firestore and Storage.
        9.2.6. Secure Cloud Function configurations (e.g., disallow unauthenticated invocation where appropriate).
    9.3. **Scalability:**
        9.3.1. The system should be designed to handle a growing number of users, products, and orders (Firebase services are inherently scalable).
    9.4. **Maintainability:**
        9.4.1. Code shall be well-structured, commented, and follow consistent coding standards.
        9.4.2. Components shall be modular and reusable.
    9.5. **Testability:**
        9.5.1. The "Implementation Status" document indicates frontend components are structured with `httpsCallable` and mock fallbacks, aiding testability.
        9.5.2. Backend unit/integration tests for Cloud Functions and services are recommended.

**10.0 Implementation Plan Summary & Key Milestones**
    10.1. **Phase 1: Firebase Setup & Core Configuration (USER ACTION)**
        10.1.1. Set up Firebase Project (Firestore, Authentication, Functions, Storage).
        10.1.2. Update `src/lib/firebaseClient.ts` with Firebase web app config keys.
        10.1.3. Configure `src/lib/firebaseAdmin.ts` (`firebaseAdmin.ts` SDK init is 🟢).
    10.2. **Phase 2: Backend Deployment & Verification (USER ACTION)**
        10.2.1. Deploy all Cloud Functions (services and functions SDKs are 🟢 "activated").
        10.2.2. Verify and update deployed Cloud Function names in frontend `httpsCallable` calls.
    10.3. **Phase 3: Feature Implementation & Live Integration (Developer Task)**
        10.3.1. User Authentication & Account Management.
        10.3.2. Admin Authentication.
        10.3.3. Core E-commerce Flow (Guest & Logged-in) with live calls.
        10.3.4. Payment Flows (UPI QR & Credit Card demo) with live calls to validation functions.
        10.3.5. Offer Management System (Admin UI, frontend context, application logic) with live data.
        10.3.6. Full Admin Panel feature integration (Products, Orders, Users, Settings, etc.).
    10.4. **Phase 4: Transition to Production-Ready Systems (Developer Task)**
        10.4.1. **CRITICAL: Integrate PCI-compliant payment gateways for UPI and Credit Cards.**
        10.4.2. **CRITICAL: REMOVE demo raw card storage (`localStorage`, `AdminCardDetails.tsx` direct access).**
        10.4.3. Implement real OTP/3D Secure for credit cards.
        10.4.4. Implement robust, non-simulated UPI payment status checks.
        10.4.5. Implement production-grade backend ZIP validation if needed.
        10.4.6. Finalize `OrderTracking.tsx` with live order data.
        10.4.7. Implement skeleton loaders.
    10.5. **Phase 5: Testing & Refinement**
        10.5.1. Comprehensive End-to-End testing of all user flows (guest, registered, admin).
        10.5.2. Thorough testing of Offer Management (various conditions, combinations).
        10.5.3. Testing of Credit Card flow detailed steps.
        10.5.4. Device and browser compatibility testing.
        10.5.5. UI/UX refinement based on testing feedback.
    10.6. **Phase 6: Deployment**
        10.6.1. Deploy frontend application to hosting platform.

**11.0 Assumptions and Constraints**
    11.1. Initial development focuses on the demo payment flows; production gateways are a subsequent critical step.
    11.2. Firebase is the chosen BaaS provider.
    11.3. Tailwind CSS is the chosen CSS framework.
    11.4. The "UI Revamp Task" document provides the primary UI/UX direction.
    11.5. All backend services and Cloud Functions listed in "Firebase Backend Task Tracker" have their SDK logic "activated" and are structurally ready for deployment.
    11.6. The "Implementation Status" document accurately reflects current progress with mock fallbacks in the frontend.
    11.7. The "Admin Management Features" and "Credit Card Payment Flow Implementation" documents are key inputs for those specific modules.
