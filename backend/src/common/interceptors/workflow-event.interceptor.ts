import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../prisma';

@Injectable()
export class WorkflowEventInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user } = request;

    if (!['POST', 'PUT', 'PATCH'].includes(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (responseBody: unknown) => {
        if (!this.isRecord(responseBody) || !user) {
          return;
        }

        const entityId = this.extractEntityId(responseBody);
        const entityType = this.inferEntityType(url);
        const previousStatus = this.extractPreviousStatus(responseBody);
        const newStatus = this.extractNewStatus(responseBody);
        const investigationId = this.extractInvestigationId(responseBody);

        if (entityType && entityId) {
          await this.prisma.workflowEvent.create({
            data: {
              eventType: 'ADMIN_ACTION',
              actorId: user.id,
              investigationId,
              entityType,
              entityId,
              previousStatus,
              newStatus,
              description: `${user.userType} performed ${method} on ${entityType}`,
              metadata: { method, url },
            },
          });
        }
      }),
    );
  }

  private extractEntityId(body: Record<string, unknown>): string | null {
    const data = this.toRecord(body.data);
    return this.toStringOrNull(body.id) ?? this.toStringOrNull(data?.id);
  }

  private inferEntityType(url: string): string | null {
    if (url.includes('/investigations')) return 'investigation';
    if (url.includes('/evaluations')) return 'evaluation';
    if (url.includes('/risk-assessment')) return 'risk_assessment';
    if (url.includes('/observations')) return 'observation';
    if (url.includes('/corrections')) return 'correction';
    if (url.includes('/annexes')) return 'annex';
    if (url.includes('/users')) return 'user';
    if (url.includes('/documents')) return 'document';
    return null;
  }

  private extractPreviousStatus(body: Record<string, unknown>): string | null {
    const data = this.toRecord(body.data);
    return this.toStringOrNull(body.previousStatus) ?? this.toStringOrNull(data?.previousStatus);
  }

  private extractNewStatus(body: Record<string, unknown>): string | null {
    const data = this.toRecord(body.data);
    return this.toStringOrNull(body.status) ?? this.toStringOrNull(data?.status);
  }

  private extractInvestigationId(body: Record<string, unknown>): string | null {
    const data = this.toRecord(body.data);
    return (
      this.toStringOrNull(body.investigationId) ??
      this.toStringOrNull(data?.investigationId) ??
      this.toStringOrNull(data?.investigation_id) ??
      null
    );
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private toRecord(value: unknown): Record<string, unknown> | null {
    return this.isRecord(value) ? value : null;
  }

  private toStringOrNull(value: unknown): string | null {
    return typeof value === 'string' ? value : null;
  }
}
