import { Injectable, NotFoundException } from "@nestjs/common";
import { type ProductIdentification } from "@pricelens/shared";
import { ConfirmIdentificationDto } from "./dto/confirm-identification.dto";
import { CreateImageIdentificationDto } from "./dto/create-image-identification.dto";
import { CreateTextIdentificationDto } from "./dto/create-text-identification.dto";
import { GeminiIdentificationService } from "./gemini-identification.service";

@Injectable()
export class ProductIdentificationsService {
  private readonly identifications = new Map<string, ProductIdentification>();

  constructor(private readonly geminiIdentificationService: GeminiIdentificationService) {}

  async createFromText(dto: CreateTextIdentificationDto): Promise<ProductIdentification> {
    const identification = await this.geminiIdentificationService.identifyFromText(dto.query, "text");
    this.identifications.set(identification.id, identification);
    return identification;
  }

  async createFromImage(dto: CreateImageIdentificationDto): Promise<ProductIdentification> {
    const imageBase64 = dto.imageBase64.includes(",") ? dto.imageBase64.split(",").at(-1) ?? dto.imageBase64 : dto.imageBase64;
    const identification = await this.geminiIdentificationService.identifyFromImage(imageBase64, dto.mimeType);
    this.identifications.set(identification.id, identification);
    return identification;
  }

  confirm(id: string, dto: ConfirmIdentificationDto): ProductIdentification {
    const identification = this.identifications.get(id);
    if (!identification) {
      throw new NotFoundException("Product identification not found");
    }

    const confirmed = {
      ...identification,
      name: dto.name ?? identification.name,
      model: dto.model ?? identification.model,
      category: dto.category ?? identification.category
    };

    this.identifications.set(id, confirmed);
    return confirmed;
  }
}
