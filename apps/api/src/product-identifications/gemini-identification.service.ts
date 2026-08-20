import { Injectable, Logger } from "@nestjs/common";
import { GoogleGenAI } from "@google/genai";
import { mockIdentification, type ProductIdentification, type SearchSourceType } from "@pricelens/shared";

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

  async identifyFromText(query: string, sourceType: SearchSourceType): Promise<ProductIdentification> {
    const prompt = this.buildPrompt(`Pesquisa textual do utilizador: ${query}`);
    const result = await this.generateJson([{ text: prompt }]);
    return this.toIdentification(result, sourceType, query);
  }

  async identifyFromImage(imageBase64: string, mimeType: string): Promise<ProductIdentification> {
    const prompt = this.buildPrompt("Identifica o produto principal nesta imagem.");
    const result = await this.generateJson([
      { inlineData: { mimeType, data: imageBase64 } },
      { text: prompt }
    ]);
    return this.toIdentification(result, "image");
  }

  private async generateJson(contents: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>): Promise<GeminiProductResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return {};

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
        contents,
        config: { responseMimeType: "application/json" }
      });

      return this.parseJson(response.text ?? "");
    } catch (error) {
      this.logger.warn(`Gemini identification failed; falling back to mock data. ${String(error)}`);
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
      "A confianca deve ser um inteiro de 0 a 100."
    ].join("\n");
  }

  private parseJson(text: string): GeminiProductResult {
    try {
      return JSON.parse(text) as GeminiProductResult;
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      return match ? (JSON.parse(match[0]) as GeminiProductResult) : {};
    }
  }

  private toIdentification(result: GeminiProductResult, sourceType: SearchSourceType, fallbackName = mockIdentification.name): ProductIdentification {
    return {
      ...mockIdentification,
      id: `ident_${crypto.randomUUID()}`,
      sourceType,
      name: result.name?.trim() || fallbackName,
      brand: result.brand?.trim() || mockIdentification.brand,
      model: result.model?.trim() || mockIdentification.model,
      category: result.category?.trim() || mockIdentification.category,
      color: result.color?.trim() || mockIdentification.color,
      visibleFeatures: Array.isArray(result.visibleFeatures) && result.visibleFeatures.length > 0 ? result.visibleFeatures.slice(0, 8) : mockIdentification.visibleFeatures,
      barcode: result.barcode?.trim() || undefined,
      ocrText: result.ocrText?.trim() || undefined,
      confidence: clampConfidence(result.confidence ?? mockIdentification.confidence),
      createdAt: new Date().toISOString()
    };
  }
}

function clampConfidence(value: number): number {
  return Math.min(100, Math.max(0, Math.round(Number.isFinite(value) ? value : 0)));
}

