# Corporate Hub - B2B Platform

A comprehensive B2B platform built with Node.js, Express, TypeScript, PostgreSQL, and Drizzle ORM.

## Features

- **Company Management**: Multi-company support with buyer/seller roles
- **User Management**: Role-based authentication (admin, manager, employee)
- **Product Catalog**: Product management with categories, pricing, and inventory
- **Order Management**: Complete order lifecycle with status tracking
- **Invoice System**: Automated invoice generation and management
- **Authentication**: JWT-based authentication with secure password hashing
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations

## Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT with bcryptjs
- **Validation**: Zod schemas
- **Frontend**: React with Vite (client directory)

## Database Schema

### Core Tables

1. **Companies**: Business entities with buyer/seller/both types
2. **Users**: Company users with role-based permissions
3. **Products**: Product catalog with inventory management
4. **Orders**: Purchase orders with items and status tracking
5. **Order Items**: Individual line items within orders
6. **Invoices**: Invoice generation and management
7. **Sessions**: User session management

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new company and user
- `POST /api/auth/login` - User login

### Companies
- `GET /api/companies` - List all companies
- `GET /api/companies/:id` - Get company details

### Products
- `GET /api/products` - List products (with search/filter)
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create new product (authenticated)

### Orders
- `GET /api/orders` - List orders (buyer/seller filtered)
- `GET /api/orders/:id` - Get order details with items
- `POST /api/orders` - Create new order

### Invoices
- `GET /api/invoices` - List company invoices
- `GET /api/invoices/:id` - Get invoice details
- `POST /api/invoices` - Create new invoice

## Setup Instructions

### Prerequisites
- Node.js 20.13.1 or higher
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd Corporate-Hub
   npm install
   ```

2. **Environment Configuration**:
   Copy `.env` file and update with your database credentials:
   ```env
   # Database Configuration
   DATABASE_URL=postgresql://username:password@localhost:5432/corporate_hub
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   
   # Session Configuration
   SESSION_SECRET=your-super-secret-session-key-change-this-in-production
   ```

3. **Database Setup**:
   - Create PostgreSQL database: `corporate_hub`
   - Run database migrations:
     ```bash
     npm run db:push
     ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:5000`

### Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push database schema changes
- `npm run check` - Type checking

## API Usage Examples

### Register Company and User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@company.com",
    "password": "securepassword",
    "firstName": "John",
    "lastName": "Doe",
    "companyName": "Acme Corp",
    "companyEmail": "contact@acme.com",
    "companyType": "both"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "securepassword"
  }'
```

### Create Product
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Professional Laptop",
    "description": "High-performance business laptop",
    "sku": "LAPTOP-001",
    "category": "electronics",
    "price": "1299.99",
    "stockQuantity": 50,
    "minStockLevel": 10
  }'
```

## Security Features

- **Password Hashing**: bcryptjs for secure password storage
- **JWT Authentication**: Stateless authentication with configurable expiration
- **Input Validation**: Zod schemas for all API inputs
- **Role-Based Access**: Different permissions for admin/manager/employee roles
- **Company Isolation**: Users can only access their own company data

## Development Notes

- The server uses TypeScript for type safety
- All database operations are type-safe with Drizzle ORM
- API routes follow RESTful conventions
- Error handling includes proper HTTP status codes
- Environment variables are used for configuration

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a production PostgreSQL database
3. Update JWT secrets with secure values
4. Configure proper CORS for your domain
5. Set up SSL/HTTPS
6. Use a reverse proxy (nginx) for production

## License

MIT License
