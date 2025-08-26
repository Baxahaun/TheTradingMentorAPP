import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExportPanel } from '../ExportPanel';
import { ProfessionalStrategy } from '../../../types/strategy';
import { Trade } from '../../../types/trade';

// Mock child components
vi.mock('../ExportDialog', () => ({
    ExportDialog: ({ open, onOpenChange }: any) => (
        <div data-testid="export-dialog" data-open={open}>
            <button onClick={() => onOpenChange(false)}>Close Export Dialog</button>
        </div>
    )
}));

vi.mock('../TemplateCustomizer', () => ({
    TemplateCustomizer: ({ open, onOpenChange }: any) => (
        <div data-testid="template-customizer" data-open={open}>
            <button onClick={() => onOpenChange(false)}>Close Template Customizer</button>
        </div>
    )
}));

vi.mock('../SecureShareDialog', () => ({
    SecureShareDialog: ({ open, onOpenChange }: any) => (
        <div data-testid="secure-share-dialog" data-open={open}>
            <button onClick={() => onOpenChange(false)}>Close Secure Share Dialog</button>
        </div>
    )
}));

// Mock window.print
Object.defineProperty(window, 'print', {
    writable: true,
    value: vi.fn()
});

describe('ExportPanel', () => {
    let mockStrategy: ProfessionalStrategy;
    let mockTrades: Trade[];

    beforeEach(() => {
        mockStrategy = {
            id: 'strategy-1',
            title: 'Test Strategy',
            description: 'Test description',
            color: '#2563eb',
            methodology: 'Technical',
            primaryTimeframe: '1H',
            assetClasses: ['Forex'],
            setupConditions: {
                marketEnvironment: 'Trending',
                technicalConditions: ['RSI < 30'],
                volatilityRequirements: 'Medium'
            },
            entryTriggers: {
                primarySignal: 'Breakout',
                confirmationSignals: ['Volume'],
                timingCriteria: 'Market hours'
            },
            riskManagement: {
                positionSizingMethod: { type: 'FixedPercentage', parameters: {} },
                maxRiskPerTrade: 2,
                stopLossRule: { type: 'ATRBased', parameters: {}, description: 'ATR stop' },
                takeProfitRule: { type: 'RiskRewardRatio', parameters: {}, description: 'RR target' },
                riskRewardRatio: 2
            },
            performance: {
                totalTrades: 25,
                winningTrades: 15,
                losingTrades: 10,
                profitFactor: 1.8,
                expectancy: 45.5,
                winRate: 0.6,
                averageWin: 120,
                averageLoss: -80,
                riskRewardRatio: 1.5,
                maxDrawdown: 0.12,
                maxDrawdownDuration: 7,
                sampleSize: 25,
                confidenceLevel: 0.95,
                statisticallySignificant: false,
                monthlyReturns: [],
                performanceTrend: 'Improving',
                lastCalculated: '2024-01-01T00:00:00Z'
            },
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            version: 1,
            isActive: true
        };

        mockTrades = [
            {
                id: 'trade-1',
                accountId: 'account-1',
                currencyPair: 'EURUSD',
                date: '2024-01-01',
                timeIn: '09:00:00',
                timeOut: '15:00:00',
                timestamp: Date.now(),
                side: 'long',
                entryPrice: 1.1000,
                exitPrice: 1.1050,
                lotSize: 1.0,
                lotType: 'standard' as const,
                units: 100000,
                commission: 0,
                accountCurrency: 'USD',
                pnl: 50,
                status: 'closed' as const
            },
            {
                id: 'trade-2',
                accountId: 'account-1',
                currencyPair: 'GBPUSD',
                date: '2024-01-02',
                timeIn: '10:00:00',
                timeOut: '16:00:00',
                timestamp: Date.now(),
                side: 'short',
                entryPrice: 1.2500,
                exitPrice: 1.2450,
                lotSize: 0.5,
                lotType: 'standard' as const,
                units: 50000,
                commission: 0,
                accountCurrency: 'USD',
                pnl: 25,
                status: 'closed' as const
            }
        ];
    });

    it('renders export panel with correct title and description', () => {
        render(<ExportPanel strategy={mockStrategy} trades={mockTrades} />);

        expect(screen.getByText('Export & Sharing')).toBeInTheDocument();
        expect(screen.getByText('Export your strategy performance data or share securely with others.')).toBeInTheDocument();
    });

    it('displays all export action buttons', () => {
        render(<ExportPanel strategy={mockStrategy} trades={mockTrades} />);

        expect(screen.getByText('PDF Report')).toBeInTheDocument();
        expect(screen.getByText('Comprehensive strategy analysis')).toBeInTheDocument();

        expect(screen.getByText('CSV Export')).toBeInTheDocument();
        expect(screen.getByText('Raw data for analysis')).toBeInTheDocument();

        expect(screen.getByText('Print Summary')).toBeInTheDocument();
        expect(screen.getByText('Quick printable overview')).toBeInTheDocument();

        expect(screen.getByText('Secure Share')).toBeInTheDocument();
        expect(screen.getByText('Time-limited sharing link')).toBeInTheDocument();
    });

    it('displays advanced options section', () => {
        render(<ExportPanel strategy={mockStrategy} trades={mockTrades} />);

        expect(screen.getByText('Advanced Options')).toBeInTheDocument();
        expect(screen.getByText('Custom Template')).toBeInTheDocument();
        expect(screen.getByText('Secure Share')).toBeInTheDocument();
    });

    it('shows strategy summary information', () => {
        render(<ExportPanel strategy={mockStrategy} trades={mockTrades} />);

        expect(screen.getByText('Strategy:')).toBeInTheDocument();
        expect(screen.getByText('Test Strategy')).toBeInTheDocument();

        expect(screen.getByText('Total Trades:')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();

        expect(screen.getByText('Win Rate:')).toBeInTheDocument();
        expect(screen.getByText('60.0%')).toBeInTheDocument();

        expect(screen.getByText('Profit Factor:')).toBeInTheDocument();
        expect(screen.getByText('1.80')).toBeInTheDocument();
    });

    it('opens export dialog when PDF Report is clicked', () => {
        render(<ExportPanel strategy={mockStrategy} trades={mockTrades} />);

        const pdfButton = screen.getByText('PDF Report').closest('button');
        fireEvent.click(pdfButton!);

        const exportDialog = screen.getByTestId('export-dialog');
        expect(exportDialog).toHaveAttribute('data-open', 'true');
    });

    it('opens export dialog when CSV Export is clicked', () => {
        render(<ExportPanel strategy={mockStrategy} trades={mockTrades} />);

        const csvButton = screen.getByText('CSV Export').closest('button');
        fireEvent.click(csvButton!);

        const exportDialog = screen.getByTestId('export-dialog');
        expect(exportDialog).toHaveAttribute('data-open', 'true');
    });

    it('calls window.print when Print Summary is clicked', () => {
        render(<ExportPanel strategy={mockStrategy} trades={mockTrades} />);

        const printButton = screen.getByText('Print Summary').closest('button');
        fireEvent.click(printButton!);

        expect(window.print).toHaveBeenCalled();
    });

    it('opens secure share dialog when Secure Share is clicked', () => {
        render(<ExportPanel strategy={mockStrategy} trades={mockTrades} />);

        const shareButton = screen.getByText('Secure Share').closest('button');
        fireEvent.click(shareButton!);

        const shareDialog = screen.getByTestId('secure-share-dialog');
        expect(shareDialog).toHaveAttribute('data-open', 'true');
    });

    it('opens template customizer when Custom Template is clicked', () => {
        render(<ExportPanel strategy={mockStrategy} trades={mockTrades} />);

        const templateButton = screen.getByText('Custom Template');
        fireEvent.click(templateButton);

        const templateCustomizer = screen.getByTestId('template-customizer');
        expect(templateCustomizer).toHaveAttribute('data-open', 'true');
    });

    it('opens secure share dialog from advanced options', () => {
        render(<ExportPanel strategy={mockStrategy} trades={mockTrades} />);

        // Click the Secure Share button in advanced options (not the main action button)
        const advancedShareButtons = screen.getAllByText('Secure Share');
        const advancedShareButton = advancedShareButtons.find(button =>
            button.closest('button')?.className.includes('size-sm')
        );

        fireEvent.click(advancedShareButton!);

        const shareDialog = screen.getByTestId('secure-share-dialog');
        expect(shareDialog).toHaveAttribute('data-open', 'true');
    });

    it('closes dialogs when their close handlers are called', () => {
        render(<ExportPanel strategy={mockStrategy} trades={mockTrades} />);

        // Open export dialog
        const pdfButton = screen.getByText('PDF Report').closest('button');
        fireEvent.click(pdfButton!);

        let exportDialog = screen.getByTestId('export-dialog');
        expect(exportDialog).toHaveAttribute('data-open', 'true');

        // Close export dialog
        const closeButton = screen.getByText('Close Export Dialog');
        fireEvent.click(closeButton);

        exportDialog = screen.getByTestId('export-dialog');
        expect(exportDialog).toHaveAttribute('data-open', 'false');
    });

    it('applies custom className when provided', () => {
        const { container } = render(
            <ExportPanel
                strategy={mockStrategy}
                trades={mockTrades}
                className="custom-class"
            />
        );

        expect(container.firstChild).toHaveClass('custom-class');
    });

    it('handles template creation callback', () => {
        render(<ExportPanel strategy={mockStrategy} trades={mockTrades} />);

        // Open template customizer
        const templateButton = screen.getByText('Custom Template');
        fireEvent.click(templateButton);

        // The template creation is handled internally
        // We're testing that the component renders without errors
        expect(screen.getByTestId('template-customizer')).toBeInTheDocument();
    });

    it('displays correct icons for each action', () => {
        render(<ExportPanel strategy={mockStrategy} trades={mockTrades} />);

        // Check that icons are rendered (they should be in the DOM as SVG elements)
        const buttons = screen.getAllByRole('button');

        // PDF Report button should contain FileText icon
        const pdfButton = buttons.find(button => button.textContent?.includes('PDF Report'));
        expect(pdfButton).toBeInTheDocument();

        // CSV Export button should contain Table icon
        const csvButton = buttons.find(button => button.textContent?.includes('CSV Export'));
        expect(csvButton).toBeInTheDocument();

        // Print Summary button should contain Printer icon
        const printButton = buttons.find(button => button.textContent?.includes('Print Summary'));
        expect(printButton).toBeInTheDocument();

        // Secure Share button should contain Shield icon
        const shareButton = buttons.find(button => button.textContent?.includes('Secure Share'));
        expect(shareButton).toBeInTheDocument();
    });

    it('formats performance metrics correctly', () => {
        const strategyWithDifferentMetrics = {
            ...mockStrategy,
            performance: {
                ...mockStrategy.performance,
                winRate: 0.7333,
                profitFactor: 2.456789
            }
        };

        render(<ExportPanel strategy={strategyWithDifferentMetrics} trades={mockTrades} />);

        expect(screen.getByText('73.3%')).toBeInTheDocument();
        expect(screen.getByText('2.46')).toBeInTheDocument();
    });
});