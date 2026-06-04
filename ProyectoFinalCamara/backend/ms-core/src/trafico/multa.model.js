'use strict';

import mongoose from 'mongoose';

const multaSchema = new mongoose.Schema(
    {
        placa:           { type: String, required: true, uppercase: true },
        velocidad:       { type: Number, default: 0 },
        paso_rojo:       { type: Boolean, default: false },
        tipo_infraccion: { type: String, required: true },
        monto_multa:     { type: Number, required: true },
        estado:          { type: String, enum: ['PENDIENTE', 'PAGADA', 'ANULADA'], default: 'PENDIENTE' },
        // Datos detectados por Claude IA
        modelo_detectado: { type: String, default: 'No identificado' },
        color_detectado:  { type: String, default: 'No identificado' },
        anio_detectado:   { type: String, default: 'No identificado' },
        fuente_datos:     { type: String, default: 'Detectado por IA' },
    },
    {
        timestamps: true,
        collection: 'multas',
    }
);

export const Multa = mongoose.model('Multa', multaSchema);






