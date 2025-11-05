import { useQuery } from 'react-query'
import { useAuth } from '@/contexts/auth-context'

interface DashboardStats {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  totalTasks: number
  completedTasks: number
  teamMembers: number
  overallProgress: number
}

export function useDashboardStats() {
  const { token, isAuthenticated } = useAuth()

  return useQuery<DashboardStats>(
    ['dashboard-stats'],
    async () => {
      if (!token) throw new Error('No token available')
      
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        // Fallback to calculating from projects if endpoint doesn't exist
        const projectsResponse = await fetch('/api/projects', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        
        if (!projectsResponse.ok) {
          throw new Error('Failed to fetch dashboard data')
        }
        
        const projectsData = await projectsResponse.json()
        const projects = projectsData.projects || []
        
        // Calculate stats from projects
        const totalProjects = projects.length
        const activeProjects = projects.filter((p: any) => p.status === 'ACTIVE').length
        const completedProjects = projects.filter((p: any) => p.status === 'COMPLETED').length
        const totalTasks = projects.reduce((sum: number, p: any) => sum + (p.totalTasks || 0), 0)
        const completedTasks = projects.reduce((sum: number, p: any) => sum + (p.completedTasks || 0), 0)
        const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        
        return {
          totalProjects,
          activeProjects,
          completedProjects,
          totalTasks,
          completedTasks,
          teamMembers: 8, // Hardcoded for now
          overallProgress,
        }
      }

      return response.json()
    },
    {
      enabled: isAuthenticated && !!token,
    }
  )
}
