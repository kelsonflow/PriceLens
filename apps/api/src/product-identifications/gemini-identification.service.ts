import { Injectable, Logger } from "@nestjs/common";
import { GoogleGenAI } from "@google/genai";
import { type ProductIdentification, type SearchSourceType } from "@pricelens/shared";
import { GoogleVisionService, type GoogleVisionSignals } from "./google-vision.service";

interface GeminiProductResult {
  name?: string;
  brand?: string;
  model?: string;
  category?: string;
  color?: string;
  visibleFeatures?: string[];
  barcode?: string;
  ocrText?: string;
  confidence?: number;
}

@Injectable()
export class GeminiIdentificationService {
  private readonly logger = new Logger(GeminiIdentificationService.name);

  constructor(private readonly googleVisionService: GoogleVisionService) {}

  async identifyFromText(query: string, sourceType: SearchSourceType): Promise<ProductIdentification> {
    const prompt = this.buildPrompt(`Pesquisa textual do utilizador: ${query}`);
    const result = await this.generateJson([{ text: prompt }]);
    return this.toIdentification(result, sourceType, query);
  }

  async identifyFromImage(imageBase64: string, mimeType: string): Promise<ProductIdentification> {
    const visionSignals = await this.googleVisionService.analyzeImage(imageBase64);
    const prompt = this.buildPrompt(["Identifica o produto principal nesta imagem.", this.formatVisionSignals(visionSignals)].join("\n"));
    const result = await this.generateJson([
      { inlineData: { mimeType, data: imageBase64 } },
      { text: prompt }
    ]);
    return this.toIdentification(this.mergeVisionSignals(result, visionSignals), "image");
  }

  private async generateJson(contents: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>): Promise<GeminiProductResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    const project = process.env.GOOGLE_CLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = process.env.GOOGLE_CLOUD_LOCATION ?? process.env.GOOGLE_CLOUD_REGION ?? "europe-west1";
    const useVertexAi = !apiKey && Boolean(project);

    if (!apiKey && !useVertexAi) return {};

    try {
      const ai = apiKey
        ? new GoogleGenAI({ apiKey })
        : new GoogleGenAI({ vertexai: true, project, location });
      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
        contents,
        config: { responseMimeType: "application/json" }
      });

      return this.parseJson(response.text ?? "");
    } catch (error) {
      this.logger.warn(`Gemini identification failed; returning an empty identification. ${String(error)}`);
      return {};
    }
  }

  private buildPrompt(input: string): string {
    return [
      "Analisa o input e devolve apenas JSON valido.",
      "Objetivo: identificar um produto para comparacao de precos.",
      input,
      "Schema exato:",
      "{",
      '  "name": "string",',
      '  "brand": "string",',
      '  "model": "string",',
      '  "category": "string",',
      '  "color": "string",',
      '  "visibleFeatures": ["string"],',
      '  "barcode": "string",',
      '  "ocrText": "string",',
      '  "confidence": 0',
      "}",
      "Nao inventes codigos de barras. Se nao souberes, usa string vazia.",
      "Nao inventes marcas, modelos ou nomes. Se nao houver evidencia visual/textual suficiente, usa string vazia.",
      "A confianca deve ser um inteiro de 0 a 100."
    ].join("\n");
  }

  private formatVisionSignals(signals: GoogleVisionSignals): string {
    return [
      "Sinais extraidos pelo Google Cloud Vision:",
      `Labels: ${signals.labels.join(", ") || "nenhum"}`,
      `Logos: ${signals.logos.join(", ") || "nenhum"}`,
      `Objetos: ${signals.objects.join(", ") || "nenhum"}`,
      `Texto/OCR: ${signals.text || "nenhum"}`
    ].join("\n");
  }

  private mergeVisionSignals(result: GeminiProductResult, signals: GoogleVisionSignals): GeminiProductResult {
    return {
      ...result,
      brand: result.brand || signals.logos[0],
      ocrText: result.ocrText || signals.text,
      visibleFeatures: [
        ...(result.visibleFeatures ?? []),
        ...signals.labels,
        ...signals.objects
      ].filter((value, index, values) => value && values.indexOf(value) === index).slice(0, 8)
    };
  }

  private parseJson(text: string): GeminiProductResult {
    try {
      return JSON.parse(text) as GeminiProductResult;
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      return match ? (JSON.parse(match[0]) as GeminiProductResult) : {};
    }
  }

  private toIdentification(result: GeminiProductResult, sourceType: SearchSourceType, fallbackName = ""): ProductIdentification {
    return {
      id: `ident_${crypto.randomUUID()}`,
      sourceType,
      name: result.name?.trim() || fallbackName,
      brand: result.brand?.trim() || undefined,
      model: result.model?.trim() || undefined,
      category: result.category?.trim() || (sourceType === "text" ? "Pesquisa textual" : undefined),
      color: result.color?.trim() || undefined,
      visibleFeatures: Array.isArray(result.visibleFeatures) && result.visibleFeatures.length > 0 ? result.visibleFeatures.slice(0, 8) : [],
      barcode: result.barcode?.trim() || undefined,
      ocrText: result.ocrText?.trim() || undefined,
      confidence: clampConfidence(result.confidence ?? 0),
      createdAt: new Date().toISOString()
    };
  }
}

function clampConfidence(value: number): number {
  return Math.min(100, Math.max(0, Math.round(Number.isFinite(value) ? value : 0)));
}
