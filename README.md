# POS System - Point of Sale Application

A modern, full-featured Point of Sale (POS) system built with Next.js, TypeScript, and Neon Database. Designed for retail businesses in Laos with LAK currency support.

## 🚀 Features

### 📊 Dashboard & Analytics
- Real-time sales statistics and charts
- Revenue tracking and profit analysis
- Top-selling products insights
- Payment method analytics
- Date range filtering for reports

### 🛍️ Product Management
- Complete product catalog with categories
- Image upload and management
- Stock tracking and low stock alerts
- Barcode support for quick scanning
- Bulk product operations

### 💰 Point of Sale
- Intuitive touch-friendly interface
- Quick product search and selection
- Shopping cart with quantity adjustments
- Multiple payment methods (Cash, Card, Bank Transfer)
- Receipt generation and printing
- Tax calculation support

### 👥 User Management
- Role-based access control (Admin, Cashier)
- User profile management
- Secure authentication with JWT
- Password reset functionality
- Activity logging

### 🏪 Store Settings
- Customizable store branding
- Logo upload and management
- Tax rate configuration
- Receipt customization
- System preferences

### 📱 Mobile Responsive
- Optimized for tablets and mobile devices
- Touch-friendly interface
- Responsive design for all screen sizes
- Mobile navigation

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **Database**: Neon PostgreSQL
- **Authentication**: JWT with bcrypt
- **Charts**: Recharts
- **Icons**: Lucide React
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Neon Database account
- Git

## 🚀 Installation

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/ypadmin/Ecommerce-.git
   cd Ecommerce-
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   pnpm install
   \`\`\`

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   \`\`\`env
   DATABASE_URL=your_neon_database_url
   JWT_SECRET=your_jwt_secret_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   \`\`\`

4. **Set up the database**
   Run the SQL scripts in order:
   \`\`\`bash
   # Execute scripts/001-create-tables.sql in your Neon database
   # This creates all necessary tables and indexes
   \`\`\`

5. **Start the development server**
   \`\`\`bash
   pnpm dev
   \`\`\`

6. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser

## 📊 Database Schema

### Core Tables
- **users** - User accounts and authentication
- **categories** - Product categories
- **products** - Product catalog with stock tracking
- **sales** - Sales transactions
- **sale_items** - Individual items in each sale
- **settings** - Store configuration and preferences

### Key Features
- Foreign key relationships for data integrity
- Indexes for optimal query performance
- Automatic timestamps for audit trails
- Stock tracking with quantity management
- Multi-currency support (LAK primary)

## 🔐 Authentication & Security

- **JWT-based authentication** with secure token management
- **Password hashing** using bcrypt
- **Role-based access control** (Admin, Cashier)
- **SQL injection prevention** with parameterized queries
- **XSS protection** with input sanitization
- **CSRF protection** built into Next.js

## 📱 Usage Guide

### Getting Started
1. **Register an admin account** at `/register`
2. **Login** at `/login`
3. **Set up your store** in Settings
4. **Add product categories** in Categories
5. **Add products** in Products
6. **Start selling** in POS

### Daily Operations
1. **Morning Setup**: Check stock levels and low stock alerts
2. **Sales Processing**: Use POS interface for customer transactions
3. **Inventory Management**: Update stock levels as needed
4. **End of Day**: Review sales reports and analytics

### Admin Tasks
- **User Management**: Add/remove cashiers and manage permissions
- **Store Settings**: Update branding, tax rates, and preferences
- **Reports**: Generate sales reports and analyze performance
- **Backup**: Regular database backups (recommended)

## 🎨 Customization

### Branding
- Upload your store logo in Settings
- Customize store name and information
- Modify receipt templates
- Adjust color themes (via CSS variables)

### Features
- Add new product fields in the database schema
- Customize receipt layouts in `components/ui/receipt.tsx`
- Modify dashboard charts in `components/ui/charts.tsx`
- Add new user roles in the authentication system

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create new product
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

### Sales
- `GET /api/sales` - List sales transactions
- `POST /api/sales` - Create new sale
- `GET /api/sales/analytics` - Sales analytics data

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/analytics` - Analytics data

## 🚀 Deployment

### Vercel (Recommended)
1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

### Manual Deployment
1. **Build the application**
   \`\`\`bash
   pnpm build
   \`\`\`

2. **Start production server**
   \`\`\`bash
   pnpm start
   \`\`\`

### Environment Variables for Production
\`\`\`env
DATABASE_URL=your_production_neon_database_url
JWT_SECRET=your_secure_jwt_secret
NEXT_PUBLIC_APP_URL=https://your-domain.com
\`\`\`

## 🔧 Troubleshooting

### Common Issues

**Database Connection Issues**
- Verify DATABASE_URL is correct
- Check Neon database status
- Ensure IP whitelist includes your deployment platform

**Authentication Problems**
- Verify JWT_SECRET is set
- Check token expiration settings
- Clear browser cookies and try again

**Build Errors**
- Run `pnpm install` to ensure all dependencies are installed
- Check for TypeScript errors with `pnpm lint`
- Verify all environment variables are set

**Performance Issues**
- Check database query performance
- Monitor Neon database metrics
- Optimize images and assets

### Getting Help
- Check the [Issues](https://github.com/ypadmin/Ecommerce-/issues) page
- Review the documentation
- Contact support for enterprise features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Radix UI](https://www.radix-ui.com/) - UI components
- [Neon](https://neon.tech/) - PostgreSQL database
- [Vercel](https://vercel.com/) - Deployment platform
- [Lucide](https://lucide.dev/) - Icon library

## 📞 Support

For support and questions:
- 📧 Email: support@yourstore.com
- 💬 Discord: [Join our community](https://discord.gg/yourserver)
- 📖 Documentation: [docs.yourstore.com](https://docs.yourstore.com)

---

**Built with ❤️ for retail businesses in Laos**

*Supporting local businesses with modern technology*
