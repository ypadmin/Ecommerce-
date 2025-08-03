# POS System - Point of Sale Application

A modern, full-featured Point of Sale (POS) system built with Next.js, TypeScript, and Tailwind CSS. This system is designed for retail businesses to manage products, process sales, track inventory, and generate reports.

## 🚀 Features

### Core Functionality
- **Product Management**: Add, edit, delete, and categorize products
- **Inventory Tracking**: Real-time stock management with low stock alerts
- **Sales Processing**: Complete POS interface with cart management
- **Receipt Generation**: Professional receipt printing with store branding
- **Payment Methods**: Support for cash, card, and digital payments
- **Sales Analytics**: Comprehensive reporting and analytics dashboard

### User Management
- **Role-Based Access**: Admin and Cashier roles with different permissions
- **User Authentication**: Secure JWT-based authentication system
- **Profile Management**: User profile editing and password management
- **Activity Logging**: Track user actions and system events

### Store Management
- **Store Settings**: Customize store name, logo, and tax rates
- **Category Management**: Organize products into categories
- **Dynamic Branding**: Store logo and name appear throughout the system
- **Multi-currency Support**: Currently configured for LAK (Lao Kip)

### Analytics & Reporting
- **Sales Dashboard**: Real-time sales statistics and trends
- **Profit Analysis**: Track profit margins and financial performance
- **Product Performance**: Identify top-selling products
- **Payment Analytics**: Analyze payment method preferences
- **Date Range Filtering**: Generate reports for specific time periods

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS with custom components
- **Database**: Neon PostgreSQL (serverless)
- **Authentication**: JWT with bcrypt password hashing
- **Charts**: Recharts for data visualization
- **UI Components**: Radix UI primitives with custom styling
- **Icons**: Lucide React icons

## 📦 Installation

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
   \`\`\`

4. **Set up the database**
   Run the SQL scripts in the `scripts/` folder in order:
   \`\`\`bash
   # Execute scripts/001-create-tables.sql in your database
   # This creates all necessary tables and indexes
   \`\`\`

5. **Run the development server**
   \`\`\`bash
   pnpm dev
   \`\`\`

6. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser

## 🗄️ Database Schema

The system uses the following main tables:
- `users` - User accounts and authentication
- `categories` - Product categories
- `products` - Product catalog with inventory
- `sales` - Sales transactions
- `sale_items` - Individual items in each sale
- `settings` - Store configuration and branding

## 🔐 Default Credentials

After running the database setup, you can log in with:
- **Username**: admin
- **Password**: admin123

## 📱 Usage

### For Administrators
1. **Dashboard**: View sales statistics and system overview
2. **Products**: Manage product catalog and inventory
3. **Categories**: Organize products into categories
4. **Users**: Manage user accounts and permissions
5. **Settings**: Configure store branding and tax rates
6. **Sales Reports**: Generate and analyze sales data

### For Cashiers
1. **POS Interface**: Process customer transactions
2. **Product Search**: Quick product lookup and barcode scanning
3. **Receipt Printing**: Generate professional receipts
4. **Sales History**: View transaction history
5. **Profile**: Manage personal account settings

## 🎨 Customization

### Store Branding
- Upload your store logo in Settings
- Customize store name and contact information
- Set tax rates and currency preferences
- Configure receipt footer text

### UI Themes
The system supports light and dark themes with CSS custom properties. Modify the color scheme in `app/globals.css`.

## 📊 Analytics Features

- **Real-time Dashboard**: Live sales statistics and KPIs
- **Sales Trends**: Daily, weekly, and monthly sales analysis
- **Product Performance**: Best-selling products and categories
- **Profit Tracking**: Gross profit and margin analysis
- **Payment Methods**: Cash vs. card transaction analysis
- **Stock Alerts**: Low inventory notifications

## 🔧 Configuration

### Database Configuration
The system is configured for Neon PostgreSQL with the following connection details:
- Host: localhost (for development)
- Database: rednxzte_ecomdb
- User: rednxzte_ecomusers
- Timezone: Asia/Bangkok

### Currency Settings
Currently configured for LAK (Lao Kip). To change currency:
1. Update the currency symbol in `lib/utils.ts`
2. Modify the `formatCurrency` function
3. Update database decimal precision if needed

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production
\`\`\`env
DATABASE_URL=your_production_database_url
JWT_SECRET=your_production_jwt_secret
\`\`\`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the API endpoints in `/app/api`

## 🔄 Updates

The system is actively maintained with regular updates for:
- Security patches
- Feature enhancements
- Bug fixes
- Performance improvements

## 📈 Roadmap

Upcoming features:
- [ ] Barcode scanner integration
- [ ] Multi-store support
- [ ] Advanced reporting
- [ ] Mobile app companion
- [ ] Integration with accounting software
- [ ] Customer loyalty program
- [ ] Inventory forecasting
- [ ] Email notifications

---

Built with ❤️ for modern retail businesses
