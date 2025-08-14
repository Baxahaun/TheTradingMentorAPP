"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Filter,
  ChevronDown,
  Columns3,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  MoreHorizontal,
} from "lucide-react"

// Sample trade data structure
interface Trade {
  id: string
  currencyPair: string
  date: string
  side: "LONG" | "SHORT"
  entry: number
  exit: number
  lotSize: number
  pips: number
  pnl: number
  status: "CLOSED" | "OPEN"
  margin: number
}

// Sample data
const sampleTrades: Trade[] = [
  {
    id: "1",
    currencyPair: "GBP/JPY",
    date: "Dec 07",
    side: "SHORT",
    entry: 196.85,
    exit: 196.45,
    lotSize: 0.05,
    pips: 40.0,
    pnl: 130.5,
    status: "CLOSED",
    margin: 197.0,
  },
  {
    id: "2",
    currencyPair: "EUR/USD",
    date: "Dec 07",
    side: "LONG",
    entry: 1.0542,
    exit: 1.0558,
    lotSize: 0.1,
    pips: 16.0,
    pnl: 160.0,
    status: "CLOSED",
    margin: 352.0,
  },
  {
    id: "3",
    currencyPair: "USD/JPY",
    date: "Dec 06",
    side: "SHORT",
    entry: 149.85,
    exit: 149.25,
    lotSize: 0.08,
    pips: 60.0,
    pnl: 320.0,
    status: "CLOSED",
    margin: 300.0,
  },
  {
    id: "4",
    currencyPair: "AUD/USD",
    date: "Dec 06",
    side: "LONG",
    entry: 0.6415,
    exit: 0.6398,
    lotSize: 0.15,
    pips: -17.0,
    pnl: -255.0,
    status: "CLOSED",
    margin: 385.0,
  },
]

interface ColumnSelectorProps {
  visibleColumns: string[]
  toggleColumn: (columnId: string) => void
}

function ColumnSelector({ visibleColumns, toggleColumn }: ColumnSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 px-3 bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
      >
        <Columns3 className="h-4 w-4 mr-2" />
        Columns
        <ChevronDown className="h-4 w-4 ml-2" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
          <div className="p-2">
            {["currencyPair", "date", "side", "entry", "exit", "pips", "pnl"].map((column) => (
              <label key={column} className="flex items-center p-2 hover:bg-gray-50 rounded-md cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(column)}
                  onChange={() => toggleColumn(column)}
                  className="mr-2"
                />
                <span className="text-sm capitalize">{column.replace(/([A-Z])/g, " $1")}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function RedesignedTradesTable() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState(["currencyPair", "date", "side", "entry", "exit", "pips", "pnl"])
  const [editingTradeId, setEditingTradeId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const toggleColumn = (columnId: string) => {
    setVisibleColumns((prev) => (prev.includes(columnId) ? prev.filter((id) => id !== columnId) : [...prev, columnId]))
  }

  const handleDeleteTrade = (tradeId: string) => {
    console.log("Delete trade:", tradeId)
  }

  const filteredTrades = sampleTrades.filter(
    (trade) =>
      trade.currencyPair.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.date.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      {/* Enhanced Search and Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Enhanced Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search trades..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-80 h-9 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
              />
            </div>

            {/* Trade Count Badge */}
            <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
              {filteredTrades.length} trades
            </Badge>
          </div>

          <div className="flex items-center space-x-3">
            {/* Enhanced Column Selector */}
            <ColumnSelector visibleColumns={visibleColumns} toggleColumn={toggleColumn} />

            {/* Enhanced Filter Button */}
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="h-9 px-3 bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
                <ChevronDown
                  className={`h-4 w-4 ml-2 transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`}
                />
              </Button>

              {showFilters && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Side</label>
                      <div className="flex space-x-2">
                        <Badge variant="outline" className="cursor-pointer hover:bg-green-50 hover:border-green-200">
                          LONG
                        </Badge>
                        <Badge variant="outline" className="cursor-pointer hover:bg-red-50 hover:border-red-200">
                          SHORT
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <div className="flex space-x-2">
                        <Badge variant="outline" className="cursor-pointer hover:bg-blue-50 hover:border-blue-200">
                          CLOSED
                        </Badge>
                        <Badge variant="outline" className="cursor-pointer hover:bg-orange-50 hover:border-orange-200">
                          OPEN
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Trades Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            {/* Enhanced Table Header */}
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center space-x-1 cursor-pointer hover:text-gray-900 transition-colors">
                    <span>Currency Pair</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center space-x-1 cursor-pointer hover:text-gray-900 transition-colors">
                    <span>Date</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Side
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Entry
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Exit
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center justify-end space-x-1 cursor-pointer hover:text-gray-900 transition-colors">
                    <span>Pips</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center justify-end space-x-1 cursor-pointer hover:text-gray-900 transition-colors">
                    <span>P&L</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            {/* Enhanced Table Body */}
            <tbody className="divide-y divide-gray-100">
              {filteredTrades.map((trade, index) => (
                <tr
                  key={trade.id}
                  className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200 hover:shadow-sm"
                >
                  {/* Currency Pair */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-900 transition-colors">
                        {trade.currencyPair}
                      </div>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                      {trade.date}
                    </div>
                  </td>

                  {/* Side */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant={trade.side === "LONG" ? "default" : "destructive"}
                      className={`${
                        trade.side === "LONG"
                          ? "bg-green-100 text-green-800 hover:bg-green-200 border-green-200"
                          : "bg-red-100 text-red-800 hover:bg-red-200 border-red-200"
                      } transition-colors duration-200`}
                    >
                      {trade.side}
                    </Badge>
                  </td>

                  {/* Entry */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-mono text-gray-900 group-hover:text-blue-900 transition-colors">
                      {trade.entry.toFixed(5)}
                    </div>
                  </td>

                  {/* Exit */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-mono text-gray-900 group-hover:text-blue-900 transition-colors">
                      {trade.exit.toFixed(5)}
                    </div>
                  </td>

                  {/* Pips */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div
                      className={`text-sm font-semibold flex items-center justify-end space-x-1 ${
                        trade.pips > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {trade.pips > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      <span>
                        {trade.pips > 0 ? "+" : ""}
                        {trade.pips.toFixed(1)}
                      </span>
                    </div>
                  </td>

                  {/* P&L */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className={`text-sm font-bold ${trade.pnl > 0 ? "text-green-600" : "text-red-600"}`}>
                      {trade.pnl > 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingTradeId(trade.id)}
                        className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTrade(trade.id)}
                        className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Enhanced Empty State */}
        {filteredTrades.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No trades found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  )
}
