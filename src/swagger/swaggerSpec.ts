import swaggerJsdoc from 'swagger-jsdoc';

import dotenv from 'dotenv';
dotenv.config();

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Identity Reconciliation API',
    version: '1.0.0',
    description: 'API for merging contacts based on identifiers like email or phone',
  },
  servers: [
    {
      url: process.env.API_BASE_URL || 'http://localhost:3001/api/',
    },
  ],
  paths: {
    '/identify': {
      post: {
        summary: 'Identify or merge contacts',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  phoneNumber: { type: 'string' },
                },
                anyOf: [{ required: ['email'] }, { required: ['phoneNumber'] }],
              },
              example: { email: 'someone@example.com', phoneNumber: '123456' },
            },
          },
        },
        responses: {
          200: {
            description: 'Contact processed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    contact: {
                      type: 'object',
                      properties: {
                        primaryContactId: { type: 'integer' },
                        emails: {
                          type: 'array',
                          items: { type: 'string' },
                        },
                        phoneNumbers: {
                          type: 'array',
                          items: { type: 'string' },
                        },
                        secondaryContactIds: {
                          type: 'array',
                          items: { type: 'integer' },
                        },
                      },
                    },
                  },
                },
                // example for testing
                example: {
                  contact: {
                    primaryContactId: 1,
                    emails: ['someone@example.com'],
                    phoneNumbers: ['123456'],
                    secondaryContactIds: [],
                  },
                },
              },
            },
          },
          400: {
            description: 'Invalid request',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                  },
                },
                example: { error: 'Either email or phoneNumber must be provided.' },
              },
            },
          },
        },
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;