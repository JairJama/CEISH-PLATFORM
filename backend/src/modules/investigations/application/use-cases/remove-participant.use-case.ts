import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InvestigationStatus, UserType } from '@common/enums';
import { PrismaService } from '@common/prisma';
import { IInvestigationRepository, INVESTIGATION_REPOSITORY } from '../../domain/repositories/investigation.repository.interface';

@Injectable()
export class RemoveParticipantUseCase {
  constructor(
    @Inject(INVESTIGATION_REPOSITORY) private readonly investigationRepository: IInvestigationRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(actorId: string, actorType: UserType, investigationId: string, participantId: string): Promise<void> {
    if (actorType !== UserType.INVESTIGATOR) throw new ForbiddenException('Only investigators can remove participants');
    const investigation = await this.investigationRepository.findById(investigationId);
    if (!investigation) throw new NotFoundException('Investigation not found');
    if (investigation.createdById !== actorId) throw new ForbiddenException('You cannot modify this investigation');
    const participants = investigation.participants ?? [];
    const participant = participants.find((item) => item.id === participantId);
    if (!participant) throw new NotFoundException('Participant not found');
    if (participants.length <= 1) throw new ConflictException('The only participant cannot be removed');
    if (participant.isPrincipal && participants.filter((item) => item.isPrincipal).length <= 1) {
      throw new ConflictException('Assign another principal participant before removing the current one');
    }
    const protectedStatuses: InvestigationStatus[] = [
      InvestigationStatus.UNDER_EVALUATION,
      InvestigationStatus.WAITING_RESEARCHER_RESPONSE,
      InvestigationStatus.FINAL_REVIEW,
      InvestigationStatus.COMPLETED,
      InvestigationStatus.CANCELLED,
    ];
    if (participant.isPrincipal && protectedStatuses.includes(investigation.status)) {
      throw new ConflictException('The principal participant cannot be removed during advanced evaluation');
    }

    await this.investigationRepository.removeParticipant(participant.id);
    await this.prisma.workflowEvent.create({
      data: {
        eventType: 'ADMIN_ACTION', actorId, investigationId: investigation.id,
        entityType: 'investigation_participant', entityId: participant.id,
        description: 'Investigator removed a participant',
      },
    });
  }
}
