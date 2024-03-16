import '@/styles/battlepass.css';
import {
  Accessor,
  For,
  ParentComponent,
  Show,
  batch,
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
  useContext,
} from 'solid-js';
import { Motion, Presence } from 'solid-motionone';
import { load, save } from '@/utils/validate';
import { ValueKeyframesDefinition } from 'motion';

export function BattlePassDisplay() {
  const context = useContext(BattlePassContext);

  const [experience, setExperience] = createSignal(0);
  const [level, setLevel] = createSignal(0);

  const [lastIndex, setLastIndex] = createSignal(-1);
  const [animations, setAnimations] = createSignal<ValueKeyframesDefinition>([]);
  const [start, setStart] = createSignal(0);
  const [offsets, setOffsets] = createSignal([1]);

  onMount(() => {
    const xp = context?.battlePass()?.xp;
    if (xp === undefined) return;
    batch(() => {
      setExperience(xp);
      setLevel(Math.floor(experience() / LEVEL_XP));
    });
  });

  createEffect(() => {
    const showingNumber = context?.currentlyShowing();
    if (showingNumber === undefined) return;
    if (lastIndex() == showingNumber) return;
    setLastIndex(showingNumber);

    if (showingNumber == -1) return;
    const pending = context?.pending()[showingNumber];
    if (pending === undefined) return;

    batch(() => {
      setStart((experience() % LEVEL_XP) / LEVEL_XP);

      const oldExperience = experience();
      setExperience(experience() + pending.xp);
      const oldLevel = level();
      setLevel(Math.floor(experience() / LEVEL_XP));
      if (oldLevel != level()) {
        // this means it went over 100%, we have to do a bit of thinking here
        const remaining = level() * LEVEL_XP - oldExperience;
        const intermediateTime = remaining / pending.xp;
        setOffsets([intermediateTime, intermediateTime, 1]);
        setAnimations(['100%', '0%', `${((experience() % LEVEL_XP) / LEVEL_XP) * 100}%`]);
        // honestly this might be literally insane but whatever :)
      } else {
        setOffsets([1]);
        setAnimations([`${((experience() % LEVEL_XP) / LEVEL_XP) * 100}%`]);
      }
    });
  });

  return (
    <div class="battle-bar">
      <div class="battle-text">
        <Presence>
          <For each={context?.pending() || []}>
            {(v, i) => (
              <Show when={i() == context?.currentlyShowing()}>
                <Motion.div
                  initial={{ x: -5, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 5, opacity: 0 }}
                  style={{ position: 'absolute' }}
                >
                  {v.title} <Show when={v.xp != 0}>(+{v.xp} xp)</Show>
                </Motion.div>
              </Show>
            )}
          </For>
        </Presence>
      </div>
      <div class="battle-progress-back">
        <Motion.div
          class="battle-progress-front"
          initial={{ width: `${start() * 100}%` }}
          animate={{ width: animations() }}
          transition={{
            duration: (SHOWING_LENGTH / LEVEL_XP) * 0.75,
            width: { offset: offsets() },
          }}
        />
      </div>
      <div class="battle-bottom">
        LVL {level()}{' '}
        <Motion.span animate={{ opacity: context?.pending()?.length == 0 ? 0.5 : 1 }}>
          ({experience()}/{(level() + 1) * LEVEL_XP}xp)
        </Motion.span>
      </div>
    </div>
  );
}

export interface PendingBattlePassReward {
  title: string;
  xp: number;
}

interface BattlePassContextInterface {
  reward: (title: string, xp: number) => void;
  pending: Accessor<PendingBattlePassReward[]>;
  currentlyShowing: () => number;
  incrementSessionSolveStreak: () => void;
  resetSessionSolveStreak: () => void;
  handleCheckIn: () => void;
  battlePass: Accessor<BattlePass>;
}

const SHOWING_LENGTH = 1250;
const LEVEL_XP = 1000;
const DAILY_LIMIT = LEVEL_XP * 7;

interface BattlePass {
  // YYYY-MM-DD of the last login
  // for daily rewards and streaks
  lastLogin: string;
  // used to track streak breaks
  lastLoginTime: number;
  // login streak length
  loginStreak: number;

  // for limiting daily xp
  dailyLimitUsage: number;
  // battle pass window
  // YYYY-MM
  window: string;

  // current amount of experience
  xp: number;
  // games played during the window
  gamesPlayed: number;
}

const calcLogin = (now: Date) => `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
const calcWindow = (now: Date) => `${now.getFullYear()}-${now.getMonth()}`;

const defaultBattlePass = (): BattlePass => {
  const now = new Date();

  return {
    lastLogin: 'never',
    lastLoginTime: Date.now(),
    loginStreak: 0,
    dailyLimitUsage: 0,
    window: calcWindow(now),
    xp: 0,
    gamesPlayed: 0,
  };
};

export const BattlePassContext = createContext<BattlePassContextInterface>();
export const BattlePassProvider: ParentComponent = (props) => {
  const [pending, setPending] = createSignal<PendingBattlePassReward[]>([]);
  const [showingLength, setShowingLength] = createSignal<number>(-1);

  const [sessionSolveStreak, setSessionSolveStreak] = createSignal(0);

  const [battlePass, setBattlePass] = createSignal(load('battlepass', defaultBattlePass()));

  createEffect(() => {
    save('battlepass', battlePass());
  });

  onMount(() => {
    // don't even want to think about the reactive implications
    setTimeout(() => handleCheckIn(), SHOWING_LENGTH);
  });

  const reward = (title: string, xp: number) =>
    batch(() => {
      const limitReached = battlePass().dailyLimitUsage >= DAILY_LIMIT;
      if (showingLength() == -1) {
        if (limitReached) setPending([...pending(), { title: '🚧 reached daily XP limit', xp: 0 }]);
        setShowingLength(0);
      }
      const overNumber = battlePass().dailyLimitUsage + xp - DAILY_LIMIT;
      setBattlePass({
        ...battlePass(),
        dailyLimitUsage: Math.min(battlePass().dailyLimitUsage + xp, DAILY_LIMIT),
      });
      let surpassedDailyLimit = false;
      if (overNumber > 0 && !limitReached) {
        surpassedDailyLimit = true;
        xp -= overNumber;
      }
      const actualXp = limitReached ? 0 : xp;
      setPending([...pending(), { title, xp: actualXp }]);
      setBattlePass({ ...battlePass(), xp: battlePass().xp + actualXp });
      if (surpassedDailyLimit)
        setPending([...pending(), { title: '🚧 reached daily XP limit', xp: 0 }]);
    });

  const incrementSessionSolveStreak = () => {
    setSessionSolveStreak(sessionSolveStreak() + 1);
    if (sessionSolveStreak() == 1) return;

    const rewardXp = Math.min(sessionSolveStreak() * 75, 750);
    reward(`🔥 ${sessionSolveStreak()} session solve streak`, rewardXp);
    setBattlePass({ ...battlePass(), gamesPlayed: battlePass().gamesPlayed + 1 });
  };

  const resetSessionSolveStreak = () => {
    setSessionSolveStreak(0);
  };

  const currentlyShowing = (): number => {
    return Math.floor(showingLength() / SHOWING_LENGTH);
  };

  const handleCheckIn = () => {
    const now = new Date();
    if (battlePass().window != calcWindow(now)) {
      console.log('backing up old battle pass');
      save(`battlepass-${battlePass().window}`, battlePass());
      setBattlePass(defaultBattlePass());
      return;
    }

    const lastLoginTime = battlePass().lastLoginTime;

    if (calcLogin(now) == battlePass().lastLogin) {
      setBattlePass({ ...battlePass(), lastLoginTime: Date.now() });
      return;
    }

    reward(`🎉 daily login reward`, 300);

    setBattlePass({
      ...battlePass(),
      loginStreak: battlePass().loginStreak + 1,
      dailyLimitUsage: 0,
    });

    if (Date.now() - lastLoginTime > 1000 * 60 * 60 * 24) {
      // break the streak
      reward(`😭 login streak broken`, 10);
      setBattlePass({ ...battlePass(), loginStreak: 0 });
    } else {
      const rewardXp = Math.min(battlePass().loginStreak * 100, 700);
      reward(`🔥 ${battlePass().loginStreak} daily login streak`, rewardXp);
    }

    setBattlePass({
      ...battlePass(),
      lastLogin: calcLogin(now),
    });
  };

  onMount(() => {
    let start = Date.now();
    const loop = (t: number) => {
      frame = requestAnimationFrame(loop);

      const deltaTime = t - start;
      start = t;

      if (showingLength() != -1) {
        setShowingLength(showingLength() + deltaTime);
      }
    };

    let frame = requestAnimationFrame(loop);
    onCleanup(() => cancelAnimationFrame(frame));
  });

  createEffect(() => {
    if (showingLength() < pending().length * SHOWING_LENGTH) return;

    batch(() => {
      setPending([]);
      setShowingLength(-1);
    });
  });

  return (
    <BattlePassContext.Provider
      value={{
        reward,
        pending,
        currentlyShowing,
        incrementSessionSolveStreak,
        resetSessionSolveStreak,
        handleCheckIn,
        battlePass,
      }}
    >
      {props.children}
    </BattlePassContext.Provider>
  );
};
