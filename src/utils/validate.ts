// while this is no replacement for zod
// we are aiming for a pretty small bundle size
// so it's preferable to not include external libraries
// that do a lot...

// this is HEAVILY bad, please consider never letting
// this code see the light of day :)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validate<T>(v: any, defaultValue: T): T {
  const validValue = { ...defaultValue };
  let key: keyof typeof validValue;

  for (key in validValue) {
    const valid = validValue[key];
    const current = v[key];

    if (current === undefined) continue;
    if (typeof valid === typeof current) {
      validValue[key] = current;
      continue;
    }

    console.log(
      `Invalid setting value for ${String(key)}: '${current}', setting to default '${valid}'`,
    );
  }

  return validValue;
}

export function save(key: string, v: unknown) {
  localStorage.setItem(key, JSON.stringify(v));
}

export function load<T>(key: string, defaultValue: T): T {
  const valueString = localStorage.getItem(key) || '{}';

  try {
    const parsedJson = JSON.parse(valueString);
    const validated = validate(parsedJson, defaultValue);
    save(key, validated);
    return validated;
  } catch {
    const failTime = Date.now();
    console.log(`Failed to parse ${key}! Attempting again...`);
    console.log(`The old (broken) ${key} have been saved as '${key}-${failTime}'.`);

    localStorage.setItem(`${key}-${failTime}`, valueString);
    localStorage.setItem(key, '{}');

    return load(key, defaultValue);
  }
}
