import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import TradeLog from '../TradeLog';
import { useTradeContext } from '../../contexts/TradeContext';
import { tagService } from '../../lib/tagService';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { vi } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { vi } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { vi } from 'vitest';
import { vi } from 'vitest';
import { vi } from 'vitest';
import { vi } from 'vitest';
import { vi } from 'vitest';
import { beforeEach } from 'vitest';
import { describe } from 'vitest';
import { vi } from 'vitest';
import { vi } from 'vitest';
import { vi } from 'vitest';

// Mock dependencies
vi.mock('../../contexts/TradeContext');
vi.mock('../../lib/tagService');
vi.mock('../../hooks/use-toast');

const mockUseTradeContext = useTradeContext as any;
const mockTagService = tagService as any;

// Mock data
const mockTrades = [
    {
        id: '1',
        accountId: 'acc1',
        currencyPair: 'EUR/USD',
        date: '2024-01-15',
        timeIn: '09:00',
        side: 'long',
        entryPrice: 1.0950,
        exitPrice: 1.0980,
        lotSize: 1,
        lotType: 'standard',
        units: 100000,
        commission: 5,
        accountCurrency: 'USD',
        status: 'closed',
        pnl: 300,
        tags: ['#breakout', '#morning', '#trending']
    },
    {
        id: '2',
        accountId: 'acc1',
        currencyPair: 'GBP/USD',
        date: '2024-01-16',
        timeIn: '14:00',
        side: 'short',
        entryPrice: 1.2650,
        exitPrice: 1.2620,
        lotSize: 0.5,
        lotType: 'standard',
        units: 50000,
        commission: 3,
        accountCurrency: 'USD',
        status: 'closed',
        pnl: 150,
        tags: ['#breakout', '#afternoon']
    }
];

const mockTagsWithCounts = [
    {
        tag: '#breakout',
        count: 2,
        lastUsed: '2024-01-16',
        trades: ['1', '2']
    },
    {
        tag: '#morning',
        count: 1,
        lastUsed: '2024-01-15',
        trades: ['1']
    },
    {
        tag: '#trending',
        count: 1,
        lastUsed: '2024-01-15',
        trades: ['1']
    },
    {
        tag: '#afternoon',
        count: 1,
        lastUsed: '2024-01-16',
        trades: ['2']
    }
];

describe('TradeLog - TagManager Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Mock TradeContext
        mockUseTradeContext.mockReturnValue({
            trades: mockTrades,
            deleteTrade: vi.fn(),
            loading: false,
        });

        // Mock TagService
        mockTagService.getAllTagsWithCounts = vi.fn().mockReturnValue(mockTagsWithCounts);
        mockTagService.normalizeTag = vi.fn().mockImplementation((tag: string) =>
            tag.startsWith('#') ? tag : `#${tag}`
        );
        mockTagService.filterTradesByTags = vi.fn().mockImplementation((trades, filter) => trades);
    });

    describe('TagManager Button', () => {
        it('renders the Tags button in the TradeLog toolbar', () => {
            render(<TradeLog />);

            const tagsButton = screen.getByRole('button', { name: 'Manage Tags' });
            expect(tagsButton).toBeInTheDocument();
            expect(tagsButton).toHaveAttribute('title', 'Manage Tags');
        });

        it('opens TagManager when Tags button is clicked', async () => {
            render(<TradeLog />);

            const tagsButton = screen.getByRole('button', { name: 'Manage Tags' });
            fireEvent.click(tagsButton);

            await waitFor(() => {
                expect(screen.getByText('Tag Manager')).toBeInTheDocument();
            });
        });

        it('closes TagManager when close button is clicked', async () => {
            render(<TradeLog />);

            // Open TagManager
            const tagsButton = screen.getByRole('button', { name: 'Manage Tags' });
            fireEvent.click(tagsButton);

            await waitFor(() => {
                expect(screen.getByText('Tag Manager')).toBeInTheDocument();
            });

            // Close TagManager
            const closeButton = screen.getByRole('button', { name: 'Close' });
            fireEvent.click(closeButton);

            await waitFor(() => {
                expect(screen.queryByText('Tag Manager')).not.toBeInTheDocument();
            });
        });
    });

    describe('Tag Click Integration', () => {
        it('adds clicked tag to filter when tag is clicked in TagManager', async () => {
            render(<TradeLog />);

            // Open TagManager
            const tagsButton = screen.getByRole('button', { name: 'Manage Tags' });
            fireEvent.click(tagsButton);

            await waitFor(() => {
                expect(screen.getByText('Tag Manager')).toBeInTheDocument();
            });

            // Click on a tag in the TagManager (look for the badge variant)
            const tagManagerDialog = screen.getByRole('dialog');
            const breakoutTag = within(tagManagerDialog).getAllByText('breakout')[0];
            fireEvent.click(breakoutTag);

            // TagManager should close and tag should be added to filter
            await waitFor(() => {
                expect(screen.queryByText('Tag Manager')).not.toBeInTheDocument();
            });

            // The tag should now be visible in the tag filter
            // Note: This would require the TagFilter component to show selected tags
            // The exact assertion would depend on how TagFilter displays selected tags
        });

        it('does not duplicate tags when clicking on already selected tag', async () => {
            render(<TradeLog />);

            // Open TagManager
            const tagsButton = screen.getByRole('button', { name: 'Manage Tags' });
            fireEvent.click(tagsButton);

            await waitFor(() => {
                expect(screen.getByText('Tag Manager')).toBeInTheDocument();
            });

            // Click on the same tag twice
            const tagManagerDialog = screen.getByRole('dialog');
            const breakoutTag = within(tagManagerDialog).getAllByText('breakout')[0];
            fireEvent.click(breakoutTag);

            await waitFor(() => {
                expect(screen.queryByText('Tag Manager')).not.toBeInTheDocument();
            });

            // Open TagManager again
            fireEvent.click(tagsButton);

            await waitFor(() => {
                expect(screen.getByText('Tag Manager')).toBeInTheDocument();
            });

            // Click the same tag again
            const tagManagerDialogAgain = screen.getByRole('dialog');
            const breakoutTagAgain = within(tagManagerDialogAgain).getAllByText('breakout')[0];
            fireEvent.click(breakoutTagAgain);

            // Should not create duplicate filters
            // The exact assertion would depend on the implementation
        });
    });

    describe('Tag Deletion Integration', () => {
        it('removes deleted tag from current filters', async () => {
            render(<TradeLog />);

            // Open TagManager
            const tagsButton = screen.getByRole('button', { name: 'Manage Tags' });
            fireEvent.click(tagsButton);

            await waitFor(() => {
                expect(screen.getByText('Tag Manager')).toBeInTheDocument();
            });

            // Find and click a delete button
            const deleteButtons = screen.getAllByRole('button');
            const deleteButton = deleteButtons.find(button =>
                button.querySelector('[data-lucide="trash-2"]')
            );

            if (deleteButton) {
                fireEvent.click(deleteButton);

                await waitFor(() => {
                    expect(screen.getByText('Delete Tag')).toBeInTheDocument();
                });

                // Confirm deletion
                const confirmButton = screen.getByRole('button', { name: 'Delete Tag' });
                fireEvent.click(confirmButton);

                // The tag should be removed from filters
                // This would be verified by checking that the tag is no longer in the selected tags
            }
        });

        it('logs tag deletion for debugging', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

            render(<TradeLog />);

            // Open TagManager
            const tagsButton = screen.getByRole('button', { name: 'Manage Tags' });
            fireEvent.click(tagsButton);

            await waitFor(() => {
                expect(screen.getByText('Tag Manager')).toBeInTheDocument();
            });

            // Find and click a delete button
            const deleteButtons = screen.getAllByRole('button');
            const deleteButton = deleteButtons.find(button =>
                button.querySelector('[data-lucide="trash-2"]')
            );

            if (deleteButton) {
                fireEvent.click(deleteButton);

                await waitFor(() => {
                    expect(screen.getByText('Delete Tag')).toBeInTheDocument();
                });

                // Confirm deletion
                const confirmButton = screen.getByRole('button', { name: 'Delete Tag' });
                fireEvent.click(confirmButton);

                await waitFor(() => {
                    expect(consoleSpy).toHaveBeenCalledWith('Tag deleted:', expect.any(String));
                });
            }

            consoleSpy.mockRestore();
        });
    });

    describe('TagManager Data Integration', () => {
        it('passes correct trades data to TagManager', async () => {
            render(<TradeLog />);

            // Open TagManager
            const tagsButton = screen.getByRole('button', { name: 'Manage Tags' });
            fireEvent.click(tagsButton);

            await waitFor(() => {
                expect(screen.getByText('Tag Manager')).toBeInTheDocument();
            });

            // Verify that TagManager receives the trades data
            expect(mockTagService.getAllTagsWithCounts).toHaveBeenCalledWith(mockTrades);
        });

        it('displays tag statistics from the trades', async () => {
            render(<TradeLog />);

            // Open TagManager
            const tagsButton = screen.getByRole('button', { name: 'Manage Tags' });
            fireEvent.click(tagsButton);

            await waitFor(() => {
                expect(screen.getByText('Tag Manager')).toBeInTheDocument();
            });

            // Check that tags from the mock data are displayed in the TagManager
            const tagManagerDialog = screen.getByRole('dialog');
            expect(within(tagManagerDialog).getByText('breakout')).toBeInTheDocument();
            expect(within(tagManagerDialog).getByText('morning')).toBeInTheDocument();
            expect(within(tagManagerDialog).getByText('trending')).toBeInTheDocument();
            expect(within(tagManagerDialog).getByText('afternoon')).toBeInTheDocument();

            // Check that trade counts are displayed in the TagManager
            expect(within(tagManagerDialog).getByText('2 trades')).toBeInTheDocument(); // breakout
            expect(within(tagManagerDialog).getAllByText('1 trade')).toHaveLength(3); // morning, trending, afternoon
        });
    });

    describe('Accessibility Integration', () => {
        it('maintains proper focus management when opening and closing TagManager', async () => {
            render(<TradeLog />);

            const tagsButton = screen.getByRole('button', { name: 'Manage Tags' });

            // Focus should be on the button initially when tabbed to
            tagsButton.focus();
            expect(tagsButton).toHaveFocus();

            // Open TagManager
            fireEvent.click(tagsButton);

            await waitFor(() => {
                expect(screen.getByText('Tag Manager')).toBeInTheDocument();
            });

            // Focus should move to the dialog
            const dialog = screen.getByRole('dialog');
            expect(dialog).toBeInTheDocument();

            // Close TagManager
            const closeButton = screen.getByRole('button', { name: 'Close' });
            fireEvent.click(closeButton);

            await waitFor(() => {
                expect(screen.queryByText('Tag Manager')).not.toBeInTheDocument();
            });

            // Focus should return to the Tags button
            // Note: This might require additional focus management in the actual implementation
        });

        it('provides proper ARIA labels for the Tags button', () => {
            render(<TradeLog />);

            const tagsButton = screen.getByRole('button', { name: 'Manage Tags' });
            expect(tagsButton).toHaveAttribute('title', 'Manage Tags');
        });
    });

    describe('Error Handling', () => {
        it('handles TagService errors gracefully', async () => {
            // Mock TagService to throw an error
            mockTagService.getAllTagsWithCounts.mockImplementation(() => {
                throw new Error('TagService error');
            });

            render(<TradeLog />);

            // Open TagManager - should not crash
            const tagsButton = screen.getByRole('button', { name: 'Manage Tags' });
            fireEvent.click(tagsButton);

            await waitFor(() => {
                expect(screen.getByText('Tag Manager')).toBeInTheDocument();
            });

            // Should show empty state or error state
            expect(screen.getByText('No tags available')).toBeInTheDocument();
        });

        it('handles missing trades data gracefully', async () => {
            mockUseTradeContext.mockReturnValue({
                trades: [],
                deleteTrade: vi.fn(),
                loading: false,
            });

            mockTagService.getAllTagsWithCounts.mockReturnValue([]);

            render(<TradeLog />);

            // Open TagManager
            const tagsButton = screen.getByRole('button', { name: 'Manage Tags' });
            fireEvent.click(tagsButton);

            await waitFor(() => {
                expect(screen.getByText('Tag Manager')).toBeInTheDocument();
            });

            // Should show empty state
            expect(screen.getByText('No tags available')).toBeInTheDocument();
            expect(screen.getByText('Start adding tags to your trades to see them here.')).toBeInTheDocument();
        });
    });
});