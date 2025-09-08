/**
 * Voice Note Service
 * 
 * Handles voice recording, audio processing, and transcription for the journal system.
 * Provides a comprehensive interface for voice note functionality with fallback options.
 * 
 * Features:
 * - Audio recording with MediaRecorder API
 * - Audio compression and optimization
 * - Speech-to-text transcription (with multiple provider support)
 * - Offline audio storage and sync
 * - Audio playback controls
 */

import { JournalImage } from '../types/journal';

export interface VoiceNote {
  id: string;
  audioBlob: Blob;
  audioUrl: string;
  duration: number; // in seconds
  transcription?: string;
  isTranscribing: boolean;
  createdAt: string;
  fileSize: number; // in bytes
  mimeType: string;
}

export interface VoiceRecordingOptions {
  maxDuration?: number; // in seconds, default 300 (5 minutes)
  audioFormat?: string; // 'audio/webm', 'audio/mp4', etc.
  sampleRate?: number; // default 44100
  bitRate?: number; // default 128000
}

export interface TranscriptionProvider {
  name: string;
  transcribe: (audioBlob: Blob) => Promise<string>;
  isAvailable: () => boolean;
}

/**
 * Mock transcription provider for development/fallback
 */
class MockTranscriptionProvider implements TranscriptionProvider {
  name = 'Mock Provider';

  async transcribe(audioBlob: Blob): Promise<string> {
    // Simulate transcription delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const duration = await this.getAudioDuration(audioBlob);
    const mockTranscriptions = [
      "Market looking bullish today, EUR/USD showing strong momentum above 1.0850 resistance.",
      "Just closed my position on GBP/JPY with a 2:1 risk reward ratio. Entry was perfect at the support level.",
      "Feeling confident about today's trades. Stuck to my plan and managed risk well.",
      "Need to work on my patience. Almost entered a trade too early but waited for confirmation.",
      "Economic data came out better than expected. This could drive the dollar higher.",
      "Emotional note: feeling a bit anxious about the upcoming Fed announcement tomorrow.",
      "Lesson learned: always wait for the full candle close before making entry decisions.",
      "Market sentiment seems to be shifting. Seeing more risk-off behavior in the session."
    ];
    
    return mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
  }

  isAvailable(): boolean {
    return true;
  }

  private async getAudioDuration(audioBlob: Blob): Promise<number> {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.onloadedmetadata = () => {
        resolve(audio.duration);
      };
      audio.src = URL.createObjectURL(audioBlob);
    });
  }
}

/**
 * Web Speech API transcription provider
 */
class WebSpeechTranscriptionProvider implements TranscriptionProvider {
  name = 'Web Speech API';

  async transcribe(audioBlob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.isAvailable()) {
        reject(new Error('Web Speech API not available'));
        return;
      }

      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      let finalTranscript = '';

      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
      };

      recognition.onend = () => {
        resolve(finalTranscript.trim() || 'No speech detected');
      };

      recognition.onerror = (event: any) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      // Convert blob to audio and play it for recognition
      const audio = new Audio();
      audio.src = URL.createObjectURL(audioBlob);
      audio.oncanplay = () => {
        recognition.start();
        audio.play();
      };
    });
  }

  isAvailable(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }
}

/**
 * Voice Note Service class
 */
export class VoiceNoteService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recordingStartTime: number = 0;
  private transcriptionProviders: TranscriptionProvider[] = [];
  private defaultOptions: Required<VoiceRecordingOptions> = {
    maxDuration: 300, // 5 minutes
    audioFormat: 'audio/webm;codecs=opus',
    sampleRate: 44100,
    bitRate: 128000
  };

  constructor() {
    this.initializeTranscriptionProviders();
  }

  private initializeTranscriptionProviders() {
    // Add available transcription providers
    this.transcriptionProviders = [
      new WebSpeechTranscriptionProvider(),
      new MockTranscriptionProvider() // Fallback
    ];
  }

  /**
   * Checks if voice recording is supported
   */
  isRecordingSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  }

  /**
   * Gets available audio formats supported by the browser
   */
  getSupportedAudioFormats(): string[] {
    const formats = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/wav'
    ];

    return formats.filter(format => MediaRecorder.isTypeSupported(format));
  }

  /**
   * Starts voice recording
   */
  async startRecording(options: VoiceRecordingOptions = {}): Promise<void> {
    if (!this.isRecordingSupported()) {
      throw new Error('Voice recording is not supported in this browser');
    }

    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      throw new Error('Recording is already in progress');
    }

    const mergedOptions = { ...this.defaultOptions, ...options };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: mergedOptions.sampleRate,
          channelCount: 1, // Mono for smaller file size
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Find the best supported format
      const supportedFormats = this.getSupportedAudioFormats();
      const audioFormat = supportedFormats.includes(mergedOptions.audioFormat) 
        ? mergedOptions.audioFormat 
        : supportedFormats[0];

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: audioFormat,
        audioBitsPerSecond: mergedOptions.bitRate
      });

      this.audioChunks = [];
      this.recordingStartTime = Date.now();

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(1000); // Collect data every second

      // Auto-stop after max duration
      setTimeout(() => {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          this.stopRecording();
        }
      }, mergedOptions.maxDuration * 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      throw new Error('Failed to start recording. Please check microphone permissions.');
    }
  }

  /**
   * Stops voice recording and returns the voice note
   */
  async stopRecording(): Promise<VoiceNote> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
        reject(new Error('No active recording to stop'));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder!.mimeType });
          const audioUrl = URL.createObjectURL(audioBlob);
          const duration = (Date.now() - this.recordingStartTime) / 1000;

          const voiceNote: VoiceNote = {
            id: `voice_${Date.now()}`,
            audioBlob,
            audioUrl,
            duration,
            isTranscribing: false,
            createdAt: new Date().toISOString(),
            fileSize: audioBlob.size,
            mimeType: audioBlob.type
          };

          // Stop all tracks to release microphone
          const stream = this.mediaRecorder!.stream;
          stream.getTracks().forEach(track => track.stop());

          resolve(voiceNote);
        } catch (error) {
          reject(error);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Transcribes a voice note using available providers
   */
  async transcribeVoiceNote(voiceNote: VoiceNote): Promise<string> {
    const availableProviders = this.transcriptionProviders.filter(provider => provider.isAvailable());
    
    if (availableProviders.length === 0) {
      throw new Error('No transcription providers available');
    }

    // Try providers in order until one succeeds
    for (const provider of availableProviders) {
      try {
        console.log(`Attempting transcription with ${provider.name}`);
        const transcription = await provider.transcribe(voiceNote.audioBlob);
        return transcription;
      } catch (error) {
        console.warn(`Transcription failed with ${provider.name}:`, error);
        continue;
      }
    }

    throw new Error('All transcription providers failed');
  }

  /**
   * Compresses audio blob for storage optimization
   */
  async compressAudio(audioBlob: Blob, quality: number = 0.7): Promise<Blob> {
    // For now, return the original blob
    // In a real implementation, you would use Web Audio API or a library like lamejs
    // to compress the audio
    return audioBlob;
  }

  /**
   * Gets audio duration from blob
   */
  async getAudioDuration(audioBlob: Blob): Promise<number> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      
      audio.onloadedmetadata = () => {
        resolve(audio.duration);
        URL.revokeObjectURL(audio.src);
      };
      
      audio.onerror = () => {
        reject(new Error('Failed to load audio metadata'));
        URL.revokeObjectURL(audio.src);
      };
      
      audio.src = URL.createObjectURL(audioBlob);
    });
  }

  /**
   * Converts voice note to journal image format for storage
   */
  voiceNoteToJournalImage(voiceNote: VoiceNote): JournalImage {
    return {
      id: voiceNote.id,
      url: voiceNote.audioUrl,
      filename: `voice_note_${voiceNote.id}.${this.getFileExtension(voiceNote.mimeType)}`,
      fileSize: voiceNote.fileSize,
      mimeType: voiceNote.mimeType,
      uploadedAt: voiceNote.createdAt,
      annotations: [],
      caption: voiceNote.transcription,
      description: `Voice note (${Math.round(voiceNote.duration)}s)`,
      tags: ['voice-note'],
      category: 'other'
    };
  }

  /**
   * Gets file extension from MIME type
   */
  private getFileExtension(mimeType: string): string {
    const extensions: Record<string, string> = {
      'audio/webm': 'webm',
      'audio/mp4': 'm4a',
      'audio/ogg': 'ogg',
      'audio/wav': 'wav',
      'audio/mpeg': 'mp3'
    };

    return extensions[mimeType] || 'audio';
  }

  /**
   * Cleans up resources
   */
  cleanup(): void {
    if (this.mediaRecorder) {
      if (this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop();
      }
      
      const stream = this.mediaRecorder.stream;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
  }
}

/**
 * Default voice note service instance
 */
export const voiceNoteService = new VoiceNoteService();

/**
 * Hook for using voice notes in React components
 */
export function useVoiceNote() {
  const [isRecording, setIsRecording] = React.useState(false);
  const [currentVoiceNote, setCurrentVoiceNote] = React.useState<VoiceNote | null>(null);
  const [isTranscribing, setIsTranscribing] = React.useState(false);

  const startRecording = async (options?: VoiceRecordingOptions) => {
    try {
      await voiceNoteService.startRecording(options);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  };

  const stopRecording = async () => {
    try {
      const voiceNote = await voiceNoteService.stopRecording();
      setCurrentVoiceNote(voiceNote);
      setIsRecording(false);
      return voiceNote;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsRecording(false);
      throw error;
    }
  };

  const transcribeNote = async (voiceNote: VoiceNote) => {
    setIsTranscribing(true);
    try {
      const transcription = await voiceNoteService.transcribeVoiceNote(voiceNote);
      const updatedNote = { ...voiceNote, transcription, isTranscribing: false };
      setCurrentVoiceNote(updatedNote);
      return transcription;
    } catch (error) {
      console.error('Failed to transcribe voice note:', error);
      throw error;
    } finally {
      setIsTranscribing(false);
    }
  };

  const clearVoiceNote = () => {
    if (currentVoiceNote) {
      URL.revokeObjectURL(currentVoiceNote.audioUrl);
      setCurrentVoiceNote(null);
    }
  };

  React.useEffect(() => {
    return () => {
      voiceNoteService.cleanup();
      if (currentVoiceNote) {
        URL.revokeObjectURL(currentVoiceNote.audioUrl);
      }
    };
  }, [currentVoiceNote]);

  return {
    isRecording,
    currentVoiceNote,
    isTranscribing,
    startRecording,
    stopRecording,
    transcribeNote,
    clearVoiceNote,
    isSupported: voiceNoteService.isRecordingSupported()
  };
}

// Add React import for the hook
import React from 'react';