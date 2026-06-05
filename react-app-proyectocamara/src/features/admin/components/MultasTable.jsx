import { useState } from 'react'
import { Search, Edit2, X, TrendingUp } from 'lucide-react'
import useMultasAdmin from '../hooks/useMultasAdmin'
import { toastSuccess, toastError } from '../../../shared/utils/toast'

const AutoModal = ({ multa, onClose, onSave }) => {
  const [form, setForm] = useState({ placa: multa.placa ?? '', modelo: multa.modelo ?? '', color: multa.color ?? '', anio: multa.anio ?? '' })
  const [saving, setSaving] = useState(false)
  const handleSave = async () => {
    setSaving(true)
    const res = await onSave(multa._id ?? multa.id, form)
    setSaving(false)
    if (res.ok) { toastSuccess('Datos actualizados'); onClose() } else toastError(res.message)
  }
  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: 420 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontWeight: 600, fontSize: '1rem' }}>Datos del Vehículo</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={18}/></button>
        </div>
        {[['placa','Placa'],['modelo','Modelo'],['color','Color'],['anio','Año']].map(([k,l])=>(
          <div key={k} style={{ marginBottom: 14 }}>
            <label className="form-label">{l}</label>
            <input className="form-input" value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={l} />
          </div>
        ))}
        <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ marginTop: 4 }}>
          {saving ? <span className="spinner"/> : 'Guardar Cambios'}
        </button>
      </div>
    </div>
  )
}

const MultasTable = () => {
  const { multas, loading, fetchMultaByPlaca, fetchMultas, updateAutoData, aumentarMultas } = useMultasAdmin()
  const [search, setSearch] = useState('')
  const [editMulta, setEditMulta] = useState(null)
  const [increasing, setIncreasing] = useState(false)

  const handleSearch = () => search.trim() ? fetchMultaByPlaca(search.trim().toUpperCase()) : fetchMultas()
  const handleAumentar = async () => {
    setIncreasing(true)
    const res = await aumentarMultas()
    setIncreasing(false)
    res.ok ? toastSuccess(res.message || 'Multas aumentadas') : toastError(res.message)
  }

  return (
    <>
      {editMulta && <AutoModal multa={editMulta} onClose={() => setEditMulta(null)} onSave={updateAutoData} />}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <h3 style={{ fontWeight: 600, fontSize: '1rem', color: '#111827' }}>Infracciones / Multas</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input value={search} onChange={e => setSearch(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Buscar placa..." className="form-input"
                style={{ paddingLeft: 32, width: 180, fontSize: '0.85rem', padding: '8px 12px 8px 32px', textTransform: 'uppercase' }} />
            </div>
            <button onClick={handleSearch} className="btn-outline" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>Buscar</button>
            <button onClick={handleAumentar} disabled={increasing} className="btn-success" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
              <TrendingUp size={13}/> Aumentar
            </button>
          </div>
        </div>

        {loading
          ? <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner-dark" style={{ margin: '0 auto' }} /></div>
          : <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>{['Placa','Velocidad','Límite','Monto','Modelo','Color','Año','Estado','Acción'].map(h=><th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {multas.map((m, i) => {
                    const pagada = m.pagada || m.Pagada || m.estado === 'PAGADA'
                    return (
                      <tr key={m._id ?? m.id ?? i}>
                        <td style={{ fontWeight: 600, color: '#1a56db' }}>{m.placa ?? '—'}</td>
                        <td style={{ color: '#e02424', fontWeight: 600 }}>{m.velocidad ?? '—'} km/h</td>
                        <td style={{ color: '#6b7280' }}>{m.limiteVelocidad ?? 80} km/h</td>
                        <td style={{ fontWeight: 600 }}>Q {m.monto ?? '—'}</td>
                        <td style={{ color: '#6b7280' }}>{m.modelo ?? '—'}</td>
                        <td style={{ color: '#6b7280' }}>{m.color ?? '—'}</td>
                        <td style={{ color: '#6b7280' }}>{m.anio ?? '—'}</td>
                        <td><span className={`badge ${pagada ? 'badge-green' : 'badge-yellow'}`}>{pagada ? 'Pagada' : 'Pendiente'}</span></td>
                        <td>
                          <button onClick={() => setEditMulta(m)} className="btn-outline" style={{ padding: '5px 10px', fontSize: '0.75rem' }}>
                            <Edit2 size={11}/> Editar
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {multas.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', color: '#9ca3af', padding: 32 }}>Sin infracciones registradas</td></tr>}
                </tbody>
              </table>
            </div>}
      </div>
    </>
  )
}
export default MultasTable
