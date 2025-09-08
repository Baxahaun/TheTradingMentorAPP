/**
 * Complete Journal Workflow Integration Tests
 * 
 * End-to-end integration tests covering complete user journeys
 * through the daily trading journal system
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../../contexts/AuthContext';
import { DailyJournalView } from '../../../components/journal/DailyJournalView';
import { CalendarWidget } from '../../../components/CalendarWidget';
import { journalDataService } from '../../../services/JournalDataService';
import { templateService } from '../../../services/TemplateService';
import { imageManagementService } from '../../../services/ImageManagementService';
import { 
  mockUserId, 
  mockDate, 
  mockJournalEntry, 
  mockJournalTemplate,
  createMockJournalEntry,
  createMockTemplate
} from '../mocks/journalTestData';

// Mock all services
vi.mock('../../../services/JournalDataService');
vi.mock('../../../services/TemplateService');
vi.mock('../../../services/ImageManagementService');
vi.mock('../../../services/TradeDataService');

// Mock file upload
global.File = class MockFile {
  constructor(public content: string[], public name: string, public options?: any) {}
} as any;

const mockAuthContext = {
  user: { uid: mockUserId, email: 'test@example.com' },
  loading: false,
  signIn: vi.fn(),
  signOut: vi.fn()
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        {component}
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('Complete Journal Workflow Integration Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock responses
    (journalDataService.getJournalEntry as any).mockResolvedValue(null);
    (journalDataService.createJournalEntry as any).mockResolvedValue(
      createMockJournalEntry({ date: mockDate })
    );
    (journalDataService.updateJournalEntry as any).mockResolvedValue(undefined);
    (journalDataService.subscribeToJournalEntry as any).mockReturnValue(() => {});
    
    (templateService.getUserTemplates as any).mockResolvedValue([mockJournalTemplate]);
    (templateService.getDefaultTemplates as any).mockResolvedValue([mockJournalTemplate]);
    (templateService.applyTemplateToEntry as any).mockResolvedValue(mockJournalEntry);
    
    (imageManagementService.uploadImage as any).mockResolvedValue({
      id: 'img-1',
      url: 'https://example.com/image.jpg',
      filename: 'test-image.jpg'
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Requirement 1: Daily Journal Entry Management', () => {
    it('should complete full daily journal creation workflow', async () => {
      // Test: Navigate to calendar and create new journal entry
      renderWithProviders(<CalendarWidget />);
      
      // Click on a date to create journal entry
      const dateButton = screen.getByText('15');
      await user.click(dateButton);
      
      // Should navigate to journal view and create entry
      await waitFor(() => {
        expect(journalDataService.createJournalEntry).toHaveBeenCalledWith(
          mockUserId, 
          mockDate
        );
      });
      
      // Verify journal view loads
      expect(screen.getByTestId('daily-journal-view')).toBeInTheDocument();
    });

    it('should preserve unsaved changes when navigating between dates', async () => {
      const existingEntry = createMockJournalEntry({ 
        date: mockDate,
        preMarketNotes: 'Existing content'
      });
      
      (journalDataService.getJournalEntry as any).mockResolvedValue(existingEntry);
      
      renderWithProviders(<DailyJournalView date={mockDate} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('journal-editor')).toBeInTheDocument();
      });
      
      // Make changes to content
      const editor = screen.getByTestId('editor-textarea');
      await user.clear(editor);
      await user.type(editor, 'Modified content that should be preserved');
      
      // Attempt to navigate away (should show confirmation)
      const nextDateButton = screen.getByTestId('next-date-button');
      await user.click(nextDateButton);
      
      // Should show unsaved changes warning
      expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
      
      // Choose to save changes
      const saveButton = screen.getByText(/save and continue/i);
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(journalDataService.updateJournalEntry).toHaveBeenCalledWith(
          mockUserId,
          existingEntry.id,
          expect.objectContaining({
            preMarketNotes: 'Modified content that should be preserved'
          })
        );
      });
    });

    it('should auto-populate with trading session information', async () => {
      const mockTradingSession = {
        marketOpen: '09:30',
        marketClose: '16:00',
        timezone: 'EST',
        tradingDay: true
      };
      
      // Mock trading session service
      vi.mock('../../../services/TradingSessionService', () => ({
        getTradingSessionInfo: vi.fn().mockResolvedValue(mockTradingSession)
      }));
      
      renderWithProviders(<DailyJournalView date={mockDate} />);
      
      await waitFor(() => {
        expect(screen.getByText(/market open: 09:30/i)).toBeInTheDocument();
        expect(screen.getByText(/market close: 16:00/i)).toBeInTheDocument();
      });
    });
  });

  describe('Requirement 2: Customizable Journal Templates', () => {
    it('should complete template selection and application workflow', async () => {
      renderWithProviders(<DailyJournalView date={mockDate} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('template-selector')).toBeInTheDocument();
      });
      
      // Open template selector
      const templateButton = screen.getByText(/select template/i);
      await user.click(templateButton);
      
      // Should show available templates
      await waitFor(() => {
        expect(screen.getByText(mockJournalTemplate.name)).toBeInTheDocument();
      });
      
      // Select a template
      const templateOption = screen.getByText(mockJournalTemplate.name);
      await user.click(templateOption);
      
      // Should apply template to entry
      await waitFor(() => {
        expect(templateService.applyTemplateToEntry).toHaveBeenCalledWith(
          mockJournalTemplate.id,
          expect.any(String)
        );
      });
      
      // Should populate sections based on template
      expect(screen.getByText(/pre-market analysis/i)).toBeInTheDocument();
      expect(screen.getByText(/emotional state check/i)).toBeInTheDocument();
    });

    it('should handle template modification workflow', async () => {
      renderWithProviders(<DailyJournalView date={mockDate} />);
      
      // Apply template first
      await waitFor(() => {
        expect(screen.getByTestId('template-selector')).toBeInTheDocument();
      });
      
      const templateButton = screen.getByText(/select template/i);
      await user.click(templateButton);
      
      const templateOption = screen.getByText(mockJournalTemplate.name);
      await user.click(templateOption);
      
      // Modify template sections
      const customizeButton = screen.getByText(/customize template/i);
      await user.click(customizeButton);
      
      // Should open template editor
      expect(screen.getByTestId('template-editor')).toBeInTheDocument();
      
      // Add new section
      const addSectionButton = screen.getByText(/add section/i);
      await user.click(addSectionButton);
      
      const sectionTitle = screen.getByPlaceholderText(/section title/i);
      await user.type(sectionTitle, 'Custom Analysis Section');
      
      const saveTemplateButton = screen.getByText(/save template/i);
      await user.click(saveTemplateButton);
      
      // Should update template and apply to current entry
      await waitFor(() => {
        expect(templateService.updateTemplate).toHaveBeenCalled();
        expect(screen.getByText(/custom analysis section/i)).toBeInTheDocument();
      });
    });
  });

  describe('Requirement 3: Trade Integration and Reference System', () => {
    it('should complete trade reference insertion workflow', async () => {
      const mockTrades = [
        {
          id: 'trade-1',
          symbol: 'EUR/USD',
          direction: 'long',
          pnl: 45.50,
          entryTime: '10:30',
          exitTime: '14:15'
        },
        {
          id: 'trade-2',
          symbol: 'GBP/USD',
          direction: 'short',
          pnl: -23.75,
          entryTime: '11:45',
          exitTime: '13:20'
        }
      ];
      
      // Mock trade data service
      vi.mock('../../../services/TradeDataService', () => ({
        getTradesForDate: vi.fn().mockResolvedValue(mockTrades)
      }));
      
      renderWithProviders(<DailyJournalView date={mockDate} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('trade-reference-panel')).toBeInTheDocument();
      });
      
      // Should display available trades
      expect(screen.getByText('EUR/USD (+$45.50)')).toBeInTheDocument();
      expect(screen.getByText('GBP/USD (-$23.75)')).toBeInTheDocument();
      
      // Insert trade reference
      const tradeCard = screen.getByTestId('trade-card-trade-1');
      await user.click(tradeCard);
      
      const insertButton = screen.getByText(/insert reference/i);
      await user.click(insertButton);
      
      // Should insert trade reference into journal content
      await waitFor(() => {
        expect(screen.getByText(/trade: eur\/usd/i)).toBeInTheDocument();
      });
      
      // Click on trade reference to view details
      const tradeReference = screen.getByText(/trade: eur\/usd/i);
      await user.click(tradeReference);
      
      // Should show trade preview popup
      expect(screen.getByTestId('trade-preview-popup')).toBeInTheDocument();
      expect(screen.getByText(/entry: 10:30/i)).toBeInTheDocument();
      expect(screen.getByText(/exit: 14:15/i)).toBeInTheDocument();
    });

    it('should handle multiple trade references and grouping', async () => {
      const mockTrades = Array.from({ length: 8 }, (_, i) => ({
        id: `trade-${i + 1}`,
        symbol: i % 2 === 0 ? 'EUR/USD' : 'GBP/USD',
        direction: i % 2 === 0 ? 'long' : 'short',
        pnl: (i + 1) * 10.5,
        entryTime: `${9 + i}:30`,
        strategy: i < 4 ? 'trend-following' : 'mean-reversion'
      }));
      
      vi.mock('../../../services/TradeDataService', () => ({
        getTradesForDate: vi.fn().mockResolvedValue(mockTrades)
      }));
      
      renderWithProviders(<DailyJournalView date={mockDate} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('trade-reference-panel')).toBeInTheDocument();
      });
      
      // Group trades by strategy
      const groupByButton = screen.getByText(/group by strategy/i);
      await user.click(groupByButton);
      
      // Should show grouped trades
      expect(screen.getByText(/trend-following \(4 trades\)/i)).toBeInTheDocument();
      expect(screen.getByText(/mean-reversion \(4 trades\)/i)).toBeInTheDocument();
      
      // Select multiple trades for batch reference
      const selectAllTrendButton = screen.getByTestId('select-all-trend-following');
      await user.click(selectAllTrendButton);
      
      const insertGroupButton = screen.getByText(/insert group reference/i);
      await user.click(insertGroupButton);
      
      // Should insert grouped trade reference
      await waitFor(() => {
        expect(screen.getByText(/trend-following strategy \(4 trades\)/i)).toBeInTheDocument();
      });
    });
  });

  describe('Requirement 4: Screenshot and Image Management', () => {
    it('should complete image upload and annotation workflow', async () => {
      renderWithProviders(<DailyJournalView date={mockDate} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('image-gallery')).toBeInTheDocument();
      });
      
      // Upload image via drag and drop
      const dropZone = screen.getByTestId('image-drop-zone');
      const file = new File(['chart data'], 'chart-analysis.png', { type: 'image/png' });
      
      await act(async () => {
        fireEvent.drop(dropZone, {
          dataTransfer: {
            files: [file]
          }
        });
      });
      
      // Should upload image
      await waitFor(() => {
        expect(imageManagementService.uploadImage).toHaveBeenCalledWith(
          mockUserId,
          file,
          expect.any(String)
        );
      });
      
      // Should display uploaded image
      expect(screen.getByTestId('uploaded-image-img-1')).toBeInTheDocument();
      
      // Add annotation to image
      const image = screen.getByTestId('uploaded-image-img-1');
      await user.click(image);
      
      // Should open annotation mode
      expect(screen.getByTestId('annotation-toolbar')).toBeInTheDocument();
      
      // Add arrow annotation
      const arrowTool = screen.getByTestId('arrow-annotation-tool');
      await user.click(arrowTool);
      
      // Click on image to place arrow
      await user.click(image, { clientX: 100, clientY: 150 });
      
      // Add annotation text
      const annotationInput = screen.getByPlaceholderText(/annotation text/i);
      await user.type(annotationInput, 'Entry point identified here');
      
      const saveAnnotationButton = screen.getByText(/save annotation/i);
      await user.click(saveAnnotationButton);
      
      // Should save annotation
      await waitFor(() => {
        expect(imageManagementService.addAnnotation).toHaveBeenCalledWith(
          mockUserId,
          'img-1',
          expect.objectContaining({
            type: 'arrow',
            content: 'Entry point identified here',
            position: { x: 100, y: 150 }
          })
        );
      });
    });

    it('should handle multiple image organization', async () => {
      const mockImages = Array.from({ length: 5 }, (_, i) => ({
        id: `img-${i + 1}`,
        url: `https://example.com/image-${i + 1}.jpg`,
        filename: `chart-${i + 1}.png`,
        uploadedAt: new Date().toISOString(),
        tradeId: i < 3 ? `trade-${i + 1}` : undefined
      }));
      
      (journalDataService.getJournalEntry as any).mockResolvedValue({
        ...mockJournalEntry,
        images: mockImages
      });
      
      renderWithProviders(<DailyJournalView date={mockDate} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('image-gallery')).toBeInTheDocument();
      });
      
      // Should display all images
      mockImages.forEach(img => {
        expect(screen.getByTestId(`uploaded-image-${img.id}`)).toBeInTheDocument();
      });
      
      // Organize images by trade association
      const organizeButton = screen.getByText(/organize by trades/i);
      await user.click(organizeButton);
      
      // Should group images by trade
      expect(screen.getByText(/trade-associated \(3\)/i)).toBeInTheDocument();
      expect(screen.getByText(/general analysis \(2\)/i)).toBeInTheDocument();
      
      // Reorder images
      const firstImage = screen.getByTestId('uploaded-image-img-1');
      const secondImage = screen.getByTestId('uploaded-image-img-2');
      
      // Drag and drop to reorder
      await act(async () => {
        fireEvent.dragStart(firstImage);
        fireEvent.dragOver(secondImage);
        fireEvent.drop(secondImage);
      });
      
      // Should update image order
      await waitFor(() => {
        expect(journalDataService.updateJournalEntry).toHaveBeenCalledWith(
          mockUserId,
          mockJournalEntry.id,
          expect.objectContaining({
            images: expect.arrayContaining([
              expect.objectContaining({ id: 'img-2' }),
              expect.objectContaining({ id: 'img-1' })
            ])
          })
        );
      });
    });
  });

  describe('Requirement 6: Emotional State Tracking', () => {
    it('should complete emotional tracking workflow throughout trading day', async () => {
      renderWithProviders(<DailyJournalView date={mockDate} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('emotional-tracker')).toBeInTheDocument();
      });
      
      // Pre-market emotional state
      const preMarketTab = screen.getByText(/pre-market/i);
      await user.click(preMarketTab);
      
      // Set confidence level
      const confidenceSlider = screen.getByTestId('confidence-slider');
      fireEvent.change(confidenceSlider, { target: { value: '4' } });
      
      // Set anxiety level
      const anxietySlider = screen.getByTestId('anxiety-slider');
      fireEvent.change(anxietySlider, { target: { value: '2' } });
      
      // Select mood
      const moodSelector = screen.getByTestId('mood-confident');
      await user.click(moodSelector);
      
      // Add notes
      const emotionalNotes = screen.getByPlaceholderText(/emotional notes/i);
      await user.type(emotionalNotes, 'Feeling prepared and focused for today');
      
      // During trading emotional state
      const duringTradingTab = screen.getByText(/during trading/i);
      await user.click(duringTradingTab);
      
      const disciplineSlider = screen.getByTestId('discipline-slider');
      fireEvent.change(disciplineSlider, { target: { value: '4' } });
      
      const patienceSlider = screen.getByTestId('patience-slider');
      fireEvent.change(patienceSlider, { target: { value: '3' } });
      
      // Post-market emotional state
      const postMarketTab = screen.getByText(/post-market/i);
      await user.click(postMarketTab);
      
      const satisfactionSlider = screen.getByTestId('satisfaction-slider');
      fireEvent.change(satisfactionSlider, { target: { value: '4' } });
      
      const overallMoodSelector = screen.getByTestId('mood-satisfied');
      await user.click(overallMoodSelector);
      
      // Save emotional state
      const saveEmotionsButton = screen.getByText(/save emotional state/i);
      await user.click(saveEmotionsButton);
      
      await waitFor(() => {
        expect(journalDataService.updateJournalEntry).toHaveBeenCalledWith(
          mockUserId,
          expect.any(String),
          expect.objectContaining({
            emotionalState: {
              preMarket: {
                confidence: 4,
                anxiety: 2,
                focus: expect.any(Number),
                mood: 'confident',
                notes: 'Feeling prepared and focused for today'
              },
              duringTrading: {
                discipline: 4,
                patience: 3,
                emotionalControl: expect.any(Number),
                notes: expect.any(String)
              },
              postMarket: {
                satisfaction: 4,
                learningValue: expect.any(Number),
                overallMood: 'satisfied',
                notes: expect.any(String)
              }
            }
          })
        );
      });
    });
  });

  describe('Cross-Component Integration', () => {
    it('should maintain data consistency across all components', async () => {
      renderWithProviders(<DailyJournalView date={mockDate} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('daily-journal-view')).toBeInTheDocument();
      });
      
      // Update content in editor
      const editor = screen.getByTestId('editor-textarea');
      await user.type(editor, 'Comprehensive journal entry with multiple components');
      
      // Update emotional state
      const confidenceSlider = screen.getByTestId('confidence-slider');
      fireEvent.change(confidenceSlider, { target: { value: '5' } });
      
      // Update process metrics
      const planAdherenceSlider = screen.getByTestId('plan-adherence-slider');
      fireEvent.change(planAdherenceSlider, { target: { value: '4' } });
      
      // Add trade reference
      const tradeCard = screen.getByTestId('trade-card-trade-1');
      await user.click(tradeCard);
      
      // Upload image
      const dropZone = screen.getByTestId('image-drop-zone');
      const file = new File(['chart'], 'analysis.png', { type: 'image/png' });
      
      await act(async () => {
        fireEvent.drop(dropZone, {
          dataTransfer: { files: [file] }
        });
      });
      
      // All updates should be consolidated into single save operation
      await waitFor(() => {
        expect(journalDataService.updateJournalEntry).toHaveBeenCalledWith(
          mockUserId,
          expect.any(String),
          expect.objectContaining({
            preMarketNotes: expect.stringContaining('Comprehensive journal entry'),
            emotionalState: expect.objectContaining({
              preMarket: expect.objectContaining({ confidence: 5 })
            }),
            processMetrics: expect.objectContaining({
              planAdherence: 4
            }),
            tradeReferences: expect.arrayContaining([
              expect.objectContaining({ tradeId: 'trade-1' })
            ]),
            images: expect.arrayContaining([
              expect.objectContaining({ filename: 'analysis.png' })
            ])
          })
        );
      });
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle and recover from service failures', async () => {
      // Simulate service failure
      (journalDataService.updateJournalEntry as any)
        .mockRejectedValueOnce(new Error('Service temporarily unavailable'))
        .mockResolvedValue(undefined);
      
      renderWithProviders(<DailyJournalView date={mockDate} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('journal-editor')).toBeInTheDocument();
      });
      
      // Make changes that will initially fail to save
      const editor = screen.getByTestId('editor-textarea');
      await user.type(editor, 'Content that will initially fail to save');
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/save failed/i)).toBeInTheDocument();
      });
      
      // Should show retry option
      expect(screen.getByText(/retry/i)).toBeInTheDocument();
      
      // Click retry
      const retryButton = screen.getByText(/retry/i);
      await user.click(retryButton);
      
      // Should successfully save on retry
      await waitFor(() => {
        expect(screen.getByText(/saved successfully/i)).toBeInTheDocument();
      });
      
      expect(journalDataService.updateJournalEntry).toHaveBeenCalledTimes(2);
    });
  });
});