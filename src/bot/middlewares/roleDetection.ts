import { MiddlewareFn, Context } from 'grammy';
import { coreClient } from '../../core/coreClient';

interface UserRole {
  role: 'user' | 'admin' | 'super_admin';
  kyc_status: 'none' | 'pending' | 'approved' | 'rejected';
  status: 'active' | 'blocked';
}

// Cache user roles to avoid excessive API calls
const userRoleCache = new Map<number, { role: UserRole; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const roleDetectionMiddleware: MiddlewareFn<Context> = async (ctx, next) => {
  if (!ctx.from?.id) {
    return next();
  }

  const userId = ctx.from.id;
  const cached = userRoleCache.get(userId);

  // Use cached role if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    ctx.userRole = cached.role;
    return next();
  }

  try {
    const user = await coreClient.getUserByTelegramId(userId);
    const userRole: UserRole = {
      role: (user as any).role || 'user',
      kyc_status: (user as any).kyc_status || 'none',
      status: (user as any).status || 'active',
    };

    // Cache the role
    userRoleCache.set(userId, { role: userRole, timestamp: Date.now() });

    ctx.userRole = userRole;
  } catch (error) {
    console.error('Failed to fetch user role:', error);
    // Default to basic user role on error
    ctx.userRole = {
      role: 'user',
      kyc_status: 'none',
      status: 'active',
    };
  }

  return next();
};

// Extend Grammy context to include userRole
declare module 'grammy' {
  interface Context {
    userRole?: {
      role: 'user' | 'admin' | 'super_admin';
      kyc_status: 'none' | 'pending' | 'approved' | 'rejected';
      status: 'active' | 'blocked';
    };
  }
}

