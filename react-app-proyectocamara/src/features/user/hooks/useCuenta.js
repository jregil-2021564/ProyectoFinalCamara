import useUserStore from '../store/userStore'
const useCuenta = () => {
  const { cuenta, saldo, loadingCuenta, loadingSaldo, fetchCuenta, fetchSaldo } = useUserStore()
  return { cuenta, saldo, loading: loadingCuenta || loadingSaldo, fetchCuenta, fetchSaldo }
}
export default useCuenta