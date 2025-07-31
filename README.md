# ShopManager Pro - Complete Business Management App

A comprehensive business management solution designed specifically for Indian shops including oil mills, grocery stores, garages, and general stores.

## 🚀 Features

- **Product & Inventory Management** with multiple pack sizes
- **Smart Billing System** with live receipt preview
- **Customer Management** with purchase history
- **Expense Tracking** with category-wise reports
- **Comprehensive Reports** with custom date ranges
- **Professional Dashboard** with key metrics
- **User Authentication** with business profile setup

## 🔧 Production Setup Required

### SMS/OTP Service Integration

The app currently uses demo authentication. For production, integrate one of these services:

#### Option 1: Firebase Authentication (Recommended)
```bash
npm install firebase
```

1. Create Firebase project at https://console.firebase.google.com
2. Enable Phone Authentication
3. Add your domain to authorized domains
4. Update `src/contexts/AuthContext.tsx` with Firebase config

#### Option 2: Twilio SMS API
```bash
npm install twilio
```

1. Sign up at https://www.twilio.com
2. Get Account SID and Auth Token
3. Create API endpoint for OTP verification
4. Update authentication logic

#### Option 3: MSG91 (Indian Service)
```bash
npm install msg91-nodejs
```

1. Sign up at https://msg91.com
2. Get API key and template ID
3. Implement OTP sending and verification
4. Update authentication logic

#### Option 4: AWS SNS
```bash
npm install aws-sdk
```

1. Set up AWS account and SNS service
2. Configure IAM permissions
3. Implement SMS sending logic
4. Update authentication logic

## 🏗️ Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📱 Mobile Optimization

The app is fully responsive and optimized for:
- Mobile phones (320px+)
- Tablets (768px+)
- Desktop (1024px+)

## 🔐 Security Features

- User-based data isolation
- Secure session management
- Business profile protection
- Data export/import capabilities

## 📊 Business Intelligence

- Real-time profit/loss tracking
- Product-wise sales analysis
- Customer purchase patterns
- Expense category breakdowns
- Custom date range reporting

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: Vite
- **State Management**: React Context
- **Storage**: LocalStorage (can be upgraded to cloud)

## 📞 Support

For SMS service integration help or custom features, contact the development team.

## 🚀 Deployment

The app is ready for deployment to:
- Vercel
- Netlify
- AWS Amplify
- Any static hosting service

Remember to configure your chosen SMS service before going live!