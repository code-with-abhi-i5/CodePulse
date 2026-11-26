export interface LanguageMastery {
  name: string;
  level: string; // e.g. "Master", "Expert", "Advanced"
  mastery: number; // e.g. 96 (%)
  color?: string;
}

export interface Mentor {
  id: string;
  username: string;
  name: string;
  role: string;
  company?: string;
  avatarUrl: string;
  bio: string;
  similarityScore: number; // e.g. 94
  topLanguages: LanguageMastery[];
  matchingTech: string[];
  timezoneOffset: string; // e.g. "UTC+2", "UTC-5", "UTC+5:30"
  experienceGap: number; // years
  isAvailableNow: boolean;
  rating: number;
  sessionsCompleted: number;
  availableSlots: number;
  isMentor?: boolean;
}

export interface MentorshipRequestInput {
  mentorId: string;
  mentorUsername: string;
  projectGoals: string;
  expectedHours: number;
  message: string;
  menteeUsername?: string;
}

export interface MentorshipRequestResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    mentorUsername: string;
    projectGoals: string;
    expectedHours: number;
    message: string;
    status: 'pending' | 'accepted' | 'declined';
    createdAt: string;
  };
}

export const INITIAL_MENTORS: Mentor[] = [
  {
    id: 'm-elena',
    username: 'elena_rust',
    name: 'Elena Rostova',
    role: 'Principal Systems Architect',
    company: 'LowLatency Systems',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    bio: 'Building zero-cost abstractions, distributed consensus engines, and memory-safe systems with high concurrency.',
    similarityScore: 96,
    topLanguages: [
      { name: 'Rust', level: 'Master', mastery: 98, color: '#f74c00' },
      { name: 'C++', level: 'Expert', mastery: 92, color: '#f34b7d' },
      { name: 'Go', level: 'Advanced', mastery: 85, color: '#00add8' },
    ],
    matchingTech: ['Rust', 'WASM', 'Systems', 'Distributed Systems'],
    timezoneOffset: 'UTC+2',
    experienceGap: 9,
    isAvailableNow: true,
    rating: 4.98,
    sessionsCompleted: 42,
    availableSlots: 2,
    isMentor: true,
  },
  {
    id: 'm-marcus',
    username: 'marcus_vance',
    name: 'Marcus Vance',
    role: 'Staff Frontend Architect',
    company: 'NextGen Interfaces',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    bio: 'Full-stack UI/UX architect specializing in Next.js micro-frontends, WebGL experiences, and high-performance render engines.',
    similarityScore: 94,
    topLanguages: [
      { name: 'TypeScript', level: 'Master', mastery: 96, color: '#3178c6' },
      { name: 'React', level: 'Master', mastery: 95, color: '#61dafb' },
      { name: 'JavaScript', level: 'Expert', mastery: 90, color: '#f7df1e' },
    ],
    matchingTech: ['TypeScript', 'React', 'Next.js', 'Web Performance'],
    timezoneOffset: 'UTC-5',
    experienceGap: 7,
    isAvailableNow: false,
    rating: 4.92,
    sessionsCompleted: 35,
    availableSlots: 3,
    isMentor: true,
  },
  {
    id: 'm-aisha',
    username: 'aisha_cloud',
    name: 'Aisha Patel',
    role: 'Lead Cloud Infrastructure Engineer',
    company: 'KubeCore Networks',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    bio: 'Cloud native orchestration, Kubernetes operators, and kernel telemetry with eBPF. Helping devs scale to millions of QPS.',
    similarityScore: 92,
    topLanguages: [
      { name: 'Go', level: 'Master', mastery: 97, color: '#00add8' },
      { name: 'Python', level: 'Expert', mastery: 89, color: '#3572a5' },
      { name: 'Rust', level: 'Advanced', mastery: 81, color: '#f74c00' },
    ],
    matchingTech: ['Go', 'Kubernetes', 'gRPC', 'eBPF'],
    timezoneOffset: 'UTC+5:30',
    experienceGap: 6,
    isAvailableNow: true,
    rating: 4.95,
    sessionsCompleted: 28,
    availableSlots: 1,
    isMentor: true,
  },
  {
    id: 'm-liam',
    username: 'liam_ai',
    name: 'Liam Tanaka',
    role: 'Staff ML & Inference Engineer',
    company: 'TensorScale',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    bio: 'Deep learning engineer focused on ONNX runtime optimizations, LLM quantization, and real-time inference pipelines.',
    similarityScore: 94,
    topLanguages: [
      { name: 'Python', level: 'Master', mastery: 98, color: '#3572a5' },
      { name: 'Rust', level: 'Advanced', mastery: 84, color: '#f74c00' },
      { name: 'C++', level: 'Advanced', mastery: 80, color: '#f34b7d' },
    ],
    matchingTech: ['Python', 'PyTorch', 'Rust', 'LLMs'],
    timezoneOffset: 'UTC+9',
    experienceGap: 8,
    isAvailableNow: true,
    rating: 4.96,
    sessionsCompleted: 39,
    availableSlots: 2,
    isMentor: true,
  },
  {
    id: 'm-sophia',
    username: 'sophia_fullstack',
    name: 'Sophia Rodriguez',
    role: 'Principal Full-Stack Engineer',
    company: 'Veloce Data',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    bio: 'Designing distributed databases, event-driven architectures, and developer tooling. Mentor for 100+ early-career engineers.',
    similarityScore: 95,
    topLanguages: [
      { name: 'TypeScript', level: 'Master', mastery: 95, color: '#3178c6' },
      { name: 'Go', level: 'Expert', mastery: 91, color: '#00add8' },
      { name: 'Python', level: 'Master', mastery: 94, color: '#3572a5' },
    ],
    matchingTech: ['TypeScript', 'Node.js', 'PostgreSQL', 'Go'],
    timezoneOffset: 'UTC-8',
    experienceGap: 10,
    isAvailableNow: false,
    rating: 4.99,
    sessionsCompleted: 64,
    availableSlots: 4,
    isMentor: true,
  },
];

export async function fetchMentors(params?: { search?: string; language?: string }): Promise<Mentor[]> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.language && params.language !== 'All') searchParams.set('language', params.language);

    const queryStr = searchParams.toString();
    const url = `/api/v1/mentorship${queryStr ? `?${queryStr}` : ''}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch mentors: ${response.status}`);
    }
    const result = await response.json();
    return result.data || result;
  } catch (err) {
    // Graceful fallback to client-filtered list
    let filtered = [...INITIAL_MENTORS];
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.username.toLowerCase().includes(q) ||
          m.bio.toLowerCase().includes(q) ||
          m.matchingTech.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (params?.language && params.language !== 'All') {
      const lang = params.language.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.topLanguages.some((l) => l.name.toLowerCase() === lang) ||
          m.matchingTech.some((t) => t.toLowerCase() === lang)
      );
    }
    return filtered;
  }
}

export async function submitMentorshipRequest(
  data: MentorshipRequestInput
): Promise<MentorshipRequestResponse> {
  const response = await fetch('/api/v1/mentorship/request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to submit mentorship request');
  }

  return response.json();
}

export async function toggleBecomeMentor(data: {
  isMentor: boolean;
  availableSlots?: number;
}): Promise<{ success: boolean; isMentor: boolean; availableSlots: number }> {
  const response = await fetch('/api/v1/mentorship/become-mentor', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to update mentor status');
  }

  return response.json();
}
