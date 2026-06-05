import { create } from 'zustand'
import { getProfile, updateProfile } from '../api/profileApi'

const useProfileStore = create((set) => ({
  profile: null,
  loading: false,
  saving:  false,
  error:   null,

  fetchProfile: async () => {
    set({ loading: true, error: null })
    try {
      const { data } = await getProfile()
      set({ profile: data.data ?? data, loading: false })
    } catch (err) {
      set({ error: err.response?.data?.message || 'Error al obtener perfil', loading: false })
    }
  },

  saveProfile: async (formData) => {
    set({ saving: true, error: null })
    try {
      const { data } = await updateProfile(formData)
      set({ profile: data.data ?? data, saving: false })
      return { ok: true, message: data.message }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al actualizar perfil'
      set({ error: msg, saving: false })
      return { ok: false, message: msg }
    }
  },
}))

export default useProfileStore