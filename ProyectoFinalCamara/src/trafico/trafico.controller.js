'use strict';

import { Multa } from './multa.model.js';
import { Vehiculo } from './vehiculo.model.js';

// POST /api/v1/trafico/infracciones  ← llamado desde Python
export const registrarInfraccion = async (req, res) => {
    try {
        const {
            placa,
            velocidad  = 0,
            paso_rojo  = false,
            // Datos detectados por Claude IA
            modelo_ia,
            color_ia,
            anio_ia,
        } = req.body;

        if (!placa) {
            return res.status(400).json({ success: false, message: 'Placa requerida' });
        }

        // Buscar vehículo registrado en PostgreSQL
        const vehiculo = await Vehiculo.findOne({ where: { placa: placa.toUpperCase() } });

        // Si no está en BD pero la IA detectó datos, registrarlo automáticamente
        let vehiculoFinal = vehiculo;
        if (!vehiculo && modelo_ia && color_ia && anio_ia) {
            try {
                vehiculoFinal = await Vehiculo.create({
                    placa:  placa.toUpperCase(),
                    modelo: modelo_ia,
                    color:  color_ia,
                    anio:   anio_ia,
                });
                console.log(`🚗 Vehículo registrado automáticamente por IA: ${placa.toUpperCase()}`);
            } catch (e) {
                vehiculoFinal = await Vehiculo.findOne({ where: { placa: placa.toUpperCase() } });
            }
        }

        // Calcular monto e infracciones
        let monto = 0;
        const tipo = [];
        if (paso_rojo)      { monto += 1500; tipo.push('Semáforo en rojo'); }
        if (velocidad > 60) { monto += (velocidad - 60) * 20; tipo.push(`Exceso de velocidad ${velocidad} km/h`); }

        if (tipo.length === 0) {
            return res.status(200).json({ success: true, message: 'Sin infracciones' });
        }

        const fuenteDatos = vehiculo ? 'Base de datos' : 'Detectado por IA';

        // Guardar multa en MongoDB con todos los datos
        const multa = await Multa.create({
            placa:            placa.toUpperCase(),
            velocidad,
            paso_rojo,
            tipo_infraccion:  tipo.join(' + '),
            monto_multa:      monto,
            modelo_detectado: vehiculoFinal?.modelo || modelo_ia || 'No identificado',
            color_detectado:  vehiculoFinal?.color  || color_ia  || 'No identificado',
            anio_detectado:   String(vehiculoFinal?.anio || anio_ia || 'No identificado'),
            fuente_datos:     fuenteDatos,
        });

        return res.status(201).json({
            success: true,
            reporte: {
                placa:           placa.toUpperCase(),
                modelo:          multa.modelo_detectado,
                anio:            multa.anio_detectado,
                color:           multa.color_detectado,
                tipo_infraccion: tipo.join(' + '),
                monto_multa:     `Q${monto}`,
                estado:          'PENDIENTE',
                fuente_datos:    fuenteDatos,
                fecha:           multa.createdAt,
            },
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// GET /api/v1/trafico/multas  ← protegido con JWT
export const obtenerMultas = async (req, res) => {
    try {
        const multas = await Multa.find().sort({ createdAt: -1 });
        return res.status(200).json({ success: true, total: multas.length, multas });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// GET /api/v1/trafico/multas/:placa  ← protegido con JWT
export const obtenerMultasPorPlaca = async (req, res) => {
    try {
        const { placa } = req.params;
        const multas = await Multa.find({ placa: placa.toUpperCase() }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, total: multas.length, multas });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// POST /api/v1/trafico/vehiculos  ← registrar vehículo manualmente
export const registrarVehiculo = async (req, res) => {
    try {
        const { placa, modelo, color, anio } = req.body;
        if (!placa || !modelo || !anio || !color) {
            return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });
        }
        const vehiculo = await Vehiculo.create({ placa, modelo, anio, color });
        return res.status(201).json({ success: true, vehiculo });
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ success: false, message: 'Placa ya registrada' });
        }
        return res.status(500).json({ success: false, error: err.message });
    }
};