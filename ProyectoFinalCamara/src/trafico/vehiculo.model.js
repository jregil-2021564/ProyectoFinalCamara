'use strict';

import { DataTypes } from 'sequelize';
import { sequelize } from '../../configs/db.js';

export const Vehiculo = sequelize.define(
    'vehiculos',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        placa: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true,
            set(value) { this.setDataValue('placa', value.toUpperCase()); }
        },
        modelo: { type: DataTypes.STRING(100), allowNull: false },
        anio: { type: DataTypes.INTEGER, allowNull: false },
        color: { type: DataTypes.STRING(50), allowNull: false },
    },
    {
        freezeTableName: true,
        timestamps: true,
        underscored: true,
    }
);