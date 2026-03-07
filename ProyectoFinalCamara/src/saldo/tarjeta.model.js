'use strict';

import mongoose from 'mongoose';

const tarjetaSchema = new mongoose.Schema(
  {
    // ID del usuario en PostgreSQL — guardado como String exacto
    userId: {
      type:     String,
      required: true,
      index:    true,
      trim:     true,
    },

    alias: {
      type:    String,
      trim:    true,
      default: null,
    },

    ultimosDigitos: {
      type:     String,
      required: true,
    },

    marca: {
      type:     String,
      enum:     ['VISA', 'MASTERCARD', 'AMEX', 'DISCOVER', 'OTRA'],
      required: true,
      default:  'OTRA',
    },

    tipoTarjeta: {
      type:     String,
      enum:     ['CREDITO', 'DEBITO'],
      required: true,
      default:  'CREDITO',
    },

    // Hash SHA-256 no reversible del número
    tokenNumero: {
      type:     String,
      required: true,
      unique:   true,
      index:    true,
    },

    // "MM/YY"
    fechaVencimiento: {
      type:     String,
      required: true,
    },

    nombreTitular: {
      type:      String,
      required:  true,
      trim:      true,
      uppercase: true,
    },

    // Límite máximo que puede recargar con esta tarjeta (acumulado)
    limiteCredito: {
      type:    Number,
      default: 5000,
      min:     [100,   'El límite mínimo es Q100'],
      max:     [50000, 'El límite máximo es Q50,000'],
    },

    // Total acumulado recargado con esta tarjeta
    totalRecargado: {
      type:    Number,
      default: 0,
      min:     0,
    },

    // Soft-delete
    activa: {
      type:    Boolean,
      default: true,
    },
  },
  {
    collection: 'tarjetas',
    timestamps: true,
  }
);

// Virtual: cuánto le queda disponible a la tarjeta
tarjetaSchema.virtual('saldoDisponible').get(function () {
  return Math.max(0, this.limiteCredito - this.totalRecargado);
});

export const Tarjeta = mongoose.model('Tarjeta', tarjetaSchema);