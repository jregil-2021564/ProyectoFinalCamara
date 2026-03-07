'use strict';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { dbConnection } from './db.js';
// Ensure models are registered before DB sync

import '../src/users/user.model.js';
import '../src/auth/role.model.js';
import '../src/trafico/vehiculo.model.js';
import '../src/cuenta/cuenta.model.js';
import { requestLimit } from '../middlewares/request-limit.js';
import { corsOptions } from './cors-configuration.js';
import { helmetConfiguration } from './helmet-configuration.js';
import {
  errorHandler,
  notFound,
} from '../middlewares/server-genericError-handler.js';
import authRoutes from '../src/auth/auth.routes.js';
import userRoutes from '../src/users/user.routes.js';
import traficoRoutes from '../src/trafico/trafico.routes.js';
import cuentaRoutes from '../src/cuenta/cuenta.routes.js';
import adminRolesRoutes from '../src/admin/admin.roles.routes.js';
import pagosRoutes from '../src/pago/pago.routes.js';
import saldoRoutes from '../src/saldo/saldo.routes.js';
import camaraRoutes from '../src/camara/camara.routes.js';

const BASE_PATH = '/api/v1';

const middlewares = (app) => {
  app.use(express.urlencoded({ extended: false, limit: '10mb' }));
  app.use(express.json({ limit: '10mb' }));
  app.use(cors(corsOptions));
  app.use(helmet(helmetConfiguration));
  app.use(requestLimit);
  app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
};

const routes = (app) => {
  app.use(`${BASE_PATH}/auth`, authRoutes);
  app.use(`${BASE_PATH}/users`, userRoutes);
  app.use(`${BASE_PATH}/trafico`, traficoRoutes);
  app.use(`${BASE_PATH}/admin/roles`, adminRolesRoutes);
  app.use(`${BASE_PATH}/cuenta`, cuentaRoutes);
  app.use(`${BASE_PATH}/pagos`, pagosRoutes);
  app.use(`${BASE_PATH}/saldo`, saldoRoutes);
  app.use(`${BASE_PATH}/camara`, camaraRoutes);

  app.get(`${BASE_PATH}/health`, (req, res) => {
    res.status(200).json({
      status: 'Healthy',
      timestamp: new Date().toISOString(),
      service: 'Proyecto Camaras Service',
    });
  });

  app.use(notFound);
};

export const initServer = async () => {
  const app = express();
  const PORT = process.env.PORT;
  app.set('trust proxy', 1);

  try {
    await dbConnection();
    
    const { seedRoles } = await import('../helpers/role-seed.js');
    await seedRoles();

    const { ensureAdminUser } = await import('../helpers/admin-seed.js');
    await ensureAdminUser();

    middlewares(app);  
    routes(app);       

    app.use(errorHandler);

    app.listen(PORT, () => {
      console.log(`Proyecto Camaras running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}${BASE_PATH}/health`);
    });

  } catch (err) {
    console.error(`Error iniciando Proyecto Camaras Server: ${err.message}`);
    process.exit(1);
  }
};