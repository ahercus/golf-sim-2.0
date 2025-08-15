import { createMachine } from 'xstate';

export type ShotState = 'idle' | 'aiming' | 'swinging' | 'resolving' | 'done' | 'error';

type Ctx = {
  shotId?: string;
  error?: string;
};

type Ev =
  | { type: 'START_AIM' }
  | { type: 'TAKE_SHOT'; shotId: string }
  | { type: 'RESOLVE' }
  | { type: 'FAIL'; error?: string }
  | { type: 'RESET' };

export function createShotMachine(initial: ShotState = 'idle') {
  return createMachine<Ctx, Ev>(
    {
      id: 'shotMachine',
      initial,
      context: {},
      states: {
        idle: {
          on: { START_AIM: 'aiming', TAKE_SHOT: { target: 'swinging', actions: 'assignShotId' } },
        },
        aiming: {
          on: { TAKE_SHOT: { target: 'swinging', actions: 'assignShotId' }, RESET: 'idle' },
        },
        swinging: {
          on: { RESOLVE: 'resolving', FAIL: { target: 'error', actions: 'assignError' } },
        },
        resolving: {
          on: { RESOLVE: 'done', FAIL: { target: 'error', actions: 'assignError' } },
        },
        done: { on: { RESET: 'idle' } },
        error: { on: { RESET: 'idle' } },
      },
    },
    {
      actions: {
        assignShotId: (ctx, ev) => {
          if (ev.type === 'TAKE_SHOT') ctx.shotId = ev.shotId;
        },
        assignError: (ctx, ev) => {
          if (ev.type === 'FAIL') ctx.error = ev.error || 'Unknown error';
        },
      },
    }
  );
}


