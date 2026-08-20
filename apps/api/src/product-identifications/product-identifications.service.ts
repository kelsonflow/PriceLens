import { Injectable, NotFoundException } from "@nestjs/common";
import { mockIdentification, type ProductIdentification } from "@pricelens/shared";
import { ConfirmIdentificationDto } from "./dto/confirm-identification.dto";
import { CreateTextIdentificationDto } from "./dto/create-text-identification.dto";

@Injectable()
export class ProductIdentificationsService {
  private readonly identifications = new Map<string, ProductIdentification>();

  createFromText(dto: CreateTextIdentificationDto): ProductIdentification {
    const identification: ProductIdentification = {
      ...mockIdentification,
      id: `ident_${crypto.randomUUID()}`,
      sourceType: "text",
      name: dto.query,
      confidence: 72,
      visibleFeatures: [],
      ocrText: undefined,
      createdAt: new Date().toISOString()
    };

    this.identifications.set(identification.id, identification);
    return identification;
  }

  createFromMockImage(): ProductIdentification {
    const identification: ProductIdentification = {
      ...mockIdentification,
      id: `ident_${crypto.randomUUID()}`,
      createdAt: new Date().toISOString()
    };

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

