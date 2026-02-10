const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Real-Time Multi-Vendor Product & Order Management System',
      version: '1.0.0',
      description: 'A production-grade REST backend with real-time capabilities',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://your-production-url.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: {
              type: 'string',
              maxLength: 50,
              example: 'John Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com'
            },
            password: {
              type: 'string',
              minLength: 6,
              example: 'password123'
            },
            role: {
              type: 'string',
              enum: ['admin', 'seller', 'customer'],
              default: 'customer'
            }
          }
        },
        Product: {
          type: 'object',
          required: ['name', 'description', 'price', 'stock'],
          properties: {
            name: {
              type: 'string',
              maxLength: 100,
              example: 'Laptop'
            },
            description: {
              type: 'string',
              maxLength: 1000,
              example: 'High-performance laptop for professionals'
            },
            price: {
              type: 'number',
              minimum: 0,
              example: 999.99
            },
            stock: {
              type: 'number',
              minimum: 0,
              example: 50
            },
            images: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['/uploads/image1.jpg', '/uploads/image2.jpg']
            }
          }
        },
        Order: {
          type: 'object',
          required: ['items'],
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                required: ['productId', 'quantity'],
                properties: {
                  productId: {
                    type: 'string',
                    example: '507f1f77bcf86cd799439011'
                  },
                  quantity: {
                    type: 'number',
                    minimum: 1,
                    example: 2
                  }
                }
              }
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs
};
