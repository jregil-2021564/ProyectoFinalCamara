'use strict';

import { Sequelize } from 'sequelize';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// ==================== PostgreSQL Configuration ====================
export const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  logging: process.env.DB_SQL_LOGGING === 'true' ? console.log : false,
  define: {
    freezeTableName: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

// ==================== MongoDB Configuration ====================
const setupMongooseListeners = () => {
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB | Connection error:', err.message);
  });

  mongoose.connection.on('connecting', () => {
    console.log('MongoDB | Trying to connect...');
  });

  mongoose.connection.on('connected', () => {
    console.log('MongoDB | Connected to MongoDB');
  });

  mongoose.connection.on('open', () => {
    console.log('MongoDB | Connection to database established');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB | Reconnected to MongoDB');
  });

  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB | Disconnected from MongoDB');
  });
};

// ==================== Connection Functions ====================
const connectPostgres = async () => {
  try {
    console.log('PostgreSQL | Trying to connect...');
    await sequelize.authenticate();
    console.log('PostgreSQL | Connected to PostgreSQL');
    console.log('PostgreSQL | Connection to database established');

    // Sincronizar modelos en desarrollo
    if (process.env.NODE_ENV === 'development') {
      const syncLogging = process.env.DB_SQL_LOGGING === 'true' ? console.log : false;
      await sequelize.sync({ alter: true, logging: syncLogging });
      console.log('PostgreSQL | Models synchronized with database');
    }
  } catch (error) {
    console.error('PostgreSQL | Could not connect to PostgreSQL');
    console.error('PostgreSQL | Error:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  }
};

const connectMongoDB = async () => {
  try {
    // Verificar que URI_MONGO esté configurada
    if (!process.env.URI_MONGO) {
      throw new Error('URI_MONGO is not defined in environment variables');
    }

    console.log('MongoDB | URI:', process.env.URI_MONGO); // Debug: ver la URI
    
    // Setup listeners ANTES de conectar
    setupMongooseListeners();
    
    // Intentar conectar
    await mongoose.connect(process.env.URI_MONGO, {
      serverSelectionTimeoutMS: 10000, // Aumentado a 10 segundos
      maxPoolSize: 10,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      family: 4 // Forzar IPv4
    });

    console.log('MongoDB | Connection successful');
  } catch (error) {
    console.error('MongoDB | Error connecting to database:', error.message);
    console.error('MongoDB | Full error:', error);
    throw error;
  }
};

// ==================== Main Connection Function ====================
export const dbConnection = async () => {
  try {
    // Conectar PostgreSQL primero
    await connectPostgres();
    
    // Luego MongoDB
    await connectMongoDB();
    
    console.log('All database connections established successfully');
  } catch (error) {
    console.error('Database connection error:', error.message);
    
    // No salir inmediatamente, mostrar qué falló
    if (error.message.includes('MongoDB')) {
      console.error('MongoDB connection failed. Check if MongoDB is running.');
      console.error('Try: mongod --dbpath /path/to/your/data');
    }
    
    process.exit(1);
  }
};

// ==================== Graceful Shutdown ====================
const gracefulShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Closing database connections...`);
  
  try {
    const promises = [];
    
    // Cerrar PostgreSQL
    promises.push(
      sequelize.close()
        .then(() => console.log('PostgreSQL | Connection closed successfully'))
        .catch(err => console.error('PostgreSQL | Error closing:', err.message))
    );
    
    // Cerrar MongoDB solo si está conectado
    if (mongoose.connection.readyState !== 0) {
      promises.push(
        mongoose.connection.close()
          .then(() => console.log('MongoDB | Connection closed successfully'))
          .catch(err => console.error('MongoDB | Error closing:', err.message))
      );
    }
    
    await Promise.all(promises);
    
    console.log('All database connections closed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error.message);
    process.exit(1);
  }
};

// Handle different termination signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon restarts