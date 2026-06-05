import useUserStore from '../store/userStore'
const useMultas = () => {
  const { multas, tarjetasParaPagar, loadingMultas, fetchMisMultas, pagarConTarjeta, pagarConSaldo } = useUserStore()
  return { multas, tarjetasParaPagar, loading: loadingMultas, fetchMisMultas, pagarConTarjeta, pagarConSaldo }
}
export default useMultas