export interface PincodeInfo {
  state: string;
  region: string;
  tier: 'Metro' | 'Tier-1' | 'Tier-2' | 'Remote';
  codEnabled: boolean;
  transitDays: number;
}

const PIN_PREFIX_MAP: Record<string, { state: string; region: string; tier: 'Metro' | 'Tier-1' | 'Tier-2' | 'Remote'; cod: boolean; days: number }> = {
  '11': { state: 'Delhi', region: 'North', tier: 'Metro', cod: true, days: 2 },
  '12': { state: 'Haryana', region: 'North', tier: 'Tier-1', cod: true, days: 2 },
  '13': { state: 'Haryana', region: 'North', tier: 'Tier-2', cod: true, days: 3 },
  '14': { state: 'Punjab', region: 'North', tier: 'Tier-1', cod: true, days: 3 },
  '15': { state: 'Punjab', region: 'North', tier: 'Tier-2', cod: true, days: 3 },
  '16': { state: 'Chandigarh', region: 'North', tier: 'Tier-1', cod: true, days: 2 },
  '17': { state: 'Himachal Pradesh', region: 'North', tier: 'Tier-2', cod: true, days: 4 },
  '18': { state: 'Jammu & Kashmir', region: 'North', tier: 'Remote', cod: true, days: 5 },
  '19': { state: 'Jammu & Kashmir', region: 'North', tier: 'Remote', cod: false, days: 6 },
  '20': { state: 'Uttar Pradesh', region: 'North', tier: 'Tier-1', cod: true, days: 2 },
  '21': { state: 'Uttar Pradesh', region: 'North', tier: 'Tier-2', cod: true, days: 3 },
  '22': { state: 'Uttar Pradesh', region: 'North', tier: 'Tier-1', cod: true, days: 3 },
  '23': { state: 'Uttar Pradesh', region: 'North', tier: 'Tier-2', cod: true, days: 3 },
  '24': { state: 'Uttarakhand', region: 'North', tier: 'Tier-2', cod: true, days: 3 },
  '25': { state: 'Uttar Pradesh', region: 'North', tier: 'Tier-2', cod: true, days: 3 },
  '26': { state: 'Uttarakhand', region: 'North', tier: 'Tier-2', cod: true, days: 4 },
  '27': { state: 'Uttar Pradesh', region: 'North', tier: 'Tier-2', cod: true, days: 4 },
  '28': { state: 'Uttar Pradesh', region: 'North', tier: 'Tier-2', cod: true, days: 3 },
  '30': { state: 'Rajasthan', region: 'North', tier: 'Tier-1', cod: true, days: 2 },
  '31': { state: 'Rajasthan', region: 'North', tier: 'Tier-2', cod: true, days: 3 },
  '32': { state: 'Rajasthan', region: 'North', tier: 'Tier-2', cod: true, days: 3 },
  '33': { state: 'Rajasthan', region: 'North', tier: 'Tier-2', cod: true, days: 3 },
  '34': { state: 'Rajasthan', region: 'North', tier: 'Tier-2', cod: true, days: 3 },
  '36': { state: 'Gujarat', region: 'West', tier: 'Tier-2', cod: true, days: 3 },
  '37': { state: 'Gujarat', region: 'West', tier: 'Tier-2', cod: true, days: 3 },
  '38': { state: 'Gujarat', region: 'West', tier: 'Tier-1', cod: true, days: 2 },
  '39': { state: 'Gujarat', region: 'West', tier: 'Tier-1', cod: true, days: 2 },
  '40': { state: 'Maharashtra', region: 'West', tier: 'Metro', cod: true, days: 2 },
  '41': { state: 'Maharashtra', region: 'West', tier: 'Tier-1', cod: true, days: 2 },
  '42': { state: 'Maharashtra', region: 'West', tier: 'Tier-2', cod: true, days: 3 },
  '43': { state: 'Maharashtra', region: 'West', tier: 'Tier-2', cod: true, days: 3 },
  '44': { state: 'Maharashtra', region: 'West', tier: 'Tier-2', cod: true, days: 3 },
  '45': { state: 'Madhya Pradesh', region: 'Central', tier: 'Tier-1', cod: true, days: 3 },
  '46': { state: 'Madhya Pradesh', region: 'Central', tier: 'Tier-1', cod: true, days: 3 },
  '47': { state: 'Madhya Pradesh', region: 'Central', tier: 'Tier-2', cod: true, days: 3 },
  '48': { state: 'Madhya Pradesh', region: 'Central', tier: 'Tier-2', cod: true, days: 4 },
  '49': { state: 'Chhattisgarh', region: 'Central', tier: 'Tier-2', cod: true, days: 3 },
  '50': { state: 'Telangana', region: 'South', tier: 'Metro', cod: true, days: 2 },
  '51': { state: 'Andhra Pradesh', region: 'South', tier: 'Tier-2', cod: true, days: 3 },
  '52': { state: 'Andhra Pradesh', region: 'South', tier: 'Tier-1', cod: true, days: 3 },
  '53': { state: 'Andhra Pradesh', region: 'South', tier: 'Tier-1', cod: true, days: 3 },
  '56': { state: 'Karnataka', region: 'South', tier: 'Metro', cod: true, days: 2 },
  '57': { state: 'Karnataka', region: 'South', tier: 'Tier-2', cod: true, days: 3 },
  '58': { state: 'Karnataka', region: 'South', tier: 'Tier-2', cod: true, days: 3 },
  '59': { state: 'Karnataka', region: 'South', tier: 'Tier-2', cod: true, days: 3 },
  '60': { state: 'Tamil Nadu', region: 'South', tier: 'Metro', cod: true, days: 2 },
  '61': { state: 'Tamil Nadu', region: 'South', tier: 'Tier-2', cod: true, days: 3 },
  '62': { state: 'Tamil Nadu', region: 'South', tier: 'Tier-1', cod: true, days: 3 },
  '63': { state: 'Tamil Nadu', region: 'South', tier: 'Tier-2', cod: true, days: 3 },
  '64': { state: 'Tamil Nadu', region: 'South', tier: 'Tier-1', cod: true, days: 3 },
  '67': { state: 'Kerala', region: 'South', tier: 'Tier-2', cod: true, days: 3 },
  '68': { state: 'Kerala', region: 'South', tier: 'Tier-1', cod: true, days: 3 },
  '69': { state: 'Kerala', region: 'South', tier: 'Tier-1', cod: true, days: 3 },
  '70': { state: 'West Bengal', region: 'East', tier: 'Metro', cod: true, days: 2 },
  '71': { state: 'West Bengal', region: 'East', tier: 'Tier-1', cod: true, days: 3 },
  '72': { state: 'West Bengal', region: 'East', tier: 'Tier-2', cod: true, days: 3 },
  '73': { state: 'West Bengal', region: 'East', tier: 'Tier-2', cod: true, days: 4 },
  '74': { state: 'West Bengal', region: 'East', tier: 'Tier-2', cod: true, days: 4 },
  '75': { state: 'Odisha', region: 'East', tier: 'Tier-1', cod: true, days: 3 },
  '76': { state: 'Odisha', region: 'East', tier: 'Tier-2', cod: true, days: 4 },
  '77': { state: 'Odisha', region: 'East', tier: 'Tier-2', cod: true, days: 4 },
  '78': { state: 'Assam', region: 'North-East', tier: 'Tier-1', cod: true, days: 4 },
  '79': { state: 'North-East States', region: 'North-East', tier: 'Remote', cod: false, days: 6 },
  '80': { state: 'Bihar', region: 'East', tier: 'Tier-1', cod: true, days: 3 },
  '81': { state: 'Bihar', region: 'East', tier: 'Tier-2', cod: true, days: 4 },
  '82': { state: 'Bihar', region: 'East', tier: 'Tier-2', cod: true, days: 4 },
  '83': { state: 'Jharkhand', region: 'East', tier: 'Tier-1', cod: true, days: 3 },
  '84': { state: 'Bihar', region: 'East', tier: 'Tier-2', cod: true, days: 4 },
  '85': { state: 'Bihar', region: 'East', tier: 'Tier-2', cod: true, days: 4 }
};

export function lookupPincode(pincode: string): PincodeInfo | null {
  const clean = pincode.trim().replace(/\D/g, '');
  if (clean.length !== 6) return null;
  const prefix = clean.substring(0, 2);
  const info = PIN_PREFIX_MAP[prefix];
  if (!info) {
    return {
      state: 'India',
      region: 'General',
      tier: 'Tier-2',
      codEnabled: true,
      transitDays: 4
    };
  }
  return {
    state: info.state,
    region: info.region,
    tier: info.tier,
    codEnabled: info.cod,
    transitDays: info.days
  };
}

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];
