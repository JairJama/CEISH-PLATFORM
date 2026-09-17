import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UserType } from '@common/enums';
import { IInvestigationRepository, INVESTIGATION_REPOSITORY } from '../../domain/repositories/investigation.repository.interface';

@Injectable()
export class GetInvestigationUseCase {
  constructor(@Inject(INVESTIGATION_REPOSITORY) private readonly investigationRepository: IInvestigationRepository) {}

  async execute(actorId: string, actorType: UserType, investigationId: string) {
    const investigation = await this.investigationRepository.findById(investigationId);
    if (!investigation) throw new NotFoundException('Investigation not found');
    if (actorType === UserType.INVESTIGATOR && investigation.createdById !== actorId) {
      throw new ForbiddenException('You cannot access this investigation');
    }
    const allowedUserTypes: UserType[] = [UserType.INVESTIGATOR, UserType.ADMIN];
    if (!allowedUserTypes.includes(actorType)) {
      throw new ForbiddenException('You cannot access this investigation');
    }
    return investigation;
  }
}
