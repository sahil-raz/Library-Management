import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { checkPlanLimit, LimitResource } from '../services/planLimitService.js';

export function enforcePlanLimit(resource: LimitResource) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = req.user?.adminId || (req.user?.role === 'ADMIN' ? req.user.id : null);
      if (!adminId) {
        res.status(403).json({
          success: false,
          code: 'UNAUTHORIZED_ORGANIZATION',
          message: 'Unable to determine organization subscription context.',
        });
        return;
      }

      const limitCheck = await checkPlanLimit(adminId, resource);
      if (!limitCheck.allowed) {
        res.status(403).json({
          success: false,
          code: 'PLAN_LIMIT_REACHED',
          message: limitCheck.message || `You have reached the maximum allowed limit for ${resource} on your current plan.`,
          current: limitCheck.current,
          max: limitCheck.max,
        });
        return;
      }

      next();
    } catch (error) {
      console.error(`[PlanLimitMiddleware] Error checking limit for ${resource}:`, error);
      res.status(500).json({
        success: false,
        code: 'LIMIT_CHECK_ERROR',
        message: 'Failed to verify subscription limits.',
      });
    }
  };
}
