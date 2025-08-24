import React from 'react';
import { EnhancedTrade, TradeReviewData, PerformanceMetrics } from '../../types/tradeReview';

interface PrintableTradeReportProps {
  trade: EnhancedTrade;
  includeCharts?: boolean;
  includeNotes?: boolean;
  includePerformanceMetrics?: boolean;
  includeReviewWorkflow?: boolean;
  customTitle?: string;
}

export const PrintableTradeReport: React.FC<PrintableTradeReportProps> = ({
  trade,
  includeCharts = true,
  includeNotes = true,
  includePerformanceMetrics = true,
  includeReviewWorkflow = true,
  customTitle
}) => {
  const reviewData = trade.reviewData;
  const performanceMetrics = reviewData?.performanceMetrics;
  const notes = reviewData?.notes;
  const charts = reviewData?.charts;
  const workflow = reviewData?.reviewWorkflow;

  const formatCurrency = (value: number | undefined, currency: string = 'USD') => {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(value);
  };

  const formatPercentage = (value: number | undefined) => {
    if (value === undefined || value === null) return 'N/A';
    return `${value.toFixed(2)}%`;
  };

  const formatDuration = (hours: number | undefined) => {
    if (hours === undefined || hours === null) return 'N/A';
    if (hours < 24) return `${hours.toFixed(1)} hours`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days} days, ${remainingHours.toFixed(1)} hours`;
  };

  return (
    <div className="print-report">
      <style jsx>{`
        @media print {
          .print-report {
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.4;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 20px;
          }
          
          .page-break {
            page-break-before: always;
          }
          
          .no-break {
            page-break-inside: avoid;
          }
          
          .header {
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          
          .section {
            margin-bottom: 25px;
          }
          
          .section-title {
            font-size: 14pt;
            font-weight: bold;
            color: #000;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
            margin-bottom: 10px;
          }
          
          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          
          .grid-3 {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 15px;
          }
          
          .metric-box {
            border: 1px solid #ddd;
            padding: 10px;
            margin-bottom: 10px;
          }
          
          .metric-label {
            font-weight: bold;
            font-size: 10pt;
            color: #666;
            margin-bottom: 2px;
          }
          
          .metric-value {
            font-size: 12pt;
            color: #000;
          }
          
          .notes-section {
            background: #f9f9f9;
            border: 1px solid #ddd;
            padding: 15px;
            margin-bottom: 15px;
          }
          
          .notes-title {
            font-weight: bold;
            margin-bottom: 8px;
            font-size: 11pt;
          }
          
          .notes-content {
            font-size: 10pt;
            line-height: 1.5;
          }
          
          .chart-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }
          
          .chart-item {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: center;
            background: #f5f5f5;
          }
          
          .workflow-stage {
            display: flex;
            align-items: center;
            padding: 8px;
            border-bottom: 1px solid #eee;
          }
          
          .workflow-stage:last-child {
            border-bottom: none;
          }
          
          .stage-status {
            width: 20px;
            margin-right: 10px;
            font-weight: bold;
          }
          
          .footer {
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            text-align: center;
            font-size: 9pt;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 10px;
          }
        }
        
        @media screen {
          .print-report {
            max-width: 8.5in;
            margin: 0 auto;
            padding: 1in;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.4;
          }
        }
      `}</style>

      {/* Header */}
      <div className="header no-break">
        <h1 style={{ margin: 0, fontSize: '18pt', fontWeight: 'bold' }}>
          {customTitle || 'Trade Review Report'}
        </h1>
        <div style={{ marginTop: '10px', fontSize: '11pt' }}>
          <strong>Trade ID:</strong> {trade.id} | 
          <strong> Currency Pair:</strong> {trade.currencyPair} | 
          <strong> Date:</strong> {new Date(trade.date).toLocaleDateString()}
        </div>
        <div style={{ marginTop: '5px', fontSize: '10pt', color: '#666' }}>
          Generated on {new Date().toLocaleString()}
        </div>
      </div>

      {/* Trade Summary */}
      <div className="section no-break">
        <h2 className="section-title">Trade Summary</h2>
        <div className="grid-3">
          <div className="metric-box">
            <div className="metric-label">Side</div>
            <div className="metric-value">{trade.side.toUpperCase()}</div>
          </div>
          <div className="metric-box">
            <div className="metric-label">Entry Price</div>
            <div className="metric-value">{trade.entryPrice}</div>
          </div>
          <div className="metric-box">
            <div className="metric-label">Exit Price</div>
            <div className="metric-value">{trade.exitPrice || 'N/A'}</div>
          </div>
          <div className="metric-box">
            <div className="metric-label">Lot Size</div>
            <div className="metric-value">{trade.lotSize} {trade.lotType}</div>
          </div>
          <div className="metric-box">
            <div className="metric-label">P&L</div>
            <div className="metric-value">{formatCurrency(trade.pnl, trade.accountCurrency)}</div>
          </div>
          <div className="metric-box">
            <div className="metric-label">Status</div>
            <div className="metric-value">{trade.status.toUpperCase()}</div>
          </div>
        </div>

        <div className="grid-2" style={{ marginTop: '15px' }}>
          <div className="metric-box">
            <div className="metric-label">Entry Time</div>
            <div className="metric-value">{trade.timeIn}</div>
          </div>
          <div className="metric-box">
            <div className="metric-label">Exit Time</div>
            <div className="metric-value">{trade.timeOut || 'N/A'}</div>
          </div>
          <div className="metric-box">
            <div className="metric-label">Stop Loss</div>
            <div className="metric-value">{trade.stopLoss || 'N/A'}</div>
          </div>
          <div className="metric-box">
            <div className="metric-label">Take Profit</div>
            <div className="metric-value">{trade.takeProfit || 'N/A'}</div>
          </div>
          <div className="metric-box">
            <div className="metric-label">Commission</div>
            <div className="metric-value">{formatCurrency(trade.commission, trade.accountCurrency)}</div>
          </div>
          <div className="metric-box">
            <div className="metric-label">Swap</div>
            <div className="metric-value">{formatCurrency(trade.swap, trade.accountCurrency)}</div>
          </div>
        </div>

        {trade.tags && trade.tags.length > 0 && (
          <div style={{ marginTop: '15px' }}>
            <div className="metric-label">Tags</div>
            <div className="metric-value">{trade.tags.join(', ')}</div>
          </div>
        )}
      </div>

      {/* Performance Metrics */}
      {includePerformanceMetrics && performanceMetrics && (
        <div className="section no-break">
          <h2 className="section-title">Performance Analysis</h2>
          <div className="grid-3">
            <div className="metric-box">
              <div className="metric-label">R-Multiple</div>
              <div className="metric-value">{performanceMetrics.rMultiple.toFixed(2)}R</div>
            </div>
            <div className="metric-box">
              <div className="metric-label">Return Percentage</div>
              <div className="metric-value">{formatPercentage(performanceMetrics.returnPercentage)}</div>
            </div>
            <div className="metric-box">
              <div className="metric-label">Risk/Reward Ratio</div>
              <div className="metric-value">1:{performanceMetrics.riskRewardRatio.toFixed(2)}</div>
            </div>
            <div className="metric-box">
              <div className="metric-label">Hold Duration</div>
              <div className="metric-value">{formatDuration(performanceMetrics.holdDuration)}</div>
            </div>
            <div className="metric-box">
              <div className="metric-label">Efficiency Score</div>
              <div className="metric-value">{performanceMetrics.efficiency.toFixed(1)}/100</div>
            </div>
            {performanceMetrics.sharpeRatio && (
              <div className="metric-box">
                <div className="metric-label">Sharpe Ratio</div>
                <div className="metric-value">{performanceMetrics.sharpeRatio.toFixed(2)}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trade Notes */}
      {includeNotes && notes && (
        <div className="section">
          <h2 className="section-title">Trade Notes</h2>
          
          {notes.preTradeAnalysis && (
            <div className="notes-section no-break">
              <div className="notes-title">Pre-Trade Analysis</div>
              <div className="notes-content">{notes.preTradeAnalysis}</div>
            </div>
          )}
          
          {notes.executionNotes && (
            <div className="notes-section no-break">
              <div className="notes-title">Execution Notes</div>
              <div className="notes-content">{notes.executionNotes}</div>
            </div>
          )}
          
          {notes.postTradeReflection && (
            <div className="notes-section no-break">
              <div className="notes-title">Post-Trade Reflection</div>
              <div className="notes-content">{notes.postTradeReflection}</div>
            </div>
          )}
          
          {notes.lessonsLearned && (
            <div className="notes-section no-break">
              <div className="notes-title">Lessons Learned</div>
              <div className="notes-content">{notes.lessonsLearned}</div>
            </div>
          )}
          
          {notes.generalNotes && (
            <div className="notes-section no-break">
              <div className="notes-title">General Notes</div>
              <div className="notes-content">{notes.generalNotes}</div>
            </div>
          )}
        </div>
      )}

      {/* Charts Information */}
      {includeCharts && charts && charts.length > 0 && (
        <div className="section">
          <h2 className="section-title">Charts ({charts.length})</h2>
          <div className="chart-grid">
            {charts.map((chart, index) => (
              <div key={chart.id} className="chart-item no-break">
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  Chart {index + 1}: {chart.type.replace('_', ' ').toUpperCase()}
                </div>
                <div style={{ fontSize: '10pt', color: '#666' }}>
                  Timeframe: {chart.timeframe}<br/>
                  Uploaded: {new Date(chart.uploadedAt).toLocaleDateString()}<br/>
                  {chart.annotations && chart.annotations.length > 0 && (
                    <>Annotations: {chart.annotations.length}<br/></>
                  )}
                  {chart.description && (
                    <em>{chart.description}</em>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Workflow */}
      {includeReviewWorkflow && workflow && (
        <div className="section">
          <h2 className="section-title">Review Workflow</h2>
          <div className="grid-2" style={{ marginBottom: '15px' }}>
            <div className="metric-box">
              <div className="metric-label">Overall Progress</div>
              <div className="metric-value">{workflow.overallProgress}%</div>
            </div>
            <div className="metric-box">
              <div className="metric-label">Review Status</div>
              <div className="metric-value">
                {workflow.completedAt ? 'Completed' : 'In Progress'}
              </div>
            </div>
            <div className="metric-box">
              <div className="metric-label">Started</div>
              <div className="metric-value">
                {new Date(workflow.startedAt).toLocaleDateString()}
              </div>
            </div>
            {workflow.completedAt && (
              <div className="metric-box">
                <div className="metric-label">Completed</div>
                <div className="metric-value">
                  {new Date(workflow.completedAt).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>

          <div style={{ border: '1px solid #ddd', padding: '10px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Review Stages</div>
            {workflow.stages.map((stage, index) => (
              <div key={stage.id} className="workflow-stage">
                <div className="stage-status">
                  {stage.completed ? '✓' : '○'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold' }}>{stage.name}</div>
                  <div style={{ fontSize: '10pt', color: '#666' }}>
                    {stage.description}
                  </div>
                  {stage.notes && (
                    <div style={{ fontSize: '10pt', fontStyle: 'italic', marginTop: '3px' }}>
                      {stage.notes}
                    </div>
                  )}
                </div>
                {stage.completedAt && (
                  <div style={{ fontSize: '9pt', color: '#666' }}>
                    {new Date(stage.completedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strategy and Market Context */}
      {(trade.strategy || trade.marketConditions || trade.timeframe || trade.confidence) && (
        <div className="section no-break">
          <h2 className="section-title">Strategy & Market Context</h2>
          <div className="grid-2">
            {trade.strategy && (
              <div className="metric-box">
                <div className="metric-label">Strategy</div>
                <div className="metric-value">{trade.strategy}</div>
              </div>
            )}
            {trade.marketConditions && (
              <div className="metric-box">
                <div className="metric-label">Market Conditions</div>
                <div className="metric-value">{trade.marketConditions}</div>
              </div>
            )}
            {trade.timeframe && (
              <div className="metric-box">
                <div className="metric-label">Timeframe</div>
                <div className="metric-value">{trade.timeframe}</div>
              </div>
            )}
            {trade.confidence && (
              <div className="metric-box">
                <div className="metric-label">Confidence Level</div>
                <div className="metric-value">{trade.confidence}/10</div>
              </div>
            )}
          </div>
          
          {trade.emotions && (
            <div style={{ marginTop: '10px' }}>
              <div className="metric-label">Emotions</div>
              <div className="metric-value">{trade.emotions}</div>
            </div>
          )}
          
          {trade.notes && (
            <div style={{ marginTop: '10px' }}>
              <div className="metric-label">Original Notes</div>
              <div className="metric-value" style={{ fontSize: '10pt' }}>{trade.notes}</div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="footer">
        Trade Review Report - Generated by Trade Review System - {new Date().toLocaleDateString()}
      </div>
    </div>
  );
};

export default PrintableTradeReport;