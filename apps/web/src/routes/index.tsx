import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

function HomeComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['ping'],
    queryFn: () => api.get<{ message: string }>('/ping'),
  })

  // Determine status message and color
  let statusText = 'Checking connection...'
  let statusColor = 'text-gray-500'

  if (isLoading) {
    statusText = 'Loading...'
  } else if (error) {
    statusText = 'Error connecting to server'
    statusColor = 'text-red-500'
  } else if (data?.message === 'pong') {
    statusText = '✅ Connected (pong)'
    statusColor = 'text-green-600'
  } else {
    statusText = data?.message || 'Unknown response'
  }

  return (
    <div className="text-center py-20">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome to Web Collector</h2>
      <div className="p-4 bg-white rounded-lg shadow-sm inline-block border border-gray-100">
        <p className="text-gray-500 text-sm mb-1">Backend Status:</p>
        <p className={`font-mono font-medium ${statusColor}`}>
          {statusText}
        </p>
      </div>
    </div>
  )
}
