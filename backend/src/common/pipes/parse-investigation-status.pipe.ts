import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common";
import { InvestigationStatus } from "../enums";

@Injectable()
export class ParseInvestigationStatusPipe implements PipeTransform {
  private readonly validStatuses = Object.values(InvestigationStatus);

  transform(value: string) {
    if (!value) {
      return value;
    }

    const upperValue = value.toUpperCase();

    if (!this.validStatuses.includes(upperValue as InvestigationStatus)) {
      throw new BadRequestException(
        `Invalid investigation status: "${value}". Valid values: ${this.validStatuses.join(", ")}`,
      );
    }

    return upperValue as InvestigationStatus;
  }
}
