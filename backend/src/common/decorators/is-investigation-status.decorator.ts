import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { InvestigationStatus } from "../enums";

@ValidatorConstraint({ name: "isInvestigationStatus", async: false })
export class IsInvestigationStatusConstraint
  implements ValidatorConstraintInterface
{
  private readonly validStatuses = Object.values(InvestigationStatus);

  validate(value: unknown) {
    if (typeof value !== "string") {
      return false;
    }

    return this.validStatuses.includes(value as InvestigationStatus);
  }

  defaultMessage() {
    return `Invalid investigation status. Valid values: ${this.validStatuses.join(", ")}`;
  }
}

export function IsInvestigationStatus(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isInvestigationStatus",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: IsInvestigationStatusConstraint,
    });
  };
}
