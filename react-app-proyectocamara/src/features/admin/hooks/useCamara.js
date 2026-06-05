import useAdminStore from '../store/adminStore'
const useCamara = () => {
  const { camaraActiva, loadingCamara, iniciarCamara, toggleCamara } = useAdminStore()
  return { camaraActiva, loadingCamara, iniciarCamara, toggleCamara }
}
export default useCamara
 