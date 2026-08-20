import { Injectable, Logger } from "@nestjs/common";
import { ImageAnnotatorClient } from "@google-cloud/vision";

export interface GoogleVisionSignals {
  labels: string[];
  logos: string[];
  objects: string[];
  text: string;
}

const emptySignals: GoogleVisionSignals = {
  labels: [],
  logos: [],
  objects: [],
  text: ""
};

@Injectable()
export class GoogleVisionService {
  private readonly logger = new Logger(GoogleVisionService.name);
  private client?: ImageAnnotatorClient;

  async analyzeImage(imageBase64: string): Promise<GoogleVisionSignals> {
    if (process.env.GOOGLE_VISION_ENABLED === "false") {
      return emptySignals;
    }

    try {
      const client = this.getClient();
      const [result] = await client.annotateImage({
        image: { content: imageBase64 },
        features: [
          { type: "LABEL_DETECTION", maxResults: 10 },
          { type: "LOGO_DETECTION", maxResults: 5 },
          { type: "TEXT_DETECTION" },
          { type: "OBJECT_LOCALIZATION", maxResults: 8 }
        ]
      });

      return {
        labels: compact(result.labelAnnotations?.map((label) => label.description)).slice(0, 10),
        logos: compact(result.logoAnnotations?.map((logo) => logo.description)).slice(0, 5),
        objects: compact(result.localizedObjectAnnotations?.map((object) => object.name)).slice(0, 8),
        text: result.textAnnotations?.[0]?.description?.trim() ?? ""
      };
    } catch (error) {
      this.logger.warn(`Google Vision failed; continuing without Vision signals. ${String(error)}`);
      return emptySignals;
    }
  }

  private getClient(): ImageAnnotatorClient {
    if (!this.client) {
      const apiEndpoint = process.env.GOOGLE_VISION_API_ENDPOINT;
      this.client = apiEndpoint ? new ImageAnnotatorClient({ apiEndpoint }) : new ImageAnnotatorClient();
    }
    return this.client;
  }
}

function compact(values: Array<string | null | undefined> | undefined): string[] {
  return values?.filter((value): value is string => Boolean(value)) ?? [];
}
