import { sequelize } from './configs/db.js'
import { Cuenta } from './src/cuenta/cuenta.model.js'
import { User } from './src/users/user.model.js'

await sequelize.authenticate()
console.log('BD conectada')
const userId = 'usr_vMQCxcjCDx7A'
// Busca todos los usuarios sin cuenta
const usuarios = await User.findAll()
console.log(`Usuarios encontrados: ${usuarios.length}`)

for (const user of usuarios) {
  const existe = await Cuenta.findOne({ where: { UserId: user.Id } })
  if (!existe) {
    const c = await Cuenta.create({
      UserId:       user.Id,
      NumeroCuenta: 'CTA-' + Date.now().toString().slice(-8) + '-' + Math.floor(Math.random()*9999).toString().padStart(4,'0'),
      Saldo:        0.00,
    })
    console.log(`✅ Cuenta creada para ${user.Email}: ${c.NumeroCuenta}`)
  } else {
    console.log(`⏭ Ya tiene cuenta: ${user.Email} → ${existe.NumeroCuenta}`)
  }
}

process.exit(0)