'use strict';

import { Multa } from './multa.model.js';
import { Vehiculo } from './vehiculo.model.js';

// POST /api/v1/trafico/infracciones  ← llamado desde Python
export const registrarInfraccion = async (req, res) => {
    try {
        const {
            placa,
            velocidad = 0,
            paso_rojo = false,
            modelo_ia,
            color_ia,
            anio_ia,
        } = req.body;

        if (!placa) {
            return res.status(400).json({ success: false, message: 'Placa requerida' });
        }

        const vehiculo = await Vehiculo.findOne({ where: { placa: placa.toUpperCase() } });

        let vehiculoFinal = vehiculo;
        if (!vehiculo && modelo_ia && color_ia && anio_ia) {
            try {
                vehiculoFinal = await Vehiculo.create({
                    placa: placa.toUpperCase(),
                    modelo: modelo_ia,
                    color: color_ia,
                    anio: anio_ia,
                });
                console.log(`🚗 Vehículo registrado automáticamente por IA: ${placa.toUpperCase()}`);
            } catch (e) {
                vehiculoFinal = await Vehiculo.findOne({ where: { placa: placa.toUpperCase() } });
            }
        }

        let monto = 0;
        const tipo = [];
        if (paso_rojo) { monto += 1500; tipo.push('Semáforo en rojo'); }
        if (velocidad > 60) { monto += (velocidad - 60) * 20; tipo.push(`Exceso de velocidad ${velocidad} km/h`); }

        if (tipo.length === 0) {
            return res.status(200).json({ success: true, message: 'Sin infracciones' });
        }

        const fuenteDatos = vehiculo ? 'Base de datos' : 'Detectado por IA';

        const multa = await Multa.create({
            placa: placa.toUpperCase(),
            velocidad,
            paso_rojo,
            tipo_infraccion: tipo.join(' + '),
            monto_multa: monto,
            modelo_detectado: vehiculoFinal?.modelo || modelo_ia || 'No identificado',
            color_detectado: vehiculoFinal?.color || color_ia || 'No identificado',
            anio_detectado: String(vehiculoFinal?.anio || anio_ia || 'No identificado'),
            fuente_datos: fuenteDatos,
        });

        return res.status(201).json({
            success: true,
            reporte: {
                placa: placa.toUpperCase(),
                modelo: multa.modelo_detectado,
                anio: multa.anio_detectado,
                color: multa.color_detectado,
                tipo_infraccion: tipo.join(' + '),
                monto_multa: `Q${monto}`,
                estado: 'PENDIENTE',
                fuente_datos: fuenteDatos,
                fecha: multa.createdAt,
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

// ── Agregando parte Hugo Benjamín Samayoa Díaz - 2021462 ──────────────────────

// GET /api/v1/trafico/buscar/:placa
export const verMultasPorPlaca = async (req, res) => {
    try {
        const { placa } = req.params;

        if (!placa) {
            return res.status(400).json({ success: false, message: 'Placa requerida' });
        }

        const multas = await Multa.find({ placa: placa.toUpperCase() }).sort({ createdAt: -1 });

        if (multas.length === 0) {
            return res.status(404).json({ success: false, message: `No se encontraron multas para la placa ${placa.toUpperCase()}` });
        }

        return res.status(200).json({
            success: true,
            placa: placa.toUpperCase(),
            total: multas.length,
            multas: multas.map(m => ({
                id: m._id,
                placa: m.placa,
                tipoInfraccion: m.tipo_infraccion,
                velocidad: m.velocidad,
                pasoRojo: m.paso_rojo,
                montoMulta: `Q${parseFloat(m.monto_multa).toFixed(2)}`,
                estado: m.estado,
                modeloDetectado: m.modelo_detectado,
                colorDetectado: m.color_detectado,
                anioDetectado: m.anio_detectado,
                fecha: m.createdAt,
            })),
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// GET /api/v1/trafico/validar-saldo/:multaId
export const validarSaldo = async (req, res) => {
    try {
        const { multaId } = req.params;

        const multa = await Multa.findById(multaId);
        if (!multa) {
            return res.status(404).json({ success: false, message: 'Multa no encontrada' });
        }

        if (multa.estado !== 'PENDIENTE') {
            return res.status(400).json({
                success: false,
                message: `Esta multa ya fue ${multa.estado.toLowerCase()}`,
            });
        }

        const { Cuenta } = await import('../cuenta/cuenta.model.js');
        const cuenta = await Cuenta.findOne({ where: { UserId: req.user.Id } });

        if (!cuenta) {
            return res.status(404).json({ success: false, message: 'No tienes una cuenta registrada' });
        }

        const saldoActual = parseFloat(cuenta.Saldo);
        const montoMulta = parseFloat(multa.monto_multa);
        const tieneSaldo = saldoActual >= montoMulta;

        return res.status(200).json({
            success: true,
            multaId: multa._id,
            placa: multa.placa,
            montoMulta: `Q${montoMulta.toFixed(2)}`,
            saldoActual: `Q${saldoActual.toFixed(2)}`,
            tieneSaldo,
            message: tieneSaldo
                ? 'Saldo suficiente para pagar la multa'
                : `Saldo insuficiente. Te faltan Q${(montoMulta - saldoActual).toFixed(2)}`,
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// PUT /api/v1/trafico/aumentar-multas
export const aumentarMultas = async (req, res) => {
    try {
        const roles = req.user?.UserRoles?.map(ur => ur.Role?.Name).filter(Boolean) ?? [];
        if (!roles.includes('ADMIN_ROLE')) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Solo administradores pueden aumentar multas.',
            });
        }

        // Solo multas pendientes de MÁS de 30 minutos
        const hace30Min = new Date(Date.now() - 30 * 60 * 1000);

        const multasPendientes = await Multa.find({
            estado: 'PENDIENTE',
            createdAt: { $lte: hace30Min },
        });

        if (multasPendientes.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No hay multas pendientes de más de 30 minutos',
                actualizadas: 0,
            });
        }

        const actualizaciones = multasPendientes.map(multa => {
            const nuevoMonto = parseFloat((multa.monto_multa * 1.10).toFixed(2));
            return Multa.findByIdAndUpdate(multa._id, { monto_multa: nuevoMonto }, { new: true });
        });

        const multasActualizadas = await Promise.all(actualizaciones);

        return res.status(200).json({
            success: true,
            message: `Se aumentó 10% a ${multasActualizadas.length} multa(s) con más de 30 minutos pendientes`,
            actualizadas: multasActualizadas.length,
            detalle: multasActualizadas.map(m => ({
                id: m._id,
                placa: m.placa,
                nuevoMonto: `Q${parseFloat(m.monto_multa).toFixed(2)}`,
            })),
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};
// POST /api/v1/trafico/pagar/:multaId
export const pagarMulta = async (req, res) => {
    try {
        const { multaId } = req.params;

        const multa = await Multa.findById(multaId);
        if (!multa) {
            return res.status(404).json({ success: false, message: 'Multa no encontrada' });
        }

        if (multa.estado !== 'PENDIENTE') {
            return res.status(400).json({
                success: false,
                message: `Esta multa ya fue ${multa.estado.toLowerCase()}`,
            });
        }

        const { Cuenta } = await import('../cuenta/cuenta.model.js');
        const cuenta = await Cuenta.findOne({ where: { UserId: req.user.Id } });

        if (!cuenta) {
            return res.status(404).json({ success: false, message: 'No tienes una cuenta registrada' });
        }

        const saldoActual = parseFloat(cuenta.Saldo);
        const montoMulta = parseFloat(multa.monto_multa);

        if (saldoActual < montoMulta) {
            return res.status(400).json({
                success: false,
                message: `Saldo insuficiente. Tu saldo es Q${saldoActual.toFixed(2)} y la multa es Q${montoMulta.toFixed(2)}`,
                saldoActual: `Q${saldoActual.toFixed(2)}`,
                montoMulta: `Q${montoMulta.toFixed(2)}`,
                falta: `Q${(montoMulta - saldoActual).toFixed(2)}`,
            });
        }

        const nuevoSaldo = saldoActual - montoMulta;
        await cuenta.update({ Saldo: nuevoSaldo });
        await multa.updateOne({ estado: 'PAGADA' });

        return res.status(200).json({
            success: true,
            message: 'Multa pagada exitosamente',
            recibo: {
                placa: multa.placa,
                monto: `Q${montoMulta.toFixed(2)}`,
                fechaDePago: new Date().toLocaleString('es-GT'),
                saldoAnterior: `Q${saldoActual.toFixed(2)}`,
                saldoActual: `Q${nuevoSaldo.toFixed(2)}`,
                estado: 'PAGADA',
            },
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// PUT /api/v1/trafico/multas/:multaId  ← solo ADMIN_ROLE
export const actualizarDatosMulta = async (req, res) => {
    try {
        const userId = String(req.user?.Id ?? req.user?.id ?? '').trim();

        const roles = req.user?.UserRoles?.map(ur => ur.Role?.Name).filter(Boolean)
            ?? await getUserRoleNames(userId);

        if (!roles.includes('ADMIN_ROLE')) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Solo administradores pueden editar multas.',
            });
        }

        const { multaId } = req.params;
        const { placa, modelo, color, anio } = req.body;

        const multa = await Multa.findById(multaId);
        if (!multa) {
            return res.status(404).json({ success: false, message: 'Multa no encontrada' });
        }

        if (placa) multa.placa = placa.toUpperCase();
        if (modelo) multa.modelo_detectado = modelo;
        if (color) multa.color_detectado = color;
        if (anio) multa.anio_detectado = String(anio);

        if (placa) {
            const placaLimpia = placa.toUpperCase();
            const vehiculo = await Vehiculo.findOne({ where: { placa: placaLimpia } });
            if (!vehiculo && modelo && color && anio) {
                await Vehiculo.create({
                    placa: placaLimpia,
                    modelo: modelo,
                    color: color,
                    anio: anio,
                });
            }
        }

        await multa.save();

        return res.status(200).json({
            success: true,
            message: 'Datos de multa actualizados correctamente',
            multa: {
                id: multa._id,
                placa: multa.placa,
                modelo: multa.modelo_detectado,
                color: multa.color_detectado,
                anio: multa.anio_detectado,
                estado: multa.estado,
            },
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

export const listarVehiculos = async (req, res) => {
    try {
        const vehiculos = await Vehiculo.findAll({ order: [['createdAt', 'DESC']] })
        return res.status(200).json({ success: true, total: vehiculos.length, vehiculos })
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message })
    }
}