"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Settings,
  BarChart3,
  PenTool,
  Save,
  Target,
  DollarSign,
  Activity,
  Plus,
  Eye,
  Goal,
  ArrowUp,
  ArrowDown,
} from "lucide-react"

const weekDays = [
  { day: "Mon", date: 15, status: "complete", trades: 3, pnl: 150.5 },
  { day: "Tue", date: 16, status: "active", trades: 0, pnl: 0 },
  { day: "Wed", date: 17, status: "empty", trades: 0, pnl: 0 },
  { day: "Thu", date: 18, status: "empty", trades: 0, pnl: 0 },
  { day: "Fri", date: 19, status: "empty", trades: 0, pnl: 0 },
]

export function TradingJournal() {
  const [selectedDay, setSelectedDay] = useState(16)
  const [journalEntry, setJournalEntry] = useState(
    "What happened in your trading day on Tuesday, September 16, 2025? Share your thoughts, lessons learned, and reflections...",
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete":
        return "bg-green-600 text-white shadow-lg shadow-green-600/25"
      case "active":
        return "bg-slate-700 text-white shadow-lg shadow-slate-700/25 ring-2 ring-purple-500"
      default:
        return "bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 border border-slate-600"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete":
        return "✓"
      case "active":
        return "●"
      default:
        return ""
    }
  }

  const selectedDayData = weekDays.find((day) => day.date === selectedDay)
  const totalTrades = weekDays.reduce((sum, day) => sum + day.trades, 0)
  const totalPnL = weekDays.reduce((sum, day) => sum + day.pnl, 0)
  const completedDays = weekDays.filter((day) => day.status === "complete").length

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto p-4 space-y-6">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 p-6 text-white shadow-xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-balance">Trading Journal</h1>
                <p className="text-purple-100 text-sm">Track your progress, reflect on your trades</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 text-xs"
              >
                Go to Current Week
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                View All Trades
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 space-y-6">
            <Card className="shadow-xl border-slate-700 bg-slate-800/90 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl text-white">
                      <div className="p-1.5 bg-purple-600/20 rounded-lg">
                        <Calendar className="h-5 w-5 text-purple-400" />
                      </div>
                      Week View
                    </CardTitle>
                    <p className="text-slate-400 mt-1 text-sm">Week of September 15, 2025</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-400">{totalTrades}</div>
                      <div className="text-xs text-slate-400">Trades</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-400">{completedDays}/5</div>
                      <div className="text-xs text-slate-400">Days</div>
                    </div>
                    <div className="text-center">
                      <div
                        className={`text-lg font-bold flex items-center gap-1 ${totalPnL >= 0 ? "text-green-400" : "text-red-400"}`}
                      >
                        {totalPnL >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}$
                        {totalPnL >= 0 ? "+" : ""}
                        {totalPnL.toFixed(2)}
                      </div>
                      <div className="text-xs text-slate-400">P&L</div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-5 gap-3">
                  {weekDays.map((day) => (
                    <Card
                      key={day.date}
                      className={`cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg border-0 ${
                        selectedDay === day.date ? "ring-2 ring-purple-500/50 scale-105" : ""
                      } ${getStatusColor(day.status)}`}
                      onClick={() => setSelectedDay(day.date)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold opacity-90">{day.day}</span>
                          <span className="text-sm">{getStatusIcon(day.status)}</span>
                        </div>
                        <div className="text-2xl font-bold mb-2">{day.date}</div>
                        {day.trades > 0 ? (
                          <div className="space-y-1">
                            <Badge variant="secondary" className="bg-slate-600 text-white text-xs">
                              {day.trades} trades
                            </Badge>
                            <div
                              className={`text-xs font-bold ${
                                day.pnl > 0 ? "text-green-300" : day.pnl < 0 ? "text-red-300" : "text-slate-300"
                              }`}
                            >
                              ${day.pnl > 0 ? "+" : ""}
                              {day.pnl.toFixed(2)}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs opacity-60">No trades</div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-6 pt-4 border-t border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-600 shadow-lg"></div>
                    <span className="text-xs font-medium text-slate-300">Complete</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-700 ring-2 ring-purple-500"></div>
                    <span className="text-xs font-medium text-slate-300">In Progress</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                    <span className="text-xs font-medium text-slate-300">Empty</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-slate-700 bg-slate-800/90 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg text-white">
                    <div className="p-1.5 bg-blue-600/20 rounded-lg">
                      <PenTool className="h-5 w-5 text-blue-400" />
                    </div>
                    Journal Entry for {selectedDayData?.day}, September {selectedDay}, 2025
                  </CardTitle>
                  <Button size="sm" className="gap-2 bg-purple-600 hover:bg-purple-700 shadow-lg">
                    <Save className="h-4 w-4" />
                    Save Entry
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Textarea
                    value={journalEntry}
                    onChange={(e) => setJournalEntry(e.target.value)}
                    className="min-h-[300px] resize-none text-sm leading-relaxed border-slate-600 focus:border-purple-500 rounded-lg p-4 bg-slate-900/50 backdrop-blur-sm text-slate-200 placeholder:text-slate-500"
                    placeholder="Reflect on your trading day... What went well? What could be improved? Any lessons learned?"
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-slate-400 bg-slate-800/80 px-2 py-1 rounded-full">
                    {journalEntry.length} characters
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="shadow-xl border-slate-700 bg-gradient-to-br from-slate-800 to-slate-800/90">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <div className="p-1.5 bg-purple-600/20 rounded-lg">
                    <BarChart3 className="h-4 w-4 text-purple-400" />
                  </div>
                  Weekly Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-slate-700/60 backdrop-blur-sm rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-400 mb-1">{totalTrades}</div>
                    <div className="text-xs text-slate-400">Total Trades</div>
                  </div>
                  <div className="bg-slate-700/60 backdrop-blur-sm rounded-lg p-3 text-center">
                    <div className={`text-2xl font-bold mb-1 ${totalPnL >= 0 ? "text-green-400" : "text-red-400"}`}>
                      ${totalPnL >= 0 ? "+" : ""}
                      {totalPnL.toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-400">Weekly P&L</div>
                  </div>
                  <div className="bg-slate-700/60 backdrop-blur-sm rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-blue-400 mb-1">{completedDays}/5</div>
                    <div className="text-xs text-slate-400">Journal Entries</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-300">Weekly Progress</span>
                    <span className="text-xs font-bold text-purple-400">{((completedDays / 5) * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={(completedDays / 5) * 100} className="h-2 bg-slate-700" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-slate-700 bg-gradient-to-br from-slate-800 to-slate-800/90">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <div className="p-1.5 bg-blue-600/20 rounded-lg">
                    <Activity className="h-4 w-4 text-blue-400" />
                  </div>
                  Daily Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-slate-700/60 backdrop-blur-sm rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-400" />
                    <span className="font-medium text-slate-300 text-sm">Trades</span>
                  </div>
                  <span className="font-bold text-xl text-blue-400">{selectedDayData?.trades || 0}</span>
                </div>
                <div className="bg-slate-700/60 backdrop-blur-sm rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-400" />
                    <span className="font-medium text-slate-300 text-sm">P&L</span>
                  </div>
                  <span
                    className={`font-bold text-xl ${
                      (selectedDayData?.pnl || 0) >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    ${(selectedDayData?.pnl || 0) >= 0 ? "+" : ""}${(selectedDayData?.pnl || 0).toFixed(2)}
                  </span>
                </div>
                <div className="bg-slate-700/60 backdrop-blur-sm rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-purple-400" />
                    <span className="font-medium text-slate-300 text-sm">Win Rate</span>
                  </div>
                  <span className="font-bold text-xl text-purple-400">
                    {selectedDayData?.trades ? "100.0%" : "0.0%"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-slate-700 bg-gradient-to-br from-slate-800 to-slate-800/90">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start gap-2 h-10 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg text-sm">
                  <Plus className="h-4 w-4" />
                  Add New Trade
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 h-10 border-slate-600 hover:bg-slate-700 bg-transparent text-slate-300 text-sm"
                >
                  <BarChart3 className="h-4 w-4 text-blue-400" />
                  View Analytics
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 h-10 border-slate-600 hover:bg-slate-700 bg-transparent text-slate-300 text-sm"
                >
                  <Goal className="h-4 w-4 text-purple-400" />
                  Set Weekly Goals
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
