# VibeShopping 🛍️

### A Modern E-Commerce Experience

VibeShopping is a responsive e-commerce website built with **HTML, CSS, and Vanilla JavaScript**. It provides a complete front-end shopping experience, allowing users to explore products, manage their shopping cart, save favorites, and complete simulated purchases.

The project focuses on practical JavaScript development, API integration, browser storage, and creating an interactive user experience.

---

## ✨ Features

### 🏠 Home Page

* Featured products and new arrivals.
* Product categories.
* Responsive navigation and footer.
* Dynamic product content loaded from an external API.

### 🛒 Product Discovery

* Browse the complete product catalog.
* Search products by name.
* Filter by category and price.
* Sort products using different criteria.
* Pagination with 8 products per page.

### 📦 Product Details

* Detailed product information.
* Product image gallery.
* Quantity selection.
* Related products.
* Add to cart functionality.

### ❤️ Favorites

* Save and remove favorite products.
* Persistent favorites using LocalStorage.
* Dedicated favorites page.

### 🛍️ Shopping Cart

* Add and remove products.
* Increase or decrease quantities.
* Automatic subtotal calculation.
* Shipping cost calculation.
* Discount code support.

### 💳 Simulated Checkout

* Customer information form.
* Payment method selection.
* Form validation.
* Automatic order creation.
* Unique simulated Order IDs.
* Order storage using LocalStorage.

### 🎨 User Experience

* Light and Dark Mode.
* Persistent theme preferences.
* Toast notifications.
* Fly-to-Cart animation.
* Responsive design.
* Loading states and product image fallbacks.

---

## 🛠️ Tech Stack

| Technology        | Purpose                             |
| ----------------- | ----------------------------------- |
| HTML5             | Website structure                   |
| CSS3              | Styling and responsive layouts      |
| JavaScript (ES6+) | Application logic and interactivity |
| External REST API | Product and category data           |
| LocalStorage      | Persistent browser data             |
| SessionStorage    | Temporary session data              |

---

## 🌐 API Integration

The project uses the Platzi Fake Store API to retrieve product and category information.

**API Base URL:**

https://api.escuelajs.co/api/v1

The API integration includes:

* Fetching products and categories.
* Retrieving individual product details.
* Cleaning and normalizing product data.
* Filtering unsuitable test products.
* Handling invalid or unavailable product images.
* Providing fallback images when necessary.

---

## 💾 Data Persistence

LocalStorage is used to preserve important information between page reloads.

Stored data includes:

* Shopping cart.
* Favorite products.
* Customer information.
* Orders.
* Selected theme.

This allows the shopping experience to remain consistent while navigating between different pages.

---

## 🎟️ Test Discount Codes

The project includes discount codes for testing the checkout process.

| Code      | Discount |
| --------- | -------: |
| `OAK10`   |      10% |
| `ZAKARIA` |     100% |

**Note:** These codes are implemented for demonstration purposes only.

---

## 📁 Project Structure

The project follows a modular file organization:

```text
VibeShopping/
│
├── index.html
├── products.html
├── product-details.html
├── favorites.html
├── cart.html
├── checkout.html
│
├── css/
│   ├── main.css
│   ├── components.css
│   └── responsive.css
│
├── js/
│   ├── api.js
│   ├── main.js
│   ├── products.js
│   ├── storage.js
│   └── theme.js
│
└── README.md
```

*The structure above represents the main project organization.*

---

## 🚀 Getting Started

Since this project uses HTML, CSS, and JavaScript without a complex build system, running it is straightforward.

1. Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/vibeshopping-ecommerce.git
```

2. Navigate to the project directory:

```bash
cd vibeshopping-ecommerce
```

3. Open the project using a local development server.

**Recommended:** Use the Live Server extension in Visual Studio Code.

4. Open `index.html` through the local server.

---

## ⚠️ Important Notes

* This is a front-end demonstration project.
* No real backend or database is connected.
* Checkout and payment operations are simulated.
* Orders and shopping data are stored locally in the browser.
* The project does not process real payments.
* Product availability depends on the external API.

---

## 🎯 Project Objectives

VibeShopping was developed to demonstrate practical front-end development skills, including:

* Working with external REST APIs.
* Manipulating and rendering dynamic data.
* Managing browser storage.
* Implementing shopping cart logic.
* Building reusable JavaScript functionality.
* Creating responsive user interfaces.
* Handling asynchronous operations and errors.

---

## 👨‍💻 Author

**Hasan Dweidri**

Computer Engineering / Information Technology Student

---

*VibeShopping — Discover. Explore. Shop.*
