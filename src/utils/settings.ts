import { load, save } from './validate';

export type Settings = {
  muted: boolean;
  colorBlindMode: boolean;
  darkMode: boolean;
  showSolveButton: boolean;
  strictControls: boolean;
  alternateControlStyle: boolean;
  blockPushing: boolean;
  hideTime: boolean;
  hideEndorsement: boolean;
  showBranding: boolean;
  hideTrash: boolean;
  hideBattlePass: boolean;
};

export const defaultSettings: Settings = {
  muted: false,
  colorBlindMode: false,
  showSolveButton: false,
  strictControls: false,
  alternateControlStyle: false,
  blockPushing: false,
  hideTime: false,
  hideEndorsement: false,
  showBranding: false,
  hideTrash: false,
  darkMode: false,
  hideBattlePass: false,
};

export const settingsDescription: Record<keyof Settings, [string, string]> = {
  muted: ['Muted', 'Whether to play the neat little sounds or not'],
  colorBlindMode: [
    'Color Blind Mode',
    'Turns solved numbers blue for those who are red/green colorblind',
  ],
  showSolveButton: [
    'Solve Button',
    'Shows a CPU automatic-solve button which shows the solution the computer had in mind while making the puzzle',
  ],
  strictControls: [
    'Strict Controls',
    'Makes it so that clicking/typing a domino will choose that domino type instead of cycling between domino types',
  ],
  alternateControlStyle: [
    'Alternate Control Style',
    'This only works on desktop and it makes it so that clicking does nothing and holding the respective number key down picks that domino and "paints" that domino',
  ],
  blockPushing: [
    'Disable Block Pushing',
    'Prevent the default behavior of pushing dominos away from blocks (dragging over a block will now do nothing)',
  ],
  hideTime: ['Hide Time', 'Hides the current solving time while solving'],
  hideEndorsement: [
    'Hide Endorsement',
    'Hides the play the original link (please play the original before turning this on)',
  ],
  showBranding: ['Show Branding', 'Shows dominogod logo and header'],
  hideTrash: ['Hide Trash', 'Hides the trash/clear board button'],
  darkMode: ['Dark Mode', 'The domino night has come once more'],
  hideBattlePass: ['Hide Battle Pass', 'Battle pass is still active but the level bar is disabled'],
};

export const saveSettings = (settings: Settings) => save('settings', settings);
export const loadSettings = (): Settings => load('settings', defaultSettings);
