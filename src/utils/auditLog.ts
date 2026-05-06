import { supabase } from './supabase';

interface LogActionParams {
  groupId: string;
  actorId: string;
  action: string;
  targetId?: string;
  targetType?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
}

/** Inserts a row into public.audit_log. Errors are swallowed (non-critical). */
export async function logAction(params: LogActionParams): Promise<void> {
  try {
    await supabase.from('audit_log').insert({
      group_id: params.groupId,
      actor_id: params.actorId,
      action: params.action,
      target_id: params.targetId ?? null,
      target_type: params.targetType ?? null,
      old_value: params.oldValue ?? null,
      new_value: params.newValue ?? null,
    });
  } catch {
    // audit logging is non-critical – swallow errors silently
  }
}
