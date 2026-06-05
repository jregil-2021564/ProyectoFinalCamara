import toast from 'react-hot-toast'

export const toastSuccess = (msg) =>
  toast.success(msg, {
    style: {
      background: '#0f1629',
      color: '#e2e8f0',
      border: '1px solid #1e3a5f',
    },
  })

export const toastError = (msg) =>
  toast.error(msg, {
    style: {
      background: '#0f1629',
      color: '#e2e8f0',
      border: '1px solid #7f1d1d',
    },
  })
