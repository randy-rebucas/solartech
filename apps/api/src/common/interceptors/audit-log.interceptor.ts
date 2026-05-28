import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { SecurityService } from '../../modules/security/security.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private securityService: SecurityService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const user = req.user as { sub?: string; organizationId?: string; role?: string } | undefined;
          const path = req.route?.path ? `${req.baseUrl ?? ''}${req.route.path}` : req.originalUrl ?? req.url;
          this.securityService.logAudit({
            userId: user?.sub,
            organizationId: user?.organizationId,
            action: `${req.method} ${path}`,
            route: path,
            method: req.method,
            statusCode: res.statusCode ?? 200,
            durationMs: Date.now() - start,
            ip: req.ip,
            userAgent: req.get?.('user-agent'),
            metadata: {
              role: user?.role,
            },
          }).catch(() => undefined);
        },
      }),
    );
  }
}

