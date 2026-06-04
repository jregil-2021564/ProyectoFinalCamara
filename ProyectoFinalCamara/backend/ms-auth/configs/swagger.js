'use strict';

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi    from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title:       'MS-Auth API',
      version:     '1.0.0',
      description: 'Microservicio de autenticación — usuarios, roles y sesiones',
    },
    servers: [{ url: 'http://localhost:3005', description: 'Desarrollo' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type:         'http',
          scheme:       'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    tags: [
      { name: 'Authentication', description: 'Login, registro y verificación' },
      { name: 'Profile',        description: 'Perfil del usuario autenticado' },
      { name: 'Users',          description: 'Gestión de usuarios' },
      { name: 'Admin Roles',    description: 'Asignación de roles (solo admin)' },
    ],
  },
  apis: ['./src/**/*.routes.js'],
};

export const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app) => {
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log('📚 Swagger disponible en http://localhost:3005/api/v1/docs');
};