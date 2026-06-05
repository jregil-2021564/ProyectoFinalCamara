import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const useVerifyEmail = () => {
  const [searchParams] = useSearchParams()
  const { verify } = useAuthStore()
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    // decodeURIComponent por si el token viene encodado en la URL
    const rawToken = searchParams.get('token')
    if (!rawToken) {
      setStatus('error')
      setMessage('No se encontró token en la URL.')
      return
    }

    let token
    try {
      token = decodeURIComponent(rawToken)
    } catch {
      token = rawToken
    }

    console.log('TOKEN enviado al backend:', token)
    console.log('TOKEN length:', token.length)

    verify(token).then((res) => {
      if (res.ok) {
        setStatus('success')
        setMessage(res.message || 'Correo verificado correctamente.')
      } else {
        setStatus('error')
        setMessage(res.message || 'Token inválido o expirado.')
      }
    })
  }, [])

  return { status, message }
}

export default useVerifyEmail
