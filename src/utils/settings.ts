export type Settings = {
  muted: boolean;
  colorBlindMode: boolean;
  darkMode: boolean;
  showSolveButton: boolean;
  strictControls: boolean;
  blockPushing: boolean;
  hideTime: boolean;
  hideEndorsement: boolean;
  hideTrash: boolean;
};

export const defaultSettings: Settings = {
  muted: false,
  colorBlindMode: false,
  showSolveButton: false,
  strictControls: false,
  blockPushing: false,
  hideTime: false,
  hideEndorsement: false,
  hideTrash: false,
  darkMode: false,
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
  blockPushing: [
    'Disable Block Pushing',
    'Prevent the default behavior of pushing dominos away from blocks (dragging over a block will now do nothing)',
  ],
  hideTime: ['Hide Time', 'Hides the current solving time while solving'],
  hideEndorsement: [
    'Hide Endorsement',
    'Hides the play the original link (please play the original before turning this on)',
  ],
  hideTrash: ['Hide Trash', 'Hides the trash/clear board button'],
  darkMode: ['Dark Mode', 'The domino night has come once more'],
};

export const saveSettings = (settings: Settings) => {
  localStorage.setItem('settings', JSON.stringify(settings));
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validateSettings = (v: any): Settings => {
  const validSettings = { ...defaultSettings };
  let key: keyof typeof validSettings;
  for (key in validSettings) {
    const valid = validSettings[key];
    const current = v[key];
    if (current === undefined) continue;
    if (typeof valid === typeof current) {
      validSettings[key] = current;
      continue;
    }
    console.log(`Invalid setting value for ${key}: '${current}', setting to default '${valid}'`);
  }
  return validSettings;
};

export const loadSettings = (): Settings => {
  const settingsString = localStorage.getItem('settings') || '{}';

  try {
    const parsedJson = JSON.parse(settingsString);
    const settings = validateSettings(parsedJson);
    saveSettings(settings);
    return settings;
  } catch {
    const failTime = Date.now();
    console.log('Failed to parse the settings! Trying again from scratch.');
    console.log(`The old (broken) settings have been saved as 'settings-${failTime}'.`);

    localStorage.setItem(`settings-${failTime}`, settingsString);
    localStorage.setItem('settings', '{}');

    return loadSettings();
  }
};
