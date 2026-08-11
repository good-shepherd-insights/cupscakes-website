import { type ReactElement } from 'react';
import { type StringInputProps } from 'sanity';

const MIN = 70;
const MAX = 160;

type Props = StringInputProps;

export function SeoCharCountInput(props: Props): ReactElement {
  const { value, renderDefault } = props;
  const text = typeof value === 'string' ? value : '';
  const len = text.length;
  const inRange = len >= MIN && len <= MAX;

  const baseStyle: React.CSSProperties = {
    marginTop: 6,
    fontSize: 12,
    fontWeight: 500,
    fontFamily: 'system-ui, sans-serif',
  };

  let badge: ReactElement;
  if (len === 0) {
    badge = (
      <div style={{ ...baseStyle, color: '#888' }}>
        Empty — required, {MIN}–{MAX} characters
      </div>
    );
  } else if (inRange) {
    badge = (
      <div style={{ ...baseStyle, color: '#2c8a4a' }}>
        {len} / {MAX} characters — in range
      </div>
    );
  } else if (len < MIN) {
    badge = (
      <div style={{ ...baseStyle, color: '#c14b3a' }}>
        {len} / {MAX} characters — {MIN - len} more needed
      </div>
    );
  } else {
    badge = (
      <div style={{ ...baseStyle, color: '#c14b3a' }}>
        {len} / {MAX} characters — {len - MAX} over the limit
      </div>
    );
  }

  return (
    <div>
      {renderDefault(props)}
      {badge}
    </div>
  );
}
