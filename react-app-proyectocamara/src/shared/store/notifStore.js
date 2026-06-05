import { create } from 'zustand'

// Tipos de notificación
export const NOTIF_TYPES = {
  LOGIN:    'login',
  MULTA:    'multa',
  PAGO:     'pago',
  RECARGA:  'recarga',
  SISTEMA:  'sistema',
}

const useNotifStore = create((set, get) => ({
  notifs: [],
  unread: 0,

  // Agregar notificación
  add: (type, title, desc) => {
    const notif = {
      id:    Date.now(),
      type,
      title,
      desc,
      time:  new Date(),
      read:  false,
    }
    set(s => ({ notifs: [notif, ...s.notifs].slice(0, 20), unread: s.unread + 1 }))
  },

  // Marcar todas como leídas
  markAllRead: () => set(s => ({
    notifs: s.notifs.map(n => ({ ...n, read: true })),
    unread: 0,
  })),

  // Marcar una como leída
  markRead: (id) => set(s => ({
    notifs: s.notifs.map(n => n.id === id ? { ...n, read: true } : n),
    unread: Math.max(0, s.unread - 1),
  })),

  // Limpiar todas
  clear: () => set({ notifs: [], unread: 0 }),
}))

export default useNotifStore