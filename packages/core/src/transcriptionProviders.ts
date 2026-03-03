import type { CaptionSegment } from "./types";

export interface TranscriptionMediaAsset {
  id: string;
  filePath: string;
  mimeType?: string;
  fileName?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

export interface TranscriptionProviderCapabilityMetadata {
  supportsWordTimestamps: boolean;
  supportsSpeakerDiarization: boolean;
  supportsLanguageDetection: boolean;
  maxMediaDurationMs?: number;
  languages?: string[];
}

export interface TranscriptionResult {
  segments: CaptionSegment[];
  languageCode?: string;
  providerMetadata?: Record<string, unknown>;
}

export interface TranscriptionProvider {
  id: string;
  label: string;
  description?: string;
  capabilities: TranscriptionProviderCapabilityMetadata;
  transcribe: (mediaAsset: TranscriptionMediaAsset) => Promise<TranscriptionResult> | TranscriptionResult;
}
