"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CountryNormalizerService = void 0;
const common_1 = require("@nestjs/common");
let CountryNormalizerService = class CountryNormalizerService {
    normalize(location) {
        if (!location)
            return null;
        const loc = location.toLowerCase();
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
        return location.trim();
    }
};
exports.CountryNormalizerService = CountryNormalizerService;
exports.CountryNormalizerService = CountryNormalizerService = __decorate([
    (0, common_1.Injectable)()
], CountryNormalizerService);
//# sourceMappingURL=country-normalizer.service.js.map