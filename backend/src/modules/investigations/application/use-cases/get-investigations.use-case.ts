import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { UserType } from '@common/enums';
import { QueryInvestigationsDto } from '../dto';
import { IInvestigationRepository, INVESTIGATION_REPOSITORY } from '../../domain/repositories/investigation.repository.interface';

@Injectable()
export class GetInvestigationsUseCase {
  constructor(@Inject(INVESTIGATION_REPOSITORY) private readonly investigationRepository: IInvestigationRepository) {}

  async execute(actorId: string, actorType: UserType, filters: QueryInvestigationsDto) {
    const allowedUserTypes: UserType[] = [UserType.INVESTIGATOR, UserType.ADMIN];
    if (!allowedUserTypes.includes(actorType)) {
      throw new ForbiddenException('You cannot list investigations');
    }
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const result = await this.investigationRepository.findAll({
      ...filters,
      createdById: actorType === UserType.INVESTIGATOR ? actorId : filters.createdById,
      page,
      limit,
    });
    return {
      investigations: result.investigations,
      pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) },
    };
  }
}
