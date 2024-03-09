import { z } from 'zod';

const SettingsObject = z.object({
  color_blind_mode: z.boolean().default(false),
  show_solve_button: z.boolean().default(false),
  strict_controls: z.boolean().default(false),
  hide_time: z.boolean().default(false),
  hide_endorsement: z.boolean().default(false),
  hide_trash: z.boolean().default(false),
});

type Settings = z.infer<typeof SettingsObject>;

const settingsDescription: Record<keyof Settings, [string, string]> = {
  color_blind_mode: [
    'Color Blind Mode',
    'Turns solved numbers blue for those who are red/green colorblind',
  ],
  show_solve_button: [
    'Solve Button',
    'Shows a CPU automatic-solve button which shows the solution the computer had in mind while making the puzzle',
  ],
  strict_controls: [
    'Strict Controls',
    'Makes it so that clicking a domino will choose that domino type instead of cycling between domino types',
  ],
  hide_time: ['Hide Time', 'Hides the current solving time while solving'],
  hide_endorsement: [
    'Hide Endorsement',
    'Hides the play the original link (please play the original before turning this on)',
  ],
  hide_trash: ['Hide Trash', 'Hides the trash/clear board button'],
};

export type { Settings };
export { settingsDescription, SettingsObject };
