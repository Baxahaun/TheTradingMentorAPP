"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { CalendarDays, Save } from "lucide-react"

// Mock trade data
const mockTrades = [
  {
    id: 1,
    pair: "GBP/JPY",
    side: "SHORT",
    entry: 196.85,
    exit: 196.45,
    pips: 40.0,
    pnl: 130.5,
    date: "Dec 07",
    time: "09:30",
    contractsTraded: 30,
    volume: 5,
    commissions: 0.0,
    netROI: 0.07,
    grossPnl: 607.5,
    created: "Jul 07, 2024 03:34AM",
    lastUpdated: "Jul 07, 2024 03:34AM",
  },
  {
    id: 2,
    pair: "EUR/USD",
    side: "LONG",
    entry: 1.0542,
    exit: 1.0558,
    pips: 16.0,
    pnl: 160.0,
    date: "Dec 07",
    time: "11:15",
    contractsTraded: 25,
    volume: 3,
    commissions: 2.5,
    netROI: 0.12,
    grossPnl: 162.5,
    created: "Jul 07, 2024 11:15AM",
    lastUpdated: "Jul 07, 2024 11:15AM",
  },
  {
    id: 3,
    pair: "USD/JPY",
    side: "SHORT",
    entry: 149.85,
    exit: 149.25,
    pips: 60.0,
    pnl: 320.0,
    date: "Dec 06",
    time: "14:20",
    contractsTraded: 40,
    volume: 7,
    commissions: 1.0,
    netROI: 0.1,
    grossPnl: 321.0,
    created: "Jul 06, 2024 02:20PM",
    lastUpdated: "Jul 06, 2024 02:20PM",
  },
  {
    id: 4,
    pair: "AUD/USD",
    side: "LONG",
    entry: 0.6415,
    exit: 0.6398,
    pips: -17.0,
    pnl: -255.0,
    date: "Dec 06",
    time: "16:45",
    contractsTraded: 20,
    volume: 4,
    commissions: 1.5,
    netROI: -0.12,
    grossPnl: -256.5,
    created: "Jul 06, 2024 04:45PM",
    lastUpdated: "Jul 06, 2024 04:45PM",
  },
  {
    id: 5,
    pair: "USD/CAD",
    side: "SHORT",
    entry: 1.4125,
    exit: 1.4158,
    pips: -33.0,
    pnl: -330.0,
    date: "Dec 05",
    time: "08:30",
    contractsTraded: 50,
    volume: 10,
    commissions: 2.0,
    netROI: -0.06,
    grossPnl: -332.0,
    created: "Jul 05, 2024 08:30AM",
    lastUpdated: "Jul 05, 2024 08:30AM",
  },
]

export default function JournalPage() {
  const [selectedTrade, setSelectedTrade] = useState<number | null>(null)
  const [journalContent, setJournalContent] = useState("")

  const selectedTradeData = selectedTrade ? mockTrades.find((trade) => trade.id === selectedTrade) : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Tabs */}
      <div className="border-b border-gray-200 bg-white">
        <div className="px-6 py-4">
          <Tabs defaultValue="daily-journal" className="w-full">
            <div className="flex items-center justify-between">
              <TabsList className="bg-gray-100 border-gray-200">
                <TabsTrigger
                  value="daily-journal"
                  className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
                >
                  <CalendarDays className="w-4 h-4 mr-2" />
                  Daily Journal
                </TabsTrigger>
                <TabsTrigger
                  value="weekly-review"
                  className="data-[state=active]:bg-white data-[state=active]:text-gray-900"
                  disabled
                >
                  Weekly Review
                </TabsTrigger>
                <TabsTrigger
                  value="monthly-analysis"
                  className="data-[state=active]:bg-white data-[state=active]:text-gray-900"
                  disabled
                >
                  Monthly Analysis
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="daily-journal" className="mt-0">
              <div className="flex h-[calc(100vh-120px)]">
                {/* Left Sidebar - Trades List */}
                <div className="w-64 border-r border-gray-200 bg-white">
                  <div className="p-3 border-b border-gray-200">
                    <h3 className="font-medium text-sm text-gray-900 mb-1">Recent Trades</h3>
                    <div className="text-xs text-gray-500">Click a trade to link it to your journal</div>
                  </div>

                  <ScrollArea className="h-full">
                    <div className="p-2 space-y-2">
                      {mockTrades.map((trade) => (
                        <div
                          key={trade.id}
                          className={`cursor-pointer p-3 rounded-lg border transition-all hover:bg-gray-50 ${
                            selectedTrade === trade.id
                              ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200"
                              : "border-gray-200 bg-white"
                          }`}
                          onClick={() => setSelectedTrade(trade.id)}
                        >
                          <div className="flex items-start gap-2">
                            <div className="w-4 h-4 border border-gray-300 rounded mt-0.5 flex-shrink-0">
                              {selectedTrade === trade.id && (
                                <div className="w-2 h-2 bg-blue-600 rounded-sm m-0.5"></div>
                              )}
                            </div>
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center justify-between">
                                <div className="font-medium text-sm text-gray-900">{trade.pair}</div>
                                <Badge
                                  variant={trade.side === "LONG" ? "default" : "secondary"}
                                  className={`text-xs px-2 py-0.5 ${
                                    trade.side === "LONG"
                                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                                      : "bg-red-100 text-red-800 hover:bg-red-200"
                                  }`}
                                >
                                  {trade.side}
                                </Badge>
                              </div>

                              <div className="text-xs text-gray-600">
                                NET P&L:{" "}
                                <span className={`font-medium ${trade.pnl > 0 ? "text-green-600" : "text-red-600"}`}>
                                  ${trade.pnl > 0 ? "+" : ""}
                                  {trade.pnl.toFixed(2)}
                                </span>
                              </div>

                              <div className="text-xs text-gray-500">{trade.date}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Main Journal Area */}
                <div className="flex-1 flex flex-col">
                  {selectedTradeData ? (
                    <div className="p-6 border-b border-gray-200 bg-white">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">
                            {selectedTradeData.pair} : {selectedTradeData.date}, 2024
                          </h2>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                            View Trade Details
                          </Button>
                          <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                            <Save className="w-4 h-4 mr-2" />
                            Save & Publish
                          </Button>
                          <button className="text-gray-400 hover:text-gray-600">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="text-sm text-gray-500 mb-4">
                        Created: {selectedTradeData.created} Last updated: {selectedTradeData.lastUpdated}
                      </div>

                      <div className="mb-6">
                        <div className="text-lg font-semibold text-green-600 mb-4">
                          Net P&L ${selectedTradeData.pnl > 0 ? "+" : ""}
                          {selectedTradeData.pnl.toFixed(2)}
                        </div>

                        <div className="grid grid-cols-5 gap-6 text-sm">
                          <div>
                            <div className="text-gray-500 mb-1">Contracts Traded</div>
                            <div className="font-semibold text-gray-900">{selectedTradeData.contractsTraded}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 mb-1">Volume</div>
                            <div className="font-semibold text-gray-900">{selectedTradeData.volume}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 mb-1">Commissions</div>
                            <div className="font-semibold text-gray-900">
                              ${selectedTradeData.commissions.toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500 mb-1">Net ROI</div>
                            <div className="font-semibold text-gray-900">
                              {(selectedTradeData.netROI * 100).toFixed(2)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500 mb-1">Gross P&L</div>
                            <div className="font-semibold text-gray-900">${selectedTradeData.grossPnl.toFixed(2)}</div>
                          </div>
                        </div>
                      </div>

                      <div className="text-sm text-gray-600">
                        Recently used template: <span className="text-blue-600">+ Add Template</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 border-b border-gray-200 bg-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 mb-1">Daily Journal</h2>
                          <p className="text-gray-600">December 7, 2024</p>
                        </div>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                          <Save className="w-4 h-4 mr-2" />
                          Save & Publish
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex-1 p-6 bg-gray-50">
                    <div className="h-full">
                      <Textarea
                        placeholder={
                          selectedTradeData
                            ? `Write your analysis and notes for ${selectedTradeData.pair} trade...\n\nReflect on:\n• Entry and exit decisions\n• Market conditions\n• Emotions during the trade\n• Lessons learned\n• What you'd do differently`
                            : "Start writing your journal entry... \n\nYou can reflect on your trades, market analysis, emotions, lessons learned, or any insights from today's trading session.\n\nIf you've selected a trade from the left panel, you can reference it directly in your notes."
                        }
                        value={journalContent}
                        onChange={(e) => setJournalContent(e.target.value)}
                        className="h-full resize-none bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  {/* Bottom Status Bar */}
                  <div className="px-6 py-3 border-t border-gray-200 bg-white">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-4">
                        <span>Words: {journalContent.split(" ").filter((word) => word.length > 0).length}</span>
                        <span>Characters: {journalContent.length}</span>
                        {selectedTrade && <span className="text-blue-600">• Trade #{selectedTrade} referenced</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Auto-saved</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
