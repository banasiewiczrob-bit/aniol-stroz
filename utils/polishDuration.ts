type PolishForms = {
  one: string;
  few: string;
  many: string;
};

function selectPolishForm(value: number, forms: PolishForms) {
  const absolute = Math.abs(value);
  const lastDigit = absolute % 10;
  const lastTwoDigits = absolute % 100;

  if (absolute === 1) return forms.one;
  if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwoDigits >= 12 && lastTwoDigits <= 14)) return forms.few;
  return forms.many;
}

export function getPolishYearUnit(value: number) {
  return selectPolishForm(value, {
    one: 'rok',
    few: 'lata',
    many: 'lat',
  });
}

export function getPolishMonthUnit(value: number) {
  return selectPolishForm(value, {
    one: 'miesiąc',
    few: 'miesiące',
    many: 'miesięcy',
  });
}

export function getPolishDayUnit(value: number) {
  return selectPolishForm(value, {
    one: 'dzień',
    few: 'dni',
    many: 'dni',
  });
}

export function capitalizeFirst(value: string) {
  if (!value) return value;
  return value.charAt(0).toLocaleUpperCase('pl-PL') + value.slice(1);
}
