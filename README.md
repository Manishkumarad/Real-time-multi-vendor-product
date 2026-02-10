# Real-Time Multi-Vendor Product & Order Management System

A production-grade REST backend with real-time capabilities built with Node.js, Express, MongoDB, and Socket.IO.

## Features

### Authentication & Authorization
- User registration and login with secure password hashing
- JWT-based authentication with userId and role
- Role-based access control (Admin, Seller, Customer)
- Soft delete support for users

### Product Management
- Sellers can manage their products
- Multiple image upload using Multer (max 5 images, 5MB each)
- Case-insensitive product search
- Pagination and filtering
- Soft delete support
- Stock management with low-stock alerts

### Order Management
- Customers can place multi-product orders
- Atomic stock reduction
- Order status lifecycle management
- Real-time order notifications
- Order cancellation with stock restoration

### Real-Time Communication (Socket.IO)
- JWT authenticated socket connections
- Notify sellers on new orders
- Notify admin on order status changes
- Notify customers of order status updates
- Low-stock alerts

### Reporting & Analytics
- Seller-wise revenue and orders
- Top 5 products by quantity sold
- Monthly revenue grouped by month and year
- Admin dashboard summary
- Low-stock report per seller

## Tech Stack

- **Backend**: Node.js with Express
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **Real-time**: Socket.IO
- **File Upload**: Multer
- **Security**: bcryptjs, cors
- **Environment**: dotenv

## Bonus Features Implemented

✅ **Docker Support**
- Dockerfile with multi-stage build
- docker-compose.yml with MongoDB
- .dockerignore for optimization

✅ **Swagger Documentation**
- Interactive API documentation at `/api-docs`
- Comprehensive endpoint documentation
- Schema definitions for all models

✅ **Unit Testing**
- Jest test framework setup
- Sample user authentication tests
- Test coverage configuration
- Separate test environment

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hrere
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRE=7d
```

5. Start the server:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

## Docker Setup

1. Build and run with Docker Compose:
```bash
docker-compose up --build
```

2. Access the application at `http://localhost:5000`

3. Stop containers:
```bash
docker-compose down
```

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Generate coverage report:
```bash
npm run test:coverage
```

## API Documentation

Interactive API documentation is available at:
- **Swagger UI**: `http://localhost:5000/api-docs`

### Health Check
- `GET /api/health` - Server health check

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Products
- `POST /api/products` - Create product (Seller/Admin)
- `GET /api/products` - Get products with pagination and filtering
- `GET /api/products/:id` - Get product by ID
- `PUT /api/products/:id` - Update product (Seller/Admin)
- `DELETE /api/products/:id` - Soft delete product (Seller/Admin)
- `DELETE /api/products/:id/images/:imageIndex` - Remove product image

### Orders
- `POST /api/orders` - Create order (Customer)
- `GET /api/orders` - Get orders with filtering
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id/status` - Update order status (Admin/Seller)
- `PUT /api/orders/:id/cancel` - Cancel order (Customer/Admin)

### Reports
- `GET /api/reports/seller-revenue` - Seller revenue report (Admin)
- `GET /api/reports/top-products` - Top products by quantity (Admin)
- `GET /api/reports/monthly-revenue` - Monthly revenue report (Admin)
- `GET /api/reports/admin-dashboard` - Admin dashboard (Admin)
- `GET /api/reports/low-stock` - Low stock report (All roles)

### Health Check
- `GET /api/health` - Server health check

## Socket.IO Events

### Client to Server
- `join_seller_room` - Join seller-specific room

### Server to Client
- `new_order` - New order notification (Admin)
- `seller_new_order` - New order for seller
- `low_stock_alert` - Low stock alert for seller
- `order_status_updated` - Order status update (Admin)
- `customer_order_update` - Order status update for customer
- `seller_order_update` - Order status update for seller
- `order_cancelled` - Order cancellation (Admin)
- `customer_order_cancelled` - Order cancellation for customer
- `seller_order_cancelled` - Order cancellation for seller

## Database Schema

### User Schema
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: ['admin', 'seller', 'customer'],
  isActive: Boolean,
  createdAt: Date
}
```

### Product Schema
```javascript
{
  name: String,
  description: String,
  price: Number,
  stock: Number,
  images: [String],
  sellerId: ObjectId (ref: User),
  isActive: Boolean,
  createdAt: Date
}
```

### Order Schema
```javascript
{
  userId: ObjectId (ref: User),
  items: [{
    productId: ObjectId (ref: Product),
    quantity: Number,
    price: Number
  }],
  totalAmount: Number,
  status: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
  createdAt: Date
}
```

## Features Implemented

✅ User authentication with JWT
✅ Role-based authorization
✅ Product management with image upload
✅ Order management with stock control
✅ Real-time notifications with Socket.IO
✅ MongoDB aggregation pipelines for reports
✅ Pagination and filtering
✅ Case-insensitive search
✅ Soft delete support
✅ Centralized error handling
✅ File upload with Multer
✅ Environment configuration
✅ Health check endpoint

## Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Role-based access control
- Input validation and sanitization
- File upload restrictions
- CORS configuration
- Error handling without information leakage

## Performance Features

- Database indexing for queries
- Pagination for large datasets
- Efficient aggregation pipelines
- Connection pooling with Mongoose
- Static file serving for uploads

## Testing

The application includes comprehensive error handling and validation. Test with tools like Postman or Insomnia.

## License

ISC
