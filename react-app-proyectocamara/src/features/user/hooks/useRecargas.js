import useUserStore from '../store/userStore'
const useRecargas = () => {
  const { recargas, loadingRecargas, fetchRecargas, agregarRecarga } = useUserStore()
  return { recargas, loading: loadingRecargas, fetchRecargas, agregarRecarga }
}
export default useRecargas