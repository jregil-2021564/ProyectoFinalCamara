'use strict';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { dbConnection } from './db.js';
import '../src/users/user.model.js';
import '../src/auth/role.model.js';
import { requestLimit } from '../middlewares/request-limit.js';
import { corsOptions } from './cors-configuration.js';
import { helmetConfiguration } from './helmet-configuration.js';
import { errorHandler, notFound } from '../middlewares/server-genericError-handler.js';
import authRoutes from '../src/auth/auth.routes.js';
import userRoutes from '../src/users/user.routes.js';
import adminRolesRoutes from '../src/admin/admin.roles.routes.js';
import { setupSwagger } from './swagger.js';

const BASE_PATH = '/api/v1';

export const initServer = async () => {
  const app  = express();
  const PORT = process.env.PORT || 3005;

  await dbConnection();

  const { seedRoles } = await import('../helpers/role-seed.js');
  await seedRoles();

  const { ensureAdminUser } = await import('../helpers/admin-seed.js');
  await ensureAdminUser();

  app.use(express.urlencoded({ extended: false, limit: '10mb' }));
  app.use(express.json({ limit: '10mb' }));
  app.use(cors(corsOptions));
  app.use(helmet(helmetConfiguration));
  app.use(requestLimit);
  app.use(morgan('dev'));

  app.use(`${BASE_PATH}/auth`,       authRoutes);
  app.use(`${BASE_PATH}/users`,      userRoutes);
  app.use(`${BASE_PATH}/admin/roles`, adminRolesRoutes);

  app.get(`${BASE_PATH}/health`, (req, res) => {
    res.json({ status: 'OK', servicio: 'ms-auth', puerto: PORT });
  });

  setupSwagger(app);
  
  app.use(notFound);
  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log(`🔐 ms-auth corriendo en puerto ${PORT}`);
  });
};