'use strict';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { dbConnection } from './db.js';
import '../src/users/user.model.js';
import '../src/auth/role.model.js';
import '../src/trafico/vehiculo.model.js';
import '../src/cuenta/cuenta.model.js';
import { requestLimit } from '../middlewares/request-limit.js';
import { corsOptions } from './cors-configuration.js';
import { helmetConfiguration } from './helmet-configuration.js';
import { errorHandler, notFound } from '../middlewares/server-genericError-handler.js';
import traficoRoutes  from '../src/trafico/trafico.routes.js';
import cuentaRoutes   from '../src/cuenta/cuenta.routes.js';
import pagosRoutes    from '../src/pago/pago.routes.js';
import saldoRoutes    from '../src/saldo/saldo.routes.js';
import camaraRoutes   from '../src/camara/camara.routes.js';
import { setupSwagger } from './swagger.js';

const BASE_PATH = '/api/v1';

export const initServer = async () => {
  const app  = express();
  const PORT = process.env.PORT || 3006;

  await dbConnection();

  app.use(express.urlencoded({ extended: false, limit: '10mb' }));
  app.use(express.json({ limit: '10mb' }));
  app.use(cors(corsOptions));
  app.use(helmet(helmetConfiguration));
  app.use(requestLimit);
  app.use(morgan('dev'));

  app.use(`${BASE_PATH}/trafico`, traficoRoutes);
  app.use(`${BASE_PATH}/cuenta`,  cuentaRoutes);
  app.use(`${BASE_PATH}/pagos`,   pagosRoutes);
  app.use(`${BASE_PATH}/saldo`,   saldoRoutes);
  app.use(`${BASE_PATH}/camara`,  camaraRoutes);

  app.get(`${BASE_PATH}/health`, (req, res) => {
    res.json({ status: 'OK', servicio: 'ms-core', puerto: PORT });
  });


  setupSwagger(app);

  app.use(notFound);
  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log(`🚗 ms-core corriendo en puerto ${PORT}`);
  });
};