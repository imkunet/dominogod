import '@/styles/settings.css';
import { Accessor, For, Setter, Show } from 'solid-js';
import { Motion, Presence } from 'solid-motionone';
import { Settings, saveSettings, settingsDescription } from '@/utils/settings';
import { TbSettings, TbX } from 'solid-icons/tb';

interface SettingsProps {
  settings: Accessor<Settings>;
  settingsOpen: Accessor<boolean>;

  setSettings: Setter<Settings>;
  setSettingsOpen: Setter<boolean>;
}

export default function SettingsPanel(props: SettingsProps) {
  const closeSettings = () => props.setSettingsOpen(false);

  const set = (settings: Settings) => {
    saveSettings(settings);
    props.setSettings({ ...settings });
  };

  return (
    <>
      <Presence exitBeforeEnter>
        <Show when={props.settingsOpen()}>
          <Motion.div
            class="settings-background"
            onClick={closeSettings}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Motion.div
              class="settings-container"
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 10 }}
              animate={{ y: 0 }}
              exit={{ y: 10 }}
              transition={{ duration: 0.25 }}
            >
              <div class="settings-bar">
                <h1>
                  <TbSettings />
                  Settings
                </h1>
                <h1 onClick={closeSettings}>
                  <TbX />
                </h1>
              </div>

              {/*this has to be busted but like idk the idiomatic way*/}
              <For each={Object.keys(props.settings()) as (keyof Settings)[]}>
                {(v) => {
                  const settings = props.settings();
                  const setting = settings[v];
                  const settingType = typeof setting;
                  return (
                    <div class="setting">
                      <h2>{settingsDescription[v][0]}</h2>
                      <p>{settingsDescription[v][1]}</p>
                      {settingType === 'boolean' && (
                        <input
                          type="checkbox"
                          checked={setting}
                          onChange={() => {
                            settings[v] = !setting;
                            set(settings);
                          }}
                        />
                      )}
                    </div>
                  );
                }}
              </For>
            </Motion.div>
          </Motion.div>
        </Show>
      </Presence>
    </>
  );
}
