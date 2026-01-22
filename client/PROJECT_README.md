# Sintec  Real Estate - Client Side

A modern real estate website built with React, Vite, and Tailwind CSS for property buying, selling, and management.

## 🏠 Project Overview

Sintec  is a comprehensive real estate platform with two major parts:
- **User Panel**: Browse properties, view details, and contact the company
- **Admin Panel**: Manage property listings and monitor statistics

## ✨ Features

### User Features
- **Home Page**: Hero banner, featured properties, about story, client reviews, and footer
- **Property Page**: Search, filter, and sort through all available properties
- **About Page**: Company story, values, team members, and client testimonials
- **Contact Page**: Contact form, office information, and location map

### Admin Features
- **Dashboard**: Property statistics and analytics
- **Property Management**: View all properties in a comprehensive table
- **Revenue Tracking**: Monitor total portfolio and sales value

## 🗂️ Project Structure

```
Sintec -client-side/
├── src/
│   ├── assets/          # Static assets
│   ├── components/      # Reusable React components
│   │   ├── Navbar.jsx
│   │   ├── HeroBanner.jsx
│   │   ├── PropertyCard.jsx
│   │   ├── AboutStory.jsx
│   │   ├── ReviewClient.jsx
│   │   └── Footer.jsx
│   ├── pages/          # Page components
│   │   ├── Home.jsx
│   │   ├── Property.jsx
│   │   ├── About.jsx
│   │   ├── Contact.jsx
│   │   └── AdminDashboard.jsx
│   ├── data/           # JSON data files
│   │   └── properties.json  # 30 property listings
│   ├── App.jsx         # Main app with routing
│   ├── main.jsx        # Entry point
│   ├── App.css
│   └── index.css
├── public/             # Public assets
├── package.json
├── vite.config.js
└── README.md
```

## 📦 Property Data Structure

Each property in `properties.json` includes:
- **id**: Unique identifier
- **name**: Property name
- **price**: Price in BDT
- **location**: Full address
- **squareFeet**: Property size
- **state**: Status (sell, premium, sold)
- **type**: Property type (house, apartment, land, commercial)
- **bedrooms**: Number of bedrooms
- **bathrooms**: Number of bathrooms
- **description**: Detailed description
- **image**: Property image URL
- **features**: Array of property features

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Sintec -client-side
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and visit:
```
http://localhost:5173
```

## 📱 Routes

- `/` - Home page
- `/property` - Property listings page
- `/about` - About us page
- `/contact` - Contact page
- `/admin` - Admin dashboard

## 🛠️ Built With

- **React 19** - UI framework
- **Vite** - Build tool and development server
- **React Router** - Client-side routing
- **Tailwind CSS 4** - Utility-first CSS framework

## 🎨 Key Components

### Navbar
Responsive navigation bar with links to all pages

### HeroBanner
Eye-catching hero section with call-to-action buttons

### PropertyCard
Reusable card component displaying property information with:
- Property image
- Status badge (premium, sold, for sale)
- Location
- Size, bedrooms, and bathrooms
- Price and view details button

### AboutStory
Company story section with statistics and mission statement

### ReviewClient
Client testimonials with star ratings

### Footer
Comprehensive footer with:
- Company information
- Quick links
- Services
- Contact details
- Social media links
- Copyright information

## 📊 Property Statistics (Sample Data)

- Total Properties: 30
- For Sale: Various
- Premium: Various
- Sold: Various
- Property Types: House, Apartment, Land, Commercial

## 🔍 Property Filters

Users can filter properties by:
- **Search**: Name or location
- **Type**: House, Apartment, Land, Commercial
- **Status**: For Sale, Premium, Sold
- **Sort**: Price (low to high, high to low), Size (small to large, large to small)

## 📝 Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint
npm run lint
```

## 🎯 Future Enhancements

- [ ] Property detail page
- [ ] User authentication
- [ ] Wishlist/favorites feature
- [ ] Property comparison
- [ ] Advanced search filters
- [ ] Map integration
- [ ] Image gallery/carousel
- [ ] Real-time chat support
- [ ] Email notifications
- [ ] Payment gateway integration

## 📄 License

This project is for demonstration purposes.

## 👥 Contact

For any inquiries, please contact:
- Email: info@Sintec .com
- Phone: +880 1234-567890
- Address: 123 Main Street, Gulshan-2, Dhaka 1212, Bangladesh

---

**Built with ❤️ for finding your dream home**
