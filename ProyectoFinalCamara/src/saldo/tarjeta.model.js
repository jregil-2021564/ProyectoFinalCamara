'use strict';

import mongoose from 'mongoose';

/**
 * Límite de crédito FIJO por marca.
 * El usuario NO puede editarlo — se asigna automáticamente al crear la tarjeta.
 */
export const LIMITE_POR_MARCA = {
  VISA:       50000,
  MASTERCARD: 50000,
  AMEX:       50000,
  DISCOVER:   50000,
  OTRA:       50000,
};

const tarjetaSchema = new mongoose.Schema(
  {
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

    // Límite FIJO por marca — no editable por el usuario
    limiteCredito: {
      type:     Number,
      required: true,
      default:  50000,
    },

    // Total acumulado recargado con esta tarjeta
    totalRecargado: {
      type:    Number,
      default: 0,
      min:     0,
    },

    // ── Verificación de identidad ─────────────────────────────────────────────
    // La tarjeta NO se puede usar hasta que el usuario confirme el token
    verificada: {
      type:    Boolean,
      default: false,
      index:   true,
    },

    // Token de 6 dígitos enviado al correo del usuario
    tokenVerificacion: {
      type:    String,
      default: null,
    },

    // Expiración del token (10 minutos desde que se envió)
    tokenVerificacionExpiry: {
      type:    Date,
      default: null,
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