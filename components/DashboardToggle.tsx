import { useNavigate } from 'react-router-dom'
import { getUser, isLoggedIn } from '../utils/auth'
import { LayoutDashboard, Globe } from 'lucide-react'

export default function DashboardToggle() {
  const navigate = useNavigate()
  const user = getUser()
  const role = user?.role
  const isAdmin = ['EDITOR','ADMIN',
    'SUPER_ADMIN'].includes(role)
  const isOnDashboard = window.location.pathname
    .includes('/admin')
  
  if (!isLoggedIn()) return null
  
  if (isOnDashboard) {
    return (
      <button
        onClick={() => window.open(
          'https://main.vartmaan-sarokar-pages.pages.dev',
          '_blank'
        )}
        className="flex items-center gap-2 px-3 py-1.5
          bg-white text-[#800000] border border-[#800000]
          rounded-lg text-sm font-bold hover:bg-[#800000]
          hover:text-white transition-all"
      >
        <Globe size={14} />
        Live Site
      </button>
    )
  }
  
  if (isAdmin) {
    return (
      <button
        onClick={() => navigate('/admin')}
        className="flex items-center gap-2 px-3 py-1.5
          bg-[#800000] text-white rounded-lg text-sm 
          font-bold hover:bg-[#600000] transition-all"
      >
        <LayoutDashboard size={14} />
        Dashboard
      </button>
    )
  }
  
  return null
}
