import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, PermissionKey } from '../types/index.js';
import { ManagerPermission } from '../models/ManagerPermission.js';
import { Types } from 'mongoose';

export function checkPermission(permission: PermissionKey) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Authentication required' });
      return;
    }

    // Admins and SuperAdmins bypass manager permission checks for their org
    if (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (req.user.role !== 'MANAGER') {
      res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Unauthorized role' });
      return;
    }

    try {
      const perms = await ManagerPermission.findOne({
        managerId: new Types.ObjectId(req.user.id),
      });

      if (!perms || perms[permission] !== true) {
        res.status(403).json({
          success: false,
          code: 'PERMISSION_DENIED',
          message: `Permission denied: '${permission}' permission is required for this action.`,
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({ success: false, code: 'SERVER_ERROR', message: 'Failed to verify permissions' });
    }
  };
}
