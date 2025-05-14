# 🔥 Firebase Backend Task Tracker

## 0. Firebase Admin Core (`firebaseAdmin.ts`)
- [🟢] Setup Firebase Admin SDK Initialization (Activated)

## 1. offerService.ts (Backend Logic)
- [🟢] Setup Firestore Collection (SDK Activated)
- [🟢] Create Offer (SDK Activated)
- [🟢] Read Offer(s) (SDK Activated)
- [🟢] Update Offer (SDK Activated)
- [🟢] Delete Offer (SDK Activated)

## 2. productService.ts (Backend Logic)
- [🟢] Setup Firestore Collection (SDK Activated)
- [🟢] Create Product (SDK Activated)
- [🟢] Read Product(s) (SDK Activated)
- [🟢] Update Product (SDK Activated)
- [🟢] Delete Product (SDK Activated, incl. stock update fn, image & review subcollection deletion)

## 3. categoryService.ts (Backend Logic)
- [🟢] Setup Firestore Collection (SDK Activated)
- [🟢] Create Category (SDK Activated)
- [🟢] Read Category(s) (SDK Activated)
- [🟢] Update Category (SDK Activated)
- [🟢] Delete Category (SDK Activated)

## 4. orderService.ts (Backend Logic)
- [🟢] Setup Firestore Collection (SDK Activated)
- [🟢] Create Order (SDK Activated, incl. inventory update call)
- [🟢] Read Order(s) (SDK Activated)
- [🟢] Update Order (SDK Activated)
- [🟢] Delete Order (SDK Activated)

## 5. userService.ts (Backend Logic)
- [🟢] Setup Firestore Collection (Users) (SDK Activated)
- [🟢] Create User Profile (Upsert Logic) (SDK Activated)
- [🟢] Get User Profile (SDK Activated)
- [🟢] Update User Profile (SDK Activated)
- [🟢] (Optional) Get User by Email / Manage Roles (Delete User & Update Roles SDK Activated)

## 6. reviewService.ts (Backend Logic)
- [🟢] Setup Firestore Subcollection (under Products) (SDK Activated)
- [🟢] Create Review (SDK Activated, and update product's averageRating)
- [🟢] Read Reviews for a Product (SDK Activated)
- [🟢] Update Review (SDK Activated, and update product's averageRating)
- [🟢] Delete Review (SDK Activated, and update product's averageRating)

## 7. adminService.ts (Backend Logic)
- [🟢] Setup Firestore Collection (e.g., for settings) (SDK Activated)
- [🟢] Get Admin Settings (SDK Activated)
- [🟢] Update Admin Settings (SDK Activated)

## 8. cartService.ts (Backend Logic - Optional for persistent carts)
- [🟢] Setup Firestore Collection (User Carts) (SDK Activated)
- [🟢] Get User Cart (SDK Activated)
- [🟢] Add/Update Item in User Cart (SDK Activated)
- [🟢] Remove Item from User Cart (Handled by setItemInUserCartBE with qty 0) (SDK Activated)
- [🟢] Clear User Cart (SDK Activated)

## 9. Firebase Cloud Functions (`src/functions/...`)
All Cloud Function wrappers (`...CF.ts` files) have their SDK calls activated (uncommented internally).

### 9.1. Offer Functions (`offers.functions.ts`)
- [🟢] All CFs SDK Activated

### 9.2. Product Functions (`products.functions.ts`)
- [🟢] All CFs SDK Activated

### 9.3. Category Functions (`categories.functions.ts`)
- [🟢] All CFs SDK Activated

### 9.4. Order Functions (`orders.functions.ts`)
- [🟢] All CFs SDK Activated

### 9.5. User Functions (`users.functions.ts`)
- [🟢] All CFs SDK Activated (Auth Triggers and Callables)

### 9.6. Review Functions (`reviews.functions.ts`)
- [🟢] All CFs SDK Activated

### 9.7. Admin Settings Functions (`admin.functions.ts`)
- [🟢] All CFs SDK Activated

### 9.8. Cart Functions (`cart.functions.ts`)
- [🟢] All CFs SDK Activated

### 9.9. Main Functions Index (`index.ts`)
- [✅] Export all defined functions

## 10. Frontend Admin UI Cloud Function Integration
- [✅] `Admin/Settings.tsx` (UPI Config & General) - CF calls structured (mock fallback)
- [✅] `Admin/Products.tsx` & `Admin/ProductForm.tsx` - CF calls structured (mock fallback)
- [✅] `Admin/Categories.tsx` - CF calls structured (mock fallback)
- [✅] `Admin/Orders.tsx` - CF calls structured (mock fallback)
- [✅] `Admin/Customers.tsx` - CF calls structured (mock fallback)
- [✅] `Admin/Reviews.tsx` - CF calls structured (mock fallback)

_Status: All specified backend service logic and Cloud Function wrappers have their SDK calls activated. Core Admin UI pages are now structurally prepared to use these Cloud Functions, with mock fallbacks in place. The next major step is full Firebase project setup by the user, deployment, and then replacing mock fallbacks with rigorously tested live calls in the frontend._
