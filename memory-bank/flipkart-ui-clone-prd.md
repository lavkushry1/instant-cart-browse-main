# Product Requirements Document: Flipkart UI/UX Pixel-Perfect Clone

## 1. Introduction

This document defines the requirements for transforming the Instant Cart website into an **exact, pixel-perfect clone** of Flipkart (https://www.flipkart.com/). Every visual and interactive element must match Flipkart's production site in layout, color, typography, iconography, spacing, and behavior. The live Flipkart site is the only source of truth for all design and implementation decisions.

## 2. Goals & Requirements

### Primary Goals
- Create a 100% visual and functional match to Flipkart's UI
- Implement precise responsive behavior matching Flipkart at all breakpoints
- Reproduce all micro-interactions, animations, and state transitions
- Ensure all user flows are identical to Flipkart's experience

### Success Criteria
- Visual comparison shows ≥99% similarity with Flipkart in A/B testing
- All components function identically to their Flipkart counterparts
- Every pixel measurement, color value, font style, and spacing must match Flipkart exactly
- User testing confirms identical interaction patterns and expectations

## 3. Component-by-Component Specification

### 3.1. Color Palette (Exact Match Required)
- **Primary Blue**: #2874F0 (Flipkart Blue)
- **Secondary Orange**: #FB641B (Buy Now buttons, key CTAs)
- **Accent Yellow**: #FFE500 (Highlights, notifications)
- **Success Green**: #388E3C (Discounts, availability)
- **Error Red**: #ff6161 (Error messages, validation)
- **Neutral Grays**:
  - Background: #f1f3f6
  - Border: #e0e0e0
  - Secondary text: #878787
  - Primary text: #212121
- **IMPORTANT**: Never use pure black (#000000), follow Flipkart's shade system

### 3.2. Typography System (Exact Match Required)
- **Font Family**: Roboto (primary), fallbacks: Inter, Helvetica Neue, Helvetica, Arial, sans-serif
- **Font Sizes & Weights**:
  - Headers: 16px/500, 18px/500, 20px/500
  - Body text: 14px/400
  - Small text: 12px/400
  - Price (discounted): 16px/700
  - Price (original): 14px/400 with strikethrough
  - Button text: 14px/500
- **Line heights**: Must match Flipkart exactly (typically 1.2-1.5)
- **Character spacing**: Match Flipkart's settings (0px in most cases)

### 3.3. Header Component (Pixel-Perfect Implementation)
- **Dimensions**: 56px height, 100% width, fixed position, z-index: 10
- **Background**: #2874F0 (Flipkart Blue)
- **Layout Elements**:
  - **Logo**: Left-aligned, SVG format, 75px width, 20px left margin, vertically centered
  - **Search Bar**: 
    - Position: centered, 40-45% of header width (min: 304px)
    - Height: 36px, white background, 2px rounded corners
    - Padding: 0px 16px 0px 16px (LR icon spacing)
    - Placeholder: "Search for products, brands and more" (14px/400 #717478)
    - Icon: Magnifying glass SVG (20px square), positioned 10px from left edge
    - Focus state: Light blue outline matching Flipkart's focus state exactly
  - **Login Button/Dropdown**:
    - Text: "Login" (14px/500 white)
    - Position: right of search, 16px right margin
    - Hover: Shows dropdown with auth options
    - After login: Shows username with dropdown arrow
  - **Become a Seller**: 
    - Text link (14px/400 white)
    - Position: right of login, 16px right margin
  - **More Dropdown**:
    - Text: "More" with down arrow icon (14px/400 white)
    - Position: right of "Become a Seller", 16px right margin
    - Dropdown content: exact match to Flipkart's dropdown menu items
  - **Cart Icon**: 
    - SVG icon (20px), white, with "Cart" text below (12px/400)
    - Position: far right, 24px right margin
    - Badge: Red circle with white text for item count (16px diameter)
    
#### 3.3.1. Mobile Header Adaptations
- **Compact Layout**: Full-width blue header with logo, search icon, user icon, cart
- **Search**: Tap on search icon expands to full-width search bar
- **Back Button**: When navigating into categories/detail pages
- **Height**: 56px (same as desktop)

### 3.4. Navigation Bar (Category Navigation)
- **Position**: Directly below header
- **Background**: White (#FFFFFF) with subtle bottom border (#e0e0e0)
- **Height**: 40px (desktop), auto with fixed items (mobile)
- **Items**: 
  - Horizontal list of categories with icons
  - Each item: Icon (24px) above Text (12px/400)
  - Spacing: 16px between items, 12px vertical padding
- **Mobile**: Horizontally scrollable with visible overflow indicator
- **Desktop**: Fixed display of primary categories, overflow in "More" dropdown
- **Mega Menu Dropdown**:
  - Appears on hover (desktop only)
  - Full-width white panel with 4-5 columns
  - Left column: Main subcategories (14px/500)
  - Other columns: Child categories (12px/400)
  - Right area: Featured item or promotion (200-300px width)

### 3.5. Homepage Layout
- **Hero Carousel**:
  - Full width, 300-400px height on desktop, proportionally scaled on mobile
  - Auto-rotation: 5 seconds per slide
  - Navigation: Left/right arrows + bottom dot indicators
  - Animation: Smooth slide transition (300ms ease-in-out)
  - Mobile swipe gesture support

- **Category Icons Grid**:
  - 8-10 category access points arranged in grid (desktop: 5 per row, mobile: 4 per row)
  - Each item: 60px circular icon above category name
  - Text: 12px/400 centered below icon
  - Spacing: 16px between items (vertical and horizontal)
  - Background: White card with 8px padding, 4px rounded corners

- **Deal Sections & Product Carousels**:
  - Section header: 18px/500 text with "VIEW ALL" link (right-aligned)
  - Products: Horizontal scrolling cards
  - Carousel navigation: Arrow buttons at edges
  - Card dimensions: 200px × 300px (desktop), 150px × 250px (mobile)
  - Spacing: 16px between cards
  - Inside each card: Product image (1:1 ratio), name (2 lines max), price, ratings
  - Timer for flash deals: Flipkart's exact hour:min:sec countdown style

- **Banner Grid**:
  - 2×2 or 3×1 layout configurations
  - Desktop: Exact Flipkart banner proportions
  - Mobile: Full-width vertical stacking
  - Image quality: Compressed WebP (quality 85%)

### 3.6. Product Card (Standard Component)
- **Dimensions**: 
  - Desktop: 200-220px width, 300-320px height
  - Mobile: 48% width (of container), proportional height
- **Structure**:
  - Image container: 1:1 ratio, centered product image
  - Padding: 8px around image
  - Product name: 14px/400, max 2 lines, ellipsis overflow
  - Rating: Star icon (Flipkart yellow #ffc200) + number (12px/400) + count in parentheses
  - Price: Current price (16px/700) + original struck price (14px/400 gray) + discount % (12px/500 green)
  - Additional info: 12px/400 gray text (brand, size options, etc.)
- **Interactions**:
  - Hover: Subtle elevation (box-shadow: 0 2px 16px rgba(0,0,0,0.1))
  - Hover actions: "Add to Cart"/"Wishlist" buttons appear (match Flipkart exactly)
  - Click/tap: Navigate to product detail page
- **Badges**:
  - "Flipkart Assured": Blue shield icon with checkmark
  - "Sale": Orange tag with white text
  - Position: Top-left of product image

### 3.7. Product Listing Page (PLP)
- **Layout**: Two-column (filters left, products right)
- **Breadcrumb**: Position above filters, style matching Flipkart
- **Filter Sidebar**:
  - Width: 280px (desktop), full-width drawer (mobile)
  - Section headers: 14px/500 with expand/collapse toggle
  - Filters: Checkboxes with labels (12px/400)
  - Price slider: Match Flipkart's exact slider component
  - "Clear All": Text button (12px/500 blue)
  - Applied filters: Horizontal chips below breadcrumb
- **Product Grid**:
  - 4 columns (desktop), 2 columns (mobile)
  - Gap: 16px between products
  - Load more: Flipkart's pagination or infinite scroll behavior
- **Sort Dropdown**:
  - Position: Above product grid, right-aligned
  - Options: Popularity, Price Low→High, Price High→Low, Newest First, etc.
  - Styling: Dropdown with 14px/400 text, 1px border

### 3.8. Product Detail Page (PDP)
- **Layout**: Two-column desktop (left: images, right: details), stacked on mobile
- **Image Gallery**:
  - Main image: 400×400px (desktop), full-width (mobile)
  - Thumbnails: 60×60px below main image, 5 visible with scroll for more
  - Zoom: On hover shows zoomed portion (desktop), pinch-to-zoom (mobile)
  - Image viewer: Full-screen overlay on click/tap
- **Product Information**:
  - Title: 20px/500, max 3 lines
  - Ratings: Star icon + numeric rating + total reviews count + link to reviews
  - Price section: 
    - Special price: 28px/700
    - Original price: 16px/400 strikethrough
    - Discount: 14px/500 green text
    - Tax info: 12px/400 gray text
  - Availability status: "In Stock" (green text) or inventory count
  - Delivery estimate: PIN code checker with exact Flipkart styling
  - Highlights: Bulleted list of key features (14px/400)
  - Description: Expandable section with product details
  - Specifications: Table format matching Flipkart's layout
- **Action Buttons**:
  - "BUY NOW": Orange button (#fb641b), 18px/500 white text, full width
  - "ADD TO CART": Yellow button (#ff9f00), 18px/500 white text, full width
  - Button height: 48px, rounded corners (4px)
  - Button spacing: 16px between buttons, 24px top/bottom margin
- **Seller Information**:
  - "Sold by" section with seller name and rating
  - Return/warranty policy information
  - Flipkart Assured badge if applicable
- **Similar Products/Recommendations**:
  - Horizontal carousel of related products
  - "You might also like" section at bottom of page

### 3.9. Cart Page
- **Layout**: Two-column (left: items, right: summary)
- **Cart Items Column**:
  - Width: 65-70% of page (desktop), full width (mobile)
  - Each item: Card with 16px padding
  - Item structure: 
    - Left: Product image (80×80px)
    - Middle: Title, seller, delivery estimate
    - Right: Price, quantity selector
  - Quantity selector: "-" button, number input, "+" button
  - Remove/Save for Later: Text links below item
  - Item spacing: 8px gap between items
- **Price Summary Column**:
  - Width: 30-35% of page (desktop), full width fixed bottom (mobile)
  - Background: White card with 16px padding
  - Header: "PRICE DETAILS" (14px/500)
  - Line items: Label and amount on opposite sides
  - Total: 16px/700 text
  - Savings: Green text showing total discount
  - Order button: "PLACE ORDER" orange button (#fb641b), full width, 48px height

### 3.10. Checkout Flow
- **Progressive Steps**:
  - Login → Address → Order Summary → Payment
  - Progress indicator: Numbered steps with connecting lines
  - Current step: Blue circle, completed: Blue circle with checkmark
- **Address Selection/Form**:
  - Saved addresses: Cards with radio selection
  - New address form: Match Flipkart's form fields exactly
  - Validation: Inline messages, red error text
- **Order Summary**:
  - Compact version of cart items
  - Delivery date estimate
  - Price summary (same as cart page)
- **Payment Options**:
  - Tab-based selection (UPI, Cards, NetBanking, Cash)
  - Each payment method: Custom form matching Flipkart exactly
  - Order button: "PAY ₹{AMOUNT}" orange button
- **Confirmation Page**:
  - Success animation matching Flipkart
  - Order ID, summary, tracking information
  - "Continue Shopping" button

### 3.11. Mobile-Specific Components
- **Bottom Navigation Bar**:
  - Height: 56px, fixed position
  - 5 icons: Home, Categories, Notifications, Account, Cart
  - Active state: Blue tint and text
- **Filter/Sort Bottom Sheets**:
  - Full-width overlay sliding from bottom
  - Match Flipkart's exact animation timing/easing
  - Backdrop: Semi-transparent overlay (rgba(0,0,0,0.5))
- **Product Image Viewer**:
  - Fullscreen with swipe navigation
  - Pinch-to-zoom functionality
  - Close button: Top-right X icon
- **Mobile Search Experience**:
  - Tap search → Full screen search interface
  - Recent searches list
  - Voice search option
  - Matching Flipkart's keyboard and autocomplete behavior

### 3.12. Common UI Elements
- **Buttons**:
  - Primary: Blue (#2874f0), white text, 8px padding, 4px rounded corners
  - Secondary: White with blue border, blue text, same padding
  - Disabled state: Grayed out (opacity 0.5)
  - Hover/Active states: Exact opacity/color change as Flipkart
- **Form Controls**:
  - Inputs: 36px height, 1px gray border, 12px padding, 4px rounded corners
  - Checkbox/Radio: Match Flipkart's custom styles
  - Dropdowns: Custom chevron icon, transition animations
  - Focus states: Blue outline/glow matching Flipkart
- **Modals & Dialogs**:
  - Backdrop: Semi-transparent black overlay
  - Animation: Fade + scale (match Flipkart timing exactly)
  - Layout: Header, content area, footer actions
  - Close button: X icon top-right
- **Toast Notifications**:
  - Position: Bottom center on mobile, top-right on desktop
  - Animation: Slide in, automatically dismiss after 3s
  - Success/Error styling: Green/Red with appropriate icons

### 3.13. Loading States & Animations
- **Page Loading**: Flipkart's blue/yellow spinner animation
- **Product Card Loading**: Gray placeholder shimmer effect
- **Button Loading**: Spinner animation within button
- **Transition Effects**: Match all page transitions (300ms ease transitions)
- **Micro-interactions**: Like Button ripples, dropdown animations, hover effects

## 4. Responsive Implementation (Exact Match Required)

### 4.1. Breakpoints
- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px and above
- **All breakpoint behavior must match Flipkart exactly**

### 4.2. Mobile-First Approach
- Base styling for mobile experience
- Progressive enhancement for larger screens
- Touch-friendly targets (minimum 44×44px)

### 4.3. Layout Shifts
- Sidebar filters → Bottom sheets on mobile
- Multi-column → Single column on small screens
- Horizontal menus → Vertical/hamburger on mobile
- All transitions between states must be identical to Flipkart

## 5. Technical Implementation Requirements

### 5.1. Front-End Stack
- **Framework**: React (or your existing framework)
- **Styling**: CSS-in-JS or Tailwind with exact class configuration
- **State Management**: Match Flipkart's behavior for all interactions
- **Rendering**: Ensure SSR/CSR approach matches Flipkart's performance

### 5.2. Performance Targets (Match or Exceed Flipkart)
- First Contentful Paint: < 1.2s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- First Input Delay: < 100ms
- Time to Interactive: < 3.5s

### 5.3. Asset Requirements
- **Images**: WebP format (with fallbacks), matching Flipkart's compression
- **Icons**: SVG format, exact match to Flipkart's icon set
- **Fonts**: Proper font-display strategies matching Flipkart
- **Lazy Loading**: Implement identical approach to Flipkart

## 6. Quality Assurance Requirements

### 6.1. Visual Review Process
- Side-by-side comparison with Flipkart using screenshot overlays
- Pixel measurement verification for all components
- Color sampling to verify exact hex code matches

### 6.2. Functional Testing
- Behavior matching across all user interactions
- Animation timing/easing curve verification
- Flow testing across all main user journeys

### 6.3. Cross-Browser/Device Testing
- Chrome, Firefox, Safari, Edge latest versions
- iOS (Safari) and Android (Chrome) latest 2 versions
- Tablet testing on iPad and Samsung equivalents
- Must match Flipkart's rendering on each platform

## 7. Implementation Process

### 7.1. Component Inventory & Prioritization
1. Core layout & navigation components (header, footer, navigation)
2. Product discovery components (cards, carousels, filters)
3. Critical flow components (checkout, cart, authentication)
4. Enhancement components (reviews, recommendations, etc.)
5. Edge cases and error states

### 7.2. Review Milestones
1. Design system components approval
2. Key page layouts approval
3. User flow testing approval
4. Performance optimization approval
5. Final 1:1 comparison with Flipkart

## 8. Reference Material

- The live Flipkart.com website is the ONLY source of truth
- Browser dev tools for inspecting exact styles, dimensions, and behavior
- Manual measurement and recording of all animations/timing
- Component-by-component screenshot library for comparison

---

**IMPORTANT NOTE**: Any deviation from Flipkart's exact design or behavior must be explicitly documented and approved. The objective is a pixel-perfect, behavior-perfect clone with no distinguishable differences from the original Flipkart experience. 