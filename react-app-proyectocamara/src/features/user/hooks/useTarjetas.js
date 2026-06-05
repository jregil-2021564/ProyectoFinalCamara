import useUserStore from '../store/userStore'
const useTarjetas = () => {
  const { tarjetas, loadingTarjetas, fetchTarjetas, agregarTarjeta, eliminarTarjeta, verificarTarjeta } = useUserStore()
  return { tarjetas, loading: loadingTarjetas, fetchTarjetas, agregarTarjeta, eliminarTarjeta, verificarTarjeta }
}
export default useTarjetas