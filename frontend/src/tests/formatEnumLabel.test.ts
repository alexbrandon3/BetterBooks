import { formatEnumLabel } from '../utils/formatEnumLabel';

describe('formatEnumLabel', () => {
  it('formats uppercase enum values to title case', () => {
    expect(formatEnumLabel('CASH_AND_CASH_EQUIVALENTS')).toBe('Cash And Cash Equivalents');
    expect(formatEnumLabel('CURRENT_LIABILITY')).toBe('Current Liability');
    expect(formatEnumLabel('SALES_REVENUE')).toBe('Sales Revenue');
  });

  it('returns "—" for undefined or null', () => {
    expect(formatEnumLabel(undefined)).toBe('—');
    expect(formatEnumLabel(null as any)).toBe('—');
  });

  it('handles strings without underscores', () => {
    expect(formatEnumLabel('OPERATING')).toBe('Operating');
    expect(formatEnumLabel('asset')).toBe('Asset');
  });

  it('handles empty strings gracefully', () => {
    expect(formatEnumLabel('')).toBe('—');
  });
}); 