'use strict';

import { User } from '../users/user.model.js';
import { Role, UserRole } from '../auth/role.model.js';

// Email del admin protegido — nadie puede tocarle el rol
const PROTECTED_ADMIN_EMAIL = 'josealejandrovirulaarocha@gmail.com';

/**
 * POST /api/v1/admin/roles/assign
 * Body: { userId, roleName }
 * Asigna un rol a un usuario. El admin protegido no puede ser modificado.
 */
export const assignRole = async (req, res) => {
    try {
        const { userId, roleName } = req.body;

        if (!userId || !roleName) {
            return res.status(400).json({
                success: false,
                message: 'userId y roleName son requeridos',
            });
        }

        // Buscar el usuario objetivo
        const targetUser = await User.findOne({ where: { Id: userId } });
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado',
            });
        }

        // Buscar el rol
        const role = await Role.findOne({ where: { Name: roleName } });
        if (!role) {
            return res.status(404).json({
                success: false,
                message: `Rol '${roleName}' no encontrado`,
            });
        }

        // Verificar si ya tiene ese rol
        const existing = await UserRole.findOne({
            where: { UserId: userId, RoleId: role.Id },
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                message: `El usuario ya tiene el rol '${roleName}'`,
            });
        }

        // Generar ID para UserRole (mismo patrón que admin-seed)
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        const userRoleId = `ur_${timestamp}${random}`.substring(0, 16);

        await UserRole.create({
            Id: userRoleId,
            UserId: userId,
            RoleId: role.Id,
        });

        return res.status(201).json({
            success: true,
            message: `Rol '${roleName}' asignado correctamente al usuario`,
            data: {
                userId,
                email: targetUser.Email,
                roleName,
            },
        });
    } catch (error) {
        console.error('Error en assignRole:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * DELETE /api/v1/admin/roles/remove
 * Body: { userId, roleName }
 * Quita un rol a un usuario. El admin protegido NO puede perder ADMIN_ROLE.
 */
export const removeRole = async (req, res) => {
    try {
        const { userId, roleName } = req.body;

        if (!userId || !roleName) {
            return res.status(400).json({
                success: false,
                message: 'userId y roleName son requeridos',
            });
        }

        // Buscar el usuario objetivo
        const targetUser = await User.findOne({ where: { Id: userId } });
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado',
            });
        }

        // ── PROTECCIÓN: el admin por defecto no puede perder ADMIN_ROLE ──────────
        const isProtectedAdmin =
            targetUser.Email.toLowerCase() === PROTECTED_ADMIN_EMAIL.toLowerCase();
        const isRemovingAdminRole = roleName === 'ADMIN_ROLE';

        if (isProtectedAdmin && isRemovingAdminRole) {
            return res.status(403).json({
                success: false,
                message: 'No se puede quitar ADMIN_ROLE al administrador principal del sistema',
            });
        }

        // Buscar el rol
        const role = await Role.findOne({ where: { Name: roleName } });
        if (!role) {
            return res.status(404).json({
                success: false,
                message: `Rol '${roleName}' no encontrado`,
            });
        }

        // Verificar que tenga ese rol
        const userRole = await UserRole.findOne({
            where: { UserId: userId, RoleId: role.Id },
        });

        if (!userRole) {
            return res.status(404).json({
                success: false,
                message: `El usuario no tiene el rol '${roleName}'`,
            });
        }

        await userRole.destroy();

        return res.status(200).json({
            success: true,
            message: `Rol '${roleName}' removido correctamente del usuario`,
            data: {
                userId,
                email: targetUser.Email,
                roleName,
            },
        });
    } catch (error) {
        console.error('Error en removeRole:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * GET /api/v1/admin/roles/users
 * Lista todos los usuarios con sus roles actuales.
 */
export const listUsersWithRoles = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['Id', 'Name', 'Surname', 'Email', 'Status'],
            include: [
                {
                    model: UserRole,
                    as: 'UserRoles',
                    include: [{ model: Role, as: 'Role', attributes: ['Id', 'Name'] }],
                },
            ],
        });

        const result = users.map((u) => ({
            id: u.Id,
            name: `${u.Name} ${u.Surname}`,
            email: u.Email,
            status: u.Status,
            roles: u.UserRoles?.map((ur) => ur.Role?.Name).filter(Boolean) ?? [],
            isProtected: u.Email.toLowerCase() === PROTECTED_ADMIN_EMAIL.toLowerCase(),
        }));

        return res.status(200).json({ success: true, total: result.length, users: result });
    } catch (error) {
        console.error('Error en listUsersWithRoles:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * GET /api/v1/admin/roles/available
 * Devuelve todos los roles disponibles en el sistema.
 */
export const listAvailableRoles = async (req, res) => {
    try {
        const roles = await Role.findAll({ attributes: ['Id', 'Name'] });
        return res.status(200).json({ success: true, roles });
    } catch (error) {
        console.error('Error en listAvailableRoles:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};
