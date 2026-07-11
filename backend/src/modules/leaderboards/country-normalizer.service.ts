import { Injectable } from '@nestjs/common';

@Injectable()
export class CountryNormalizerService {
  normalize(location: string | null | undefined): string | null {
    if (!location) return null;
    const loc = location.toLowerCase();

    // Map of common cities/terms to India
    const indiaKeywords = [
      'india', 'ind', 'in', 'bharat',
      'bangalore', 'bengaluru', 'mumbai', 'bombay',
      'delhi', 'new delhi', 'ncr', 'gurgaon', 'noida',
      'hyderabad', 'chennai', 'madras', 'pune',
      'kolkata', 'calcutta', 'ahmedabad', 'jaipur',
      'surat', 'lucknow', 'kanpur', 'nagpur',
      'indore', 'thane', 'bhopal', 'visakhapatnam',
      'pimpri', 'patna', 'vadodara', 'ghaziabad',
      'ludhiana', 'agra', 'nashik', 'faridabad',
      'meerut', 'rajkot', 'kalyan', 'vasai', 'varanasi',
      'srinagar', 'aurangabad', 'dhanbad', 'amritsar',
      'navi mumbai', 'allahabad', 'ranchi', 'howrah',
      'coimbatore', 'jabalpur', 'gwalior', 'vijayawada',
      'jodhpur', 'madurai', 'raipur', 'kota', 'guwahati',
      'chandigarh', 'solapur', 'hubli', 'dharwad',
      'bareilly', 'moradabad', 'mysore', 'mysuru',
      'gurugram', 'aligarh', 'jalandhar', 'tiruchirappalli',
      'bhubaneswar', 'salem', 'mira', 'bhayandar',
      'thiruvananthapuram', 'bhiwandi', 'saharanpur',
      'gorakhpur', 'guntur', 'bikaner', 'amravati',
      'noida', 'jamshedpur', 'bhilai', 'cuttack',
      'firozabad', 'kochi', 'nellore', 'bhavnagar',
      'dehradun', 'durgapur', 'asansol', 'rourkela',
      'nanded', 'kolhapur', 'ajmer', 'akul',
      'gulbarga', 'jamnagar', 'ujjain', 'loni',
      'siliguri', 'jhansi', 'ulhasnagar', 'jammu',
      'sangli', 'miraj', 'kupwad', 'mangalore',
      'erode', 'belgaum', 'kurnool', 'ambattur',
      'rajahmundry', 'tirunelveli', 'malegaon',
      'gaya', 'udaipur', 'kakinada', 'davangere',
      'kozhikode', 'akola', 'tumkur', 'bhagalpur',
      'bellary', 'khandwa', 'jharkhand', 'bihar',
      'maharashtra', 'karnataka', 'tamil nadu',
      'gujarat', 'rajasthan', 'uttar pradesh',
      'west bengal', 'madhya pradesh', 'kerala',
      'punjab', 'haryana', 'assam', 'odisha',
      'chhattisgarh', 'telangana', 'andhra pradesh'
    ];

    for (const keyword of indiaKeywords) {
      if (loc.includes(keyword)) {
        return 'India';
      }
    }

    // Default to the original string for other countries
    return location.trim();
  }
}
