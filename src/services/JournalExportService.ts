import { Trade } from '../types/trade';
import { CURRENT_TERMINOLOGY } from '../lib/terminologyConfig';

/**
 * Service for exporting trading journal data with futures terminology
 */
export class JournalExportService {
  /**
   * Export trades to CSV format with futures terminology
   */
  static exportToCSV(trades: Trade[], filename?: string): void {
    const csvHeaders = [
      'Date',
      CURRENT_TERMINOLOGY.instrumentLabel,
      'Side',
      'Entry Price',
      'Exit Price',
      CURRENT_TERMINOLOGY.positionSizeLabel,
      'Stop Loss',
      'Take Profit',
      'Commission',
      `P&L (${CURRENT_TERMINOLOGY.priceMovementUnit})`,
      'P&L ($)',
      'Strategy',
      'Notes',
      'Tags',
      'Confidence',
      'Emotions'
    ].join(',');

    const csvData = trades.map(trade => [
      trade.date,
      trade.currencyPair || '',
      trade.side,
      trade.entryPrice || '',
      trade.exitPrice || '',
      trade.lotSize || '',
      trade.stopLoss || '',
      trade.takeProfit || '',
      trade.commission || '',
      trade.pips || '',
      trade.pnl || '',
      trade.strategy || '',
      trade.notes || '',
      Array.isArray(trade.tags) ? trade.tags.join('; ') : '',
      trade.confidence || '',
      trade.emotions || ''
    ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n');

    const csvContent = `${csvHeaders}\n${csvData}`;
    this.downloadFile(csvContent, 'text/csv', filename || `trading-journal-${new Date().toISOString().split('T')[0]}.csv`);
  }

  /**
   * Export trades to JSON format with futures terminology
   */
  static exportToJSON(trades: Trade[], filename?: string): void {
    const exportData = {
      exportDate: new Date().toISOString(),
      terminology: CURRENT_TERMINOLOGY.instrumentLabel + ' Trading',
      totalTrades: trades.length,
      trades: trades.map(trade => ({
        date: trade.date,
        [CURRENT_TERMINOLOGY.instrumentLabel.toLowerCase()]: trade.currencyPair,
        side: trade.side,
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice,
        [CURRENT_TERMINOLOGY.positionSizeLabel.toLowerCase().replace(' ', '')]: trade.lotSize,
        stopLoss: trade.stopLoss,
        takeProfit: trade.takeProfit,
        commission: trade.commission,
        [CURRENT_TERMINOLOGY.priceMovementUnit]: trade.pips,
        pnl: trade.pnl,
        strategy: trade.strategy,
        notes: trade.notes,
        tags: trade.tags,
        confidence: trade.confidence,
        emotions: trade.emotions
      }))
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    this.downloadFile(jsonContent, 'application/json', filename || `trading-journal-${new Date().toISOString().split('T')[0]}.json`);
  }

  /**
   * Generate HTML report with futures terminology
   */
  static exportToHTML(trades: Trade[], filename?: string): void {
    const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const totalTrades = trades.length;
    const winningTrades = trades.filter(trade => (trade.pnl || 0) > 0).length;
    const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : '0';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>${CURRENT_TERMINOLOGY.instrumentLabel} Trading Journal Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #2563eb; }
        .summary { background: #f3f4f6; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .positive { color: #16a34a; }
        .negative { color: #dc2626; }
        .summary-item { display: inline-block; margin-right: 20px; margin-bottom: 10px; }
    </style>
</head>
<body>
    <h1>${CURRENT_TERMINOLOGY.instrumentLabel} Trading Journal Report</h1>
    <p><strong>Export Date:</strong> ${new Date().toLocaleString()}</p>
    <p><strong>Terminology:</strong> ${CURRENT_TERMINOLOGY.instrumentLabel} Trading</p>

    <div class="summary">
        <h2>Summary Statistics</h2>
        <div class="summary-item"><strong>Total ${CURRENT_TERMINOLOGY.instrumentLabel} Trades:</strong> ${totalTrades}</div>
        <div class="summary-item"><strong>Winning Trades:</strong> ${winningTrades}</div>
        <div class="summary-item"><strong>Win Rate:</strong> ${winRate}%</div>
        <div class="summary-item"><strong>Total P&L:</strong> <span class="${totalPnL >= 0 ? 'positive' : 'negative'}">$${totalPnL.toFixed(2)}</span></div>
    </div>

    <h2>Trade Details</h2>
    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>${CURRENT_TERMINOLOGY.instrumentLabel}</th>
                <th>Side</th>
                <th>Entry Price</th>
                <th>Exit Price</th>
                <th>${CURRENT_TERMINOLOGY.positionSizeLabel}</th>
                <th>P&L ($)</th>
                <th>${CURRENT_TERMINOLOGY.priceMovementUnit}</th>
                <th>Strategy</th>
            </tr>
        </thead>
        <tbody>
            ${trades.map(trade => `
                <tr>
                    <td>${trade.date}</td>
                    <td>${trade.currencyPair || ''}</td>
                    <td>${trade.side}</td>
                    <td>${trade.entryPrice || ''}</td>
                    <td>${trade.exitPrice || ''}</td>
                    <td>${trade.lotSize || ''}</td>
                    <td class="${(trade.pnl || 0) >= 0 ? 'positive' : 'negative'}">$${(trade.pnl || 0).toFixed(2)}</td>
                    <td>${trade.pips || ''}</td>
                    <td>${trade.strategy || ''}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>`;

    this.downloadFile(htmlContent, 'text/html', filename || `trading-journal-${new Date().toISOString().split('T')[0]}.html`);
  }

  /**
   * Generate PDF-ready HTML with futures terminology
   */
  static generatePDFContent(trades: Trade[]): string {
    const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const totalTrades = trades.length;
    const winningTrades = trades.filter(trade => (trade.pnl || 0) > 0).length;
    const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : '0';

    return `
<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #2563eb; text-align: center;">${CURRENT_TERMINOLOGY.instrumentLabel} Trading Journal Report</h1>
    <p style="text-align: center;"><strong>Export Date:</strong> ${new Date().toLocaleString()}</p>
    <p style="text-align: center;"><strong>Terminology:</strong> ${CURRENT_TERMINOLOGY.instrumentLabel} Trading</p>

    <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h2>Summary Statistics</h2>
        <p><strong>Total ${CURRENT_TERMINOLOGY.instrumentLabel} Trades:</strong> ${totalTrades}</p>
        <p><strong>Winning Trades:</strong> ${winningTrades}</p>
        <p><strong>Win Rate:</strong> ${winRate}%</p>
        <p><strong>Total P&L:</strong> <span style="color: ${(totalPnL >= 0 ? '#16a34a' : '#dc2626')}">$${totalPnL.toFixed(2)}</span></p>
    </div>

    <h2>Trade Details</h2>
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
            <tr style="background-color: #f8f9fa;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Date</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">${CURRENT_TERMINOLOGY.instrumentLabel}</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Side</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Entry Price</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Exit Price</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">${CURRENT_TERMINOLOGY.positionSizeLabel}</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">P&L ($)</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">${CURRENT_TERMINOLOGY.priceMovementUnit}</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Strategy</th>
            </tr>
        </thead>
        <tbody>
            ${trades.map(trade => `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">${trade.date}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${trade.currencyPair || ''}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${trade.side}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${trade.entryPrice || ''}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${trade.exitPrice || ''}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${trade.lotSize || ''}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; color: ${(trade.pnl || 0) >= 0 ? '#16a34a' : '#dc2626'};">$${(trade.pnl || 0).toFixed(2)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${trade.pips || ''}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${trade.strategy || ''}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
</div>`;
  }

  /**
   * Private method to handle file download
   */
  private static downloadFile(content: string, mimeType: string, filename: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Get export summary with futures terminology
   */
  static getExportSummary(trades: Trade[]): {
    totalTrades: number;
    totalPnL: number;
    totalPips: number;
    winRate: number;
    averageWin: number;
    averageLoss: number;
    terminology: string;
  } {
    const totalTrades = trades.length;
    const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const totalPips = trades.reduce((sum, trade) => sum + (trade.pips || 0), 0);

    const winningTrades = trades.filter(trade => (trade.pnl || 0) > 0);
    const losingTrades = trades.filter(trade => (trade.pnl || 0) < 0);

    const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
    const averageWin = winningTrades.length > 0
      ? winningTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0) / winningTrades.length
      : 0;
    const averageLoss = losingTrades.length > 0
      ? Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0) / losingTrades.length)
      : 0;

    return {
      totalTrades,
      totalPnL,
      totalPips,
      winRate,
      averageWin,
      averageLoss,
      terminology: CURRENT_TERMINOLOGY.instrumentLabel + ' Trading'
    };
  }
}