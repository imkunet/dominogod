import { z } from 'zod';
import { zu } from 'zod_utilz';

export const SettingsObject = z.object({
  colorBlindMode: z.boolean().default(false),
  showSolveButton: z.boolean().default(false),
  strictControls: z.boolean().default(false),
  hideTime: z.boolean().default(false),
  hideEndorsement: z.boolean().default(false),
  hideTrash: z.boolean().default(false),
});

export type Settings = z.infer<typeof SettingsObject>;

export const settingsDescription: Record<keyof Settings, [string, string]> = {
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
  hideTime: ['Hide Time', 'Hides the current solving time while solving'],
  hideEndorsement: [
    'Hide Endorsement',
    'Hides the play the original link (please play the original before turning this on)',
  ],
  hideTrash: ['Hide Trash', 'Hides the trash/clear board button'],
};

export const saveSettings = (settings: Settings) => {
  localStorage.setItem('settings', JSON.stringify(settings));
};

export const loadSettings = (): Settings => {
  const settingsString = localStorage.getItem('settings') || '{}';
  const parsed = zu.stringToJSON().pipe(SettingsObject).safeParse(settingsString);

  if (!parsed.success) {
    console.error('Failed to read settings ', parsed.error);
    localStorage.setItem('settings', '{}');
    // just try again which can cause an infinite loop
    // but this will never break... right? :)
    return loadSettings();
  }

  saveSettings(parsed.data);
  return parsed.data;
};
