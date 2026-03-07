'use strict';

import mongoose from 'mongoose';

const recargaSchema = new mongoose.Schema(
  {
    userId: {
      type:     String,
      required: true,
      index:    true,
      trim:     true,
    },

    tarjetaId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Tarjeta',
      required: true,
    },

    monto: {
      type:     Number,
      required: true,
      min:      0,
    },

    saldoAnterior: {
      type:     Number,
      required: true,
    },

    saldoNuevo: {
      type:     Number,
      required: true,
    },

    estado: {
      type:    String,
      enum:    ['APROBADA', 'RECHAZADA', 'PENDIENTE'],
      default: 'APROBADA',
    },

    referencia: {
      type:     String,
      required: true,
      unique:   true,
      index:    true,
    },

    descripcion: {
      type:    String,
      default: null,
    },
  },
  {
    collection: 'recargas',
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const Recarga = mongoose.model('Recarga', recargaSchema);