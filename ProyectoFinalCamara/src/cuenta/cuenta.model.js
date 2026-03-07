import { DataTypes } from 'sequelize';
import { sequelize } from '../../configs/db.js';
import { generateUserId } from '../../helpers/uuid-generator.js';
import { User } from '../users/user.model.js';

// ── Cuenta ────────────────────────────────────────────────────────────────────
export const Cuenta = sequelize.define(
  'Cuenta',
  {
    Id: {
      type: DataTypes.STRING(16),
      primaryKey: true,
      field: 'id',
      defaultValue: () => generateUserId(),
    },
    UserId: {
      type: DataTypes.STRING(16),
      allowNull: false,
      unique: true, // un usuario = una cuenta
      field: 'user_id',
      references: { model: User, key: 'id' },
    },
    NumeroCuenta: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      field: 'numero_cuenta',
    },
    Saldo: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00,
      field: 'saldo',
      validate: {
        min: { args: [0], msg: 'El saldo no puede ser negativo.' },
      },
    },
    CreatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    UpdatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    tableName: 'cuentas',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

// ── SolicitudDeposito ─────────────────────────────────────────────────────────
export const SolicitudDeposito = sequelize.define(
  'SolicitudDeposito',
  {
    Id: {
      type: DataTypes.STRING(16),
      primaryKey: true,
      field: 'id',
      defaultValue: () => generateUserId(),
    },
    UserId: {
      type: DataTypes.STRING(16),
      allowNull: false,
      field: 'user_id',
      references: { model: User, key: 'id' },
    },
    CuentaId: {
      type: DataTypes.STRING(16),
      allowNull: false,
      field: 'cuenta_id',
      references: { model: Cuenta, key: 'id' },
    },
    Monto: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'monto',
      validate: {
        min: { args: [100], msg: 'El monto mínimo de depósito es Q100.' },
      },
    },
    Estado: {
      type: DataTypes.ENUM('PENDIENTE', 'APROBADO', 'RECHAZADO'),
      allowNull: false,
      defaultValue: 'PENDIENTE',
      field: 'estado',
    },
    // Token que se genera cuando el admin aprueba
    TokenDeposito: {
      type: DataTypes.STRING(256),
      allowNull: true,
      field: 'token_deposito',
    },
    TokenExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'token_expiry',
    },
    // Token ya fue usado para depositar
    TokenUsado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'token_usado',
    },
    Motivo: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'motivo', // motivo de rechazo si aplica
    },
    CreatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    UpdatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    tableName: 'solicitudes_deposito',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

// ── Relaciones ────────────────────────────────────────────────────────────────
User.hasOne(Cuenta,                  { foreignKey: 'user_id', as: 'Cuenta' });
Cuenta.belongsTo(User,               { foreignKey: 'user_id', as: 'User' });

User.hasMany(SolicitudDeposito,      { foreignKey: 'user_id', as: 'SolicitudesDeposito' });
SolicitudDeposito.belongsTo(User,    { foreignKey: 'user_id', as: 'User' });

Cuenta.hasMany(SolicitudDeposito,    { foreignKey: 'cuenta_id', as: 'SolicitudesDeposito' });
SolicitudDeposito.belongsTo(Cuenta,  { foreignKey: 'cuenta_id', as: 'Cuenta' });
