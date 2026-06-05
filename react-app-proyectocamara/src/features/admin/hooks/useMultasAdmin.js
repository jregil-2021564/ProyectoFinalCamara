import { useEffect } from 'react'
import useAdminStore from '../store/adminStore'
const useMultasAdmin = () => {
  const { multas, loadingMultas, fetchMultas, fetchMultasByPlaca, actualizarMulta, aumentarMultas } = useAdminStore()
  useEffect(() => { if(multas.length===0) fetchMultas() }, [])
  return { multas, loading:loadingMultas, fetchMultas, fetchMultaByPlaca:fetchMultasByPlaca, updateAutoData:actualizarMulta, aumentarMultas }
}
export default useMultasAdmin