import RedesignedTradesTable from "../redesigned-trades-table"

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Trades</h1>
          <p className="text-gray-600 mt-2">View and manage all your trading activity</p>
        </div>

        <RedesignedTradesTable />
      </div>
    </div>
  )
}
