'use strict';
import { hashPassword } from '../utils/password-utils.js';
import { User, UserEmail, UserProfile } from '../src/users/user.model.js';
import { Role, UserRole } from '../src/auth/role.model.js';
import { generateUserId } from '../helpers/uuid-generator.js';

export const ensureAdminUser = async () => {
    try {
        const adminEmail = 'josealejandrovirulaarocha@gmail.com';
        const adminPassword = 'Admin1234!';

        const hashedPassword = await hashPassword(adminPassword);

        let user = await User.findOne({
            where: { Email: adminEmail.toLowerCase() }
        });

        if (!user) {
            console.log('⚙️  Creando usuario admin...');
            const userId = generateUserId();

            user = await User.create({
                Id:       userId,
                Name:     'Admin',
                Surname:  'Sistema',
                Username: 'admin_camara',
                Email:    adminEmail.toLowerCase(),
                Password: hashedPassword,
                Status:   true,
            });

            await UserEmail.create({
                Id:            generateUserId(),
                UserId:        userId,
                EmailVerified: true,
            });

            await UserProfile.create({
                Id:    generateUserId(),
                UserId: userId,
                Phone: '00000000',
                Placa: null,
            });

            console.log(`✅ Usuario admin creado`);
        } else {
            await user.update({
                Password: hashedPassword,
                Status:   true,
            });

            const userEmail = await UserEmail.findOne({ where: { UserId: user.Id } });
            if (userEmail) {
                await userEmail.update({ EmailVerified: true });
            } else {
                await UserEmail.create({
                    Id:            generateUserId(),
                    UserId:        user.Id,
                    EmailVerified: true,
                });
            }

            console.log(`✅ Usuario admin actualizado`);
        }

        const adminRole = await Role.findOne({ where: { Name: 'ADMIN_ROLE' } });
        if (!adminRole) {
            console.error('❌ Rol ADMIN_ROLE no encontrado');
            return;
        }

        const existingRole = await UserRole.findOne({
            where: { UserId: user.Id, RoleId: adminRole.Id }
        });

        if (existingRole) {
            console.log(`✅ ${adminEmail} ya tiene ADMIN_ROLE`);
            return;
        }

        const timestamp  = Date.now().toString(36);
        const random     = Math.random().toString(36).substr(2, 5);
        const userRoleId = `ur_${timestamp}${random}`.substring(0, 16);

        await UserRole.create({
            Id:     userRoleId,
            UserId: user.Id,
            RoleId: adminRole.Id
        });

        console.log(`✅ ${adminEmail} promovido a ADMIN_ROLE`);

    } catch (error) {
        console.error('❌ Error admin-seed:', error.message);
    }
};