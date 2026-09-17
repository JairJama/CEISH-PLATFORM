import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InvestigationStatus, UserType } from '@common/enums';
import { PrismaService } from '@common/prisma';
import { CreateRiskAssessmentDto } from '../dto';
import { IRiskAssessmentRepository, RISK_ASSESSMENT_REPOSITORY } from '../../domain/repositories/risk-assessment.repository.interface';

@Injectable()
export class CreateRiskAssessmentUseCase {
  constructor(
    @Inject(RISK_ASSESSMENT_REPOSITORY) private readonly riskAssessmentRepository: IRiskAssessmentRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(adminId: string, adminType: UserType, data: CreateRiskAssessmentDto) {
    if (adminType !== UserType.ADMIN) throw new ForbiddenException('Only administrators can create stratifications');
    const investigation = await this.prisma.investigation.findUnique({ where: { id: data.investigationId } });
    if (!investigation) throw new NotFoundException('Investigation not found');
    const allowedStatuses: InvestigationStatus[] = [
      InvestigationStatus.WAITING_STRATIFICATION,
      InvestigationStatus.RESTRATIFICATION,
    ];
    if (!allowedStatuses.includes(investigation.status as InvestigationStatus)) {
      throw new ConflictException('Investigation is not ready for stratification');
    }
    if (investigation.status === InvestigationStatus.WAITING_STRATIFICATION) {
      const active = await this.riskAssessmentRepository.findActiveByInvestigation(investigation.id);
      if (active) throw new ConflictException('An active stratification already exists');
    }

    const assessment = await this.riskAssessmentRepository.create(investigation.id, adminId);
    if (investigation.status === InvestigationStatus.RESTRATIFICATION) {
      const history = await this.riskAssessmentRepository.findHistoryByInvestigation(investigation.id);
      const previous = history.find((item) => item.id !== assessment.id);
      if (previous) await this.riskAssessmentRepository.markReplaced(previous.id, assessment.id);
    }
    await this.prisma.workflowEvent.create({
      data: {
        eventType: 'STRATIFICATION_CREATED', actorId: adminId, investigationId: investigation.id,
        entityType: 'risk_assessment', entityId: assessment.id,
        newStatus: assessment.status, description: 'Administrator created risk stratification',
      },
    });
    return assessment;
  }
}
