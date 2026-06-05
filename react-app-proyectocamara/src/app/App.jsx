import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AppRoutes from './router/AppRoutes'

const App = () => (
  <BrowserRouter>
    <Toaster position="top-right" />
    <AppRoutes />
  </BrowserRouter>
)

export default App
