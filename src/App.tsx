/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, Component } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  X, 
  Mail, 
  Phone, 
  Linkedin, 
  Target, 
  Cpu, 
  MessageSquare,
  ArrowRight,
  Upload,
  Image as ImageIcon,
  Trash2,
  ChevronRight,
  Palette,
  Layers,
  Monitor,
  Layout,
  Zap,
  Figma,
  Github,
  Terminal,
  Code,
  Smartphone,
  Award,
  Briefcase,
  Plus,
  Settings,
  User,
  Info,
  BarChart3,
  Lightbulb,
  Sparkles,
  CheckCircle2,
  MapPin,
  Calendar,
  Building2,
  Users,
  TrendingUp,
  DollarSign,
  Globe,
  FileText,
  PieChart,
  Maximize,
  Heart,
  BookOpen,
  LogOut,
  LogIn,
  RefreshCw
} from 'lucide-react';
import { db, auth } from './firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  collection, 
  query, 
  orderBy,
  getDocFromServer,
  writeBatch
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

const compressImage = (base64Str: string, maxWidth: number, maxHeight: number, quality: number): Promise<string> => {
  return new Promise((resolve) => {
    if (!base64Str || !base64Str.startsWith('data:image')) {
      resolve(base64Str);
      return;
    }
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      
      // Try to compress. If still too large, reduce quality further.
      let result = canvas.toDataURL('image/jpeg', quality);
      if (result.length > 1000000) {
        result = canvas.toDataURL('image/jpeg', quality * 0.5);
      }
      if (result.length > 1000000) {
        // Last resort: very low quality and smaller size
        const smallCanvas = document.createElement('canvas');
        smallCanvas.width = width / 2;
        smallCanvas.height = height / 2;
        const sCtx = smallCanvas.getContext('2d');
        sCtx?.drawImage(canvas, 0, 0, smallCanvas.width, smallCanvas.height);
        result = smallCanvas.toDataURL('image/jpeg', 0.3);
      }
      resolve(result);
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  keywords: string[];
  images: string[];
  link: string;
  isPdf?: boolean;
  portfolioImage?: string;
}

interface TimelineEntry {
  id: string;
  year: string;
  company: string;
  role: string;
  description: string;
}

interface AwardEntry {
  id: string;
  year: string;
  title: string;
  organization: string;
}

interface Skill {
  id: string;
  name: string;
  iconName?: string;
  iconImage?: string;
}

interface SectionItem {
  id: string;
  iconName?: string;
  iconImage?: string;
  [key: string]: any;
}

interface ResumeSkill {
  id: string;
  name: string;
  level: '상' | '중' | '하';
}

interface ResumeExperience {
  id: string;
  period: string;
  role: string;
  company: string;
  job?: string;
}

interface ResumeLicense {
  id: string;
  name: string;
  issuer: string;
}

interface ResumeAward {
  id: string;
  name: string;
  category: string;
  issuer: string;
}

interface ResumeVolunteer {
  id: string;
  period: string;
  name: string;
  role: string;
}

interface ResumeSection {
  title: string;
  subtitle: string;
  personalInfo: {
    name: string;
    englishName: string;
    birthDate: string;
    phone: string;
    email: string;
    photo?: string;
  };
  skills: ResumeSkill[];
  experience: ResumeExperience[];
  license: ResumeLicense[];
  award: ResumeAward[];
  volunteer: ResumeVolunteer[];
  education?: {
    id: string;
    title: string;
    organizer: string;
    period: string;
    location: string;
    content: string;
  }[];
  labels?: {
    experienceTitle?: string;
    experienceSubtitle?: string;
    licenseTitle?: string;
    licenseSubtitle?: string;
    awardTitle?: string;
    awardSubtitle?: string;
    volunteerTitle?: string;
    volunteerSubtitle?: string;
    educationTitle?: string;
    educationSubtitle?: string;
  };
}

interface SectionContent {
  title: string;
  subtitle: string;
  labels?: { [key: string]: string };
  items: SectionItem[];
}

interface WorkflowStep {
  id: string;
  step: string;
  title: string;
  desc: string;
  note: string;
  icon: string;
}

interface SiteConfig {
  siteTitle: string;
  siteLogo?: string;
  heroTagline: string;
  heroSubtitle: string;
  readCaseStudyLabel: string;
  accentColor: string;
  globalFontSize: number;
  globalFontWeight: string;
  navLabels: {
    about: string;
    company: string;
    project: string;
    subcontract: string;
  };
  footerContact: {
    email: string;
    phone: string;
  };
  footerTitle: string;
  footerSubtitle: string;
  copyright: string;
  showBackgroundImage: boolean;
  backgroundImage?: string;
  expertiseLabel: string;
  expertiseTitle: string;
  workflowSectionTitle: string;
  workflowTitleLeft: string;
  workflowTitleRight: string;
  experienceTitle: string;
  awardsTitle: string;
  projectsLabel: string;
  projectsTitle: string;
  skills: Skill[];
  workflowLeft: WorkflowStep[];
  workflowRight: WorkflowStep[];
  portfolioPdfUrl?: string;
  portfolioPdfName?: string;
  portfolioPdfButtonText?: string;
  portfolioPdfDesc?: string;
  sections: {
    about: ResumeSection;
    company: SectionContent;
    project: SectionContent;
    subcontract: SectionContent;
  };
}

const initialProjects: Project[] = [
  {
    id: '1',
    title: '아이오트러스트 (IoTrust)',
    category: 'BX/UX Design',
    description: '하드웨어 월렛 디센트(D\'CENT)의 브랜드 아이덴티티 강화 및 사용자 경험 개선. Web3 생태계에서의 신뢰감 있는 비주얼 전략 수립.',
    keywords: ['Web3', 'Blockchain', 'Hardware Wallet', 'Brand Identity'],
    images: ['https://picsum.photos/seed/iotrust/1200/800'],
    link: '#PROJECT',
    portfolioImage: '아이오트러스트.png'
  },
  {
    id: '2',
    title: '(주)브로스코',
    category: 'Product Design',
    description: '브로스코의 브랜드 아이덴티티 및 제품 디자인 고도화. 캐릭터 IP를 활용한 다양한 제품 기획 및 디자인.',
    keywords: ['Product Design', 'Brand Identity', '3D Assets', 'IP Business'],
    images: ['https://picsum.photos/seed/brosko/1200/800'],
    link: '#PROJECT',
    portfolioImage: '브로스코.png'
  },
  {
    id: '3',
    title: '글라이드 (Glyde)',
    category: 'E-commerce Design',
    description: '신선식품 D2C 플랫폼의 모바일 앱 고도화 및 프로모션 디자인. 사용자 구매 전환율 향상을 위한 UX 최적화.',
    keywords: ['E-commerce', 'D2C', 'Mobile App', 'Conversion UX'],
    images: ['https://picsum.photos/seed/glyde/1200/800'],
    link: '#PROJECT',
    portfolioImage: '글라이드.png'
  }
];

const initialTimeline: TimelineEntry[] = [
  {
    id: '1',
    year: '2022 - 2026',
    company: '아이오트러스트 (IoTrust)',
    role: 'BX Designer & AI Lead',
    description: '브랜드 아이덴티티 강화 및 AI 워크플로우 도입 주도.'
  },
  {
    id: '2',
    year: '2020 - 2022',
    company: '머티리얼즈파크',
    role: 'Global VMD & E-commerce Operations',
    description: '글로벌 VMD 전략 수립 및 이커머스 운영 최적화.'
  },
  {
    id: '3',
    year: '2018 - 2020',
    company: '글라이드 (하림그룹)',
    role: 'Performance BX Designer',
    description: '퍼포먼스 마케팅 기반의 브랜드 디자인 및 UX 개선.'
  },
  {
    id: '4',
    year: '2015 - 2018',
    company: '카카오 / 브로스코 / 한국정보기술',
    role: '디자인 인턴 및 실무 경험',
    description: '다양한 IT 기업에서의 디자인 실무 및 리서치 경험.'
  }
];

const initialAwards: AwardEntry[] = [
  { id: '1', year: '2023', title: 'MOS Excel® Expert', organization: 'Microsoft' },
  { id: '2', year: '2023', title: 'MOS Word® Expert', organization: 'Microsoft' },
  { id: '3', year: '2023', title: 'MOS PowerPoint® Expert', organization: 'Microsoft' },
  { id: '4', year: '2022', title: '컴퓨터그래픽스운용기능사', organization: '한국산업인력공단' }
];

const initialSiteConfig: SiteConfig = {
  siteTitle: 'HEE SEUNG PF',
  siteLogo: '',
  heroTagline: '기획서대로 그리는 작업을 넘어, 비즈니스의 성과를 디자인합니다.',
  heroSubtitle: '기획부터 디자인 그리고 GA분석까지 하는 BX디자이너 고희승입니다.',
  readCaseStudyLabel: '이력서 바로 보기',
  accentColor: '#8B5CF6',
  globalFontSize: 16,
  globalFontWeight: '400',
  navLabels: {
    about: 'RESUME',
    company: 'COMPANY DESCRIPTION',
    project: 'PROJECT',
    subcontract: 'SUBCONTRACT'
  },
  footerContact: {
    email: 'fp221227@gmail.com',
    phone: '010-XXXX-XXXX'
  },
  footerTitle: "Let's Create Something",
  footerSubtitle: "Extraordinary",
  copyright: "© 2024 HEE SEUNG PF. All rights reserved.",
  showBackgroundImage: false,
  backgroundImage: undefined,
  expertiseLabel: 'Expertise',
  expertiseTitle: 'Skill & Workflow',
  workflowSectionTitle: 'AI Workflow for Designers',
  workflowTitleLeft: 'Design Workflow',
  workflowTitleRight: 'AI Workflow',
  experienceTitle: 'Experience',
  awardsTitle: 'License',
  projectsLabel: 'Selected Works',
  projectsTitle: 'Main Projects',
  skills: [
    { id: '1', name: 'Photoshop', iconImage: 'https://upload.wikimedia.org/wikipedia/commons/a/af/Adobe_Photoshop_CC_icon.svg' },
    { id: '2', name: 'Illustrator', iconImage: 'https://upload.wikimedia.org/wikipedia/commons/f/fb/Adobe_Illustrator_CC_icon.svg' },
    { id: '5', name: 'XD', iconImage: 'https://upload.wikimedia.org/wikipedia/commons/c/c2/Adobe_XD_CC_icon.svg' },
    { id: '14', name: 'Powerpoint', iconImage: 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Microsoft_Office_PowerPoint_%282019%E2%80%93present%29.svg' },
    { id: '3', name: 'Figma', iconImage: 'https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg' },
    { id: '4', name: 'Sketch', iconImage: 'https://upload.wikimedia.org/wikipedia/commons/5/59/Sketch_Logo.svg' },
    { id: '7', name: 'Gemini', iconImage: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg' },
    { id: '8', name: 'Dzine', iconImage: 'https://framerusercontent.com/images/X6vJ6vX6vJ6vX6vJ6vX6vJ6v.png' },
    { id: '9', name: 'Claude', iconImage: 'https://upload.wikimedia.org/wikipedia/commons/c/c2/Claude_AI_logo.svg' },
    { id: '10', name: 'GitHub', iconImage: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg' },
    { id: '11', name: 'VS Code', iconImage: 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Visual_Studio_Code_1.35_icon.svg' },
    { id: '13', name: 'Capcut', iconImage: 'https://upload.wikimedia.org/wikipedia/commons/0/0e/CapCut_logo.svg' }
  ],
  workflowLeft: [
    { id: '1', step: '01', title: 'Research', desc: '시장 조사 및 경쟁사 분석을 통한 인사이트 도출', note: '', icon: 'BarChart3' },
    { id: '2', step: '02', title: 'Strategy', desc: '브랜드 전략 수립 및 핵심 가치 정의', note: '', icon: 'Lightbulb' },
    { id: '3', step: '03', title: 'Design', desc: '비주얼 아이덴티티 및 UI/UX 디자인 시스템 구축', note: '', icon: 'Palette' },
    { id: '4', step: '04', title: 'Review', desc: '사용자 테스트 및 피드백 기반의 디자인 고도화', note: '', icon: 'CheckCircle2' }
  ],
  workflowRight: [
    { id: '1', step: '01', title: 'Analysis', desc: 'GA분석 및 데이터 기반의 사용자 페르소나 도출', note: '', icon: 'BarChart3' },
    { id: '2', step: '02', title: 'Ideation', desc: 'Gemini & Claude를 활용한 컨셉 브레인스토밍', note: '', icon: 'Lightbulb' },
    { id: '3', step: '03', title: 'Generation', desc: 'Dzine & AI 툴을 이용한 고퀄리티 비주얼 에셋 생성', note: '', icon: 'Sparkles' },
    { id: '4', step: '04', title: 'Output', desc: '일관성 있는 디자인 시스템 구축 및 3D 아이콘 생성 가이드 적용', note: '"3D 아이콘 생성 가이드: 일관된 조명값과 재질감을 유지하며 브랜드 아이덴티티를 강화하는 워크플로우..."', icon: 'CheckCircle2' }
  ],
  portfolioPdfUrl: '',
  portfolioPdfName: '고희승_포트폴리오_2025.pdf',
  portfolioPdfButtonText: 'Download PDF',
  portfolioPdfDesc: '회사 별 작업했던 문서가 있는 파일로, 구글Ndrive로 연결되며 \'파일을 미리 볼 수 없습니다…\' 문구 하단 청색 \'다운로드\' 버튼을 눌러 고희승_포트폴리오_2025.pdf를 다운로드 해주시기 바랍니다. (용량:4.5MB)',
  sections: {
    about: {
      title: 'RESUME',
      subtitle: '개인정보 내용으로 해당 페이지는 무단 복제/ 공유 불가하며 담당자만 열람 가능합니다.',
      personalInfo: {
        name: '고희승',
        englishName: 'Ko Hee Seung',
        birthDate: '1993. 06. 04',
        phone: '+82 10 - 6333 - 6419',
        email: 'fp2213@naver.com',
        photo: 'https://picsum.photos/seed/profile/400/400'
      },
      skills: [
        { id: '1', name: 'Photoshop', level: '상' },
        { id: '2', name: 'Illustrator', level: '상' },
        { id: '5', name: 'XD', level: '중' },
        { id: '14', name: 'Powerpoint', level: '상' },
        { id: '3', name: 'Figma', level: '상' },
        { id: '4', name: 'Sketch', level: '상' },
        { id: '7', name: 'Gemini', level: '상' },
        { id: '8', name: 'Dzine', level: '중' },
        { id: '9', name: 'Claude', level: '상' },
        { id: '10', name: 'GitHub', level: '중' },
        { id: '11', name: 'VS Code', level: '상' },
        { id: '13', name: 'Capcut', level: '중' }
      ],
      experience: [
        { id: '1', period: '2015. 12. 08 - 2016. 06. 08', role: 'UX Research Part', company: 'Kakao', job: '' },
        { id: '2', period: '2016. 03. 12 - 2018. 02. 28', role: '마케팅팀', company: 'Brosco', job: '' },
        { id: '3', period: '2018. 03. 12 - 2020. 03. 31', role: '디자인팀', company: '한국정보기술', job: '' },
        { id: '4', period: '2020. 06. 08 - 2023. 06. 30', role: 'C.X Unit', company: 'glyde', job: '' }
      ],
      license: [
        { id: '1', name: '컴퓨터 그래픽스운용기능사 1급', issuer: '한국산업인력공단' },
        { id: '2', name: '그래픽기술자격(GTQ) 1급', issuer: '한국생산성본부' },
        { id: '3', name: 'MOS PowerPoint® 2010', issuer: 'Microsoft' },
        { id: '4', name: 'MOS Word® 2010 Expert', issuer: 'Microsoft' },
        { id: '5', name: 'MOS Excel® 2010 Expert', issuer: 'Microsoft' }
      ],
      award: [
        { id: '1', name: '제18회 통일문화제 / 웹 디자인 부분 특선', category: '웹 디자인', issuer: '평화문화재단' },
        { id: '2', name: 'KSDT 한국디자인트렌드대전 / 광고 부문 입선', category: '광고', issuer: '한국디자인트렌드학회' },
        { id: '3', name: '제19회 커뮤니케이션 디자인 국제공모전 / 일러스트 부분 특선', category: '일러스트', issuer: '한국커뮤니케이션디자인협회' },
        { id: '4', name: '제17회 대한민국통일미술대전 / 팀별 일러스트 부분 입선', category: '일러스트', issuer: '평화문화재단' },
        { id: '5', name: 'KSDT 사이버디자인트렌드공모전 / 포스터 부분 입선', category: '포스터', issuer: '한국디자인트렌드학회' },
        { id: '6', name: '2013 전국대학생디자인공모전 2인1조 / 일러스트 부분 입선', category: '일러스트', issuer: 'Blue Award' },
        { id: '7', name: '2014 SOKI 국제디자인 일러스트레이션 공모전 / 일러스트 부분', category: '일러스트', issuer: '한국일러스트아트협회' }
      ],
      volunteer: [
        { id: '1', period: '2016. 03 - 2016. 03', name: '(주)카카오 봉사', role: '베트남 자원봉사단' },
        { id: '2', period: '2012. 04 - 2014. 06', name: '학부 자원봉사', role: '지체 장애인 아동 미술 치료' },
        { id: '3', period: '2013. 05 - 2013. 10', name: '판교푸른학교', role: '미술 보조 교사' }
      ],
      education: [
        {
          id: '1',
          title: '디지털 마케팅 인사이트 2023',
          organizer: '테크42',
          period: '2022. 11. 22(화) / 7시간',
          location: '잠실롯데호텔 3F 크리스탈볼룸',
          content: '국내외 유수 기업들의 2023년 마케팅의 방향성과 인사이트 도출 강의'
        },
        {
          id: '2',
          title: '사내 인플루언서 양성 프로젝트 2기',
          organizer: 'KMA Learning Center',
          period: '2020.07.02 - 03 / 16시간',
          location: 'FASTFIVE 시청점',
          content: '각 회사에 맞는 콘텐츠 컨설팅부터 기획, 제작 방법, 실습 강의'
        }
      ],
      labels: {
        experienceTitle: 'Experience',
        experienceSubtitle: 'PROFESSIONAL JOURNEY',
        licenseTitle: 'License',
        licenseSubtitle: 'CERTIFICATIONS',
        awardTitle: 'Award',
        awardSubtitle: 'RECOGNITIONS',
        volunteerTitle: 'Volunteer',
        volunteerSubtitle: 'SOCIAL CONTRIBUTION',
        educationTitle: 'EDUCATION / OFFLINE LECTURE',
        educationSubtitle: 'LEARNING & GROWTH'
      }
    },
    company: {
      title: 'Let me introduce my past companies',
      subtitle: '이전 근무지 요약본',
      labels: {
        name: 'Company Name',
        role: '직무',
        period: 'Period',
        reason: '퇴사 사유',
        business: '사업 분야',
        scale: '회사 규모',
        revenue: '연매출',
        employees: '임직원 수',
        workplace: '근무지'
      },
      items: [
        { id: '1', name: '아이오트러스트', role: 'BX Designer', period: '2022 - 2026', reason: '-', business: 'Blockchain/Web3', scale: 'Mid-size', revenue: '-', employees: '50+', workplace: 'Seoul, Korea' }
      ]
    },
    project: {
      title: 'Let me introduce my past projects',
      subtitle: '이전 회사 프로젝트 요약본',
      labels: {
        company: 'Company',
        name: 'Project Name',
        desc: 'Description',
        image: 'Project Image',
        contribution: 'Contribution',
        period: 'Period',
        size: 'Project Size'
      },
      items: [
        { id: '1', company: '아이오트러스트', name: 'D\'CENT Wallet UX', desc: 'Hardware wallet UX improvement', image: '', contribution: '100%', period: '6 months', size: 'Mobile App', iconName: 'Layout' }
      ]
    },
    subcontract: {
      title: 'Outsourcing/personal work design',
      subtitle: '외주/개인 작업 디자인',
      labels: {
        client: 'Client Name',
        request: 'Project Requirement',
        image: 'Project Image',
        contribution: 'Contribution',
        period: 'Period'
      },
      items: [
        { id: '1', client: 'Personal Client', request: 'Logo Design', image: '', contribution: '100%', period: '2 weeks', iconName: 'Zap' }
      ]
    }
  }
};

// --- Components ---

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      let errorDetail = "";
      
      if (this.state.error instanceof Error) {
        try {
          const parsed = JSON.parse(this.state.error.message);
          errorMessage = `Database Error: ${parsed.error}`;
          errorDetail = `Operation: ${parsed.operationType} on ${parsed.path}`;
        } catch (e) {
          errorMessage = this.state.error.message || String(this.state.error);
        }
      } else {
        errorMessage = String(this.state.error);
      }

      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-[20px] max-w-md">
            <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
            <p className="text-white/60 text-sm mb-2">{errorMessage}</p>
            {errorDetail && <p className="text-[10px] text-white/20 font-mono mb-6 uppercase tracking-widest">{errorDetail}</p>}
            <button 
              onClick={() => window.location.reload()}
              className="bg-accent-purple px-6 py-2 rounded-[10px] font-bold hover:bg-accent-purple/80 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

const AutoShrinkText = ({ text, className = "" }: { text: string; className?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState(24);

  useEffect(() => {
    if (!containerRef.current || !textRef.current) return;

    const adjustFontSize = () => {
      let currentSize = 24;
      textRef.current!.style.fontSize = `${currentSize}px`;

      while (
        (textRef.current!.offsetWidth > containerRef.current!.offsetWidth - 40 ||
        textRef.current!.offsetHeight > containerRef.current!.offsetHeight - 40) &&
        currentSize > 12
      ) {
        currentSize -= 1;
        textRef.current!.style.fontSize = `${currentSize}px`;
      }
      setFontSize(currentSize);
    };

    adjustFontSize();
    window.addEventListener('resize', adjustFontSize);
    return () => window.removeEventListener('resize', adjustFontSize);
  }, [text]);

  return (
    <div ref={containerRef} className={`shape-text-container ${className}`}>
      <span ref={textRef} className="shape-text" style={{ fontSize: `${fontSize}px` }}>
        {text}
      </span>
    </div>
  );
};

const BackgroundGraphic = ({ showImage, imageUrl }: { showImage: boolean, imageUrl?: string }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-accent-purple/15 blur-[120px] mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-accent-purple/10 blur-[150px] mix-blend-screen" />
      <div className="absolute top-[30%] right-[10%] w-[40%] h-[40%] rounded-full bg-accent-purple/5 blur-[100px] mix-blend-screen" />
      
      {/* Custom Background Image */}
      {showImage && imageUrl && (
        <div 
          className="absolute inset-0 w-full h-full opacity-[0.15]" 
          style={{ 
            backgroundImage: `url(${imageUrl})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
      )}

      {/* Default Fixed Image (if no image but showImage is true) */}
      {showImage && !imageUrl && (
        <div 
          className="absolute inset-0 w-full h-full opacity-[0.15]" 
          style={{ 
            backgroundImage: `url(https://picsum.photos/seed/default-bg/1920/1080)`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
      )}
    </div>
  );
};

const SectionModal = ({ 
  isOpen, 
  onClose, 
  content, 
  type,
  siteConfig
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  content?: SectionContent;
  type: string;
  siteConfig: SiteConfig;
}) => {
  if (!isOpen) return null;

  const IconComponent = (name?: string, image?: string) => {
    if (image) return <img src={image} className="w-6 h-6 object-contain" />;
    const icons: any = {
      Palette, Layers, Figma, Monitor, Layout, Zap, Cpu, Terminal, Github, Code,
      User, BarChart3, Lightbulb, Sparkles, CheckCircle2, MapPin, Calendar, Building2,
      Users, TrendingUp, DollarSign, Globe, FileText, PieChart, Maximize, Briefcase
    };
    const Icon = icons[name || 'Layout'] || Layout;
    return <Icon size={24} className="text-accent-purple" />;
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-2xl p-6 overflow-y-auto"
      >
        <div className="max-w-5xl mx-auto pt-24">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-4xl font-bold mb-2 uppercase tracking-tighter">
                {type === 'portfolio' ? 'PROJECT' : content?.title}
              </h2>
              <p className="text-white/40 text-sm max-w-2xl">
                {type === 'portfolio' ? '고희승 포트폴리오 2025' : content?.subtitle}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-[10px]">
              <X size={32} />
            </button>
          </div>

          <div className="space-y-8">
            {type === 'about' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Left Column: Personal Info & Skills */}
                <div className="space-y-12">
                  <div className="space-y-8">
                    <div className="w-56 h-56 rounded-full overflow-hidden border-4 border-accent-purple/20 mx-auto lg:mx-0 shadow-2xl shadow-accent-purple/10">
                      <img src={(content as any).personalInfo?.photo} alt={(content as any).personalInfo?.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="text-center lg:text-left space-y-4">
                      <div>
                        <h3 className="text-4xl font-bold mb-1 tracking-tight">{(content as any).personalInfo?.name}</h3>
                        <p className="text-accent-purple font-medium tracking-widest text-sm">{(content as any).personalInfo?.englishName}</p>
                      </div>
                      <div className="space-y-3 text-sm text-white/60 bg-white/5 p-6 rounded-[20px] border border-white/5 inline-block lg:block w-full">
                        <div className="flex items-center gap-3 justify-center lg:justify-start">
                          <Calendar size={16} className="text-accent-purple" />
                          <span className="font-mono">{(content as any).personalInfo?.birthDate}</span>
                        </div>
                        <div className="flex items-center gap-3 justify-center lg:justify-start">
                          <Smartphone size={16} className="text-accent-purple" />
                          <span className="font-mono">{(content as any).personalInfo?.phone}</span>
                        </div>
                        <div className="flex items-center gap-3 justify-center lg:justify-start">
                          <Mail size={16} className="text-accent-purple" />
                          <span className="font-mono">{(content as any).personalInfo?.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                      <Zap size={24} className="text-accent-purple" />
                      <h4 className="text-xl font-bold uppercase tracking-widest">Skills</h4>
                    </div>
                      <div className="space-y-6">
                        {(content as any).skills?.map((skill: any) => {
                          // Find the corresponding skill in siteConfig.skills to get the icon
                          const masterSkill = siteConfig.skills.find(s => s.id === skill.id || s.name.toLowerCase() === skill.name.toLowerCase());
                          const IconComponent = masterSkill ? ({
                            Palette, Layers, Figma, Monitor, Layout, Zap, Cpu, Terminal, Github, Code
                          }[masterSkill.iconName || ''] || Code) : Code;

                          return (
                            <div key={skill.id} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="text-accent-purple flex items-center justify-center">
                                    {masterSkill?.iconImage ? (
                                      <img src={masterSkill.iconImage} alt={skill.name} className="w-5 h-5 object-cover rounded-sm" referrerPolicy="no-referrer" />
                                    ) : (
                                      <IconComponent size={20} />
                                    )}
                                  </div>
                                  <span className="text-sm font-bold text-white/80">{skill.name}</span>
                                </div>
                                <span className="text-[10px] uppercase font-bold text-accent-purple/60">{skill.level === '상' ? 'High' : skill.level === '중' ? 'Medium' : 'Low'}</span>
                              </div>
                              <div className="flex gap-1.5">
                                {[1, 2, 3].map((i) => (
                                  <div 
                                    key={i}
                                    className={`flex-grow h-2.5 rounded-sm transition-all duration-500 ${
                                      (skill.level === '상' && i <= 3) ||
                                      (skill.level === '중' && i <= 2) ||
                                      (skill.level === '하' && i <= 1)
                                        ? 'bg-accent-purple shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                                        : 'bg-white/5 border border-white/10'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                  </div>
                </div>

                {/* Right Column: Experience, License, Award, Volunteer */}
                <div className="lg:col-span-2 space-y-20">
                  {/* Experience */}
                  <section className="space-y-8">
                    <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                      <div className="p-3 bg-accent-purple/10 rounded-2xl">
                        <Briefcase size={32} className="text-accent-purple" />
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold uppercase tracking-tight">{content.labels?.experienceTitle || 'Experience'}</h4>
                        <p className="text-[10px] text-white/40 font-bold tracking-[0.2em]">{content.labels?.experienceSubtitle || 'PROFESSIONAL JOURNEY'}</p>
                      </div>
                    </div>
                    <div className="space-y-8">
                      {(content as any).experience?.map((exp: any) => (
                        <div key={exp.id} className="group relative pl-8 border-l-2 border-white/5 hover:border-accent-purple/50 transition-colors">
                          <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-white/20 group-hover:bg-accent-purple transition-colors" />
                          <div className="flex flex-wrap justify-between items-start gap-4 mb-2">
                            <h5 className="font-bold text-xl text-white/90 group-hover:text-accent-purple transition-colors">{exp.role}</h5>
                            <span className="text-[10px] bg-white/5 px-3 py-1 rounded-full text-white/40 font-mono border border-white/5">{exp.period}</span>
                          </div>
                          <p className="text-white/50 font-medium">{exp.company}</p>
                          {exp.job && <p className="text-white/40 text-sm mt-2 leading-relaxed">{exp.job}</p>}
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* License */}
                  <section className="space-y-8">
                    <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                      <div className="p-3 bg-accent-purple/10 rounded-2xl">
                        <FileText size={32} className="text-accent-purple" />
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold uppercase tracking-tight">{content.labels?.licenseTitle || 'License'}</h4>
                        <p className="text-[10px] text-white/40 font-bold tracking-[0.2em]">{content.labels?.licenseSubtitle || 'CERTIFICATIONS'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(content as any).license?.map((lic: any) => (
                        <div key={lic.id} className="bg-white/5 p-5 rounded-[20px] border border-white/5 hover:bg-white/10 transition-colors group">
                          <div className="font-bold text-base mb-1 text-white/80 group-hover:text-white transition-colors">{lic.name}</div>
                          <div className="text-xs text-white/30 uppercase tracking-widest font-bold">{lic.issuer}</div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Award */}
                  <section className="space-y-8">
                    <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                      <div className="p-3 bg-accent-purple/10 rounded-2xl">
                        <Award size={32} className="text-accent-purple" />
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold uppercase tracking-tight">{content.labels?.awardTitle || 'Award'}</h4>
                        <p className="text-[10px] text-white/40 font-bold tracking-[0.2em]">{content.labels?.awardSubtitle || 'RECOGNITIONS'}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {(content as any).award?.map((awd: any) => (
                        <div key={awd.id} className="bg-white/5 p-5 rounded-[20px] border border-white/5 flex justify-between items-center gap-6 hover:bg-white/10 transition-colors group">
                          <div className="flex-grow">
                            <div className="font-bold text-base mb-1 text-white/80 group-hover:text-white transition-colors">{awd.name}</div>
                            <div className="text-xs text-white/30 uppercase tracking-widest font-bold">{awd.issuer}</div>
                          </div>
                          <span className="text-[10px] bg-accent-purple/10 text-accent-purple border border-accent-purple/20 px-4 py-1.5 rounded-full font-bold uppercase tracking-widest whitespace-nowrap">
                            {awd.category}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Volunteer */}
                  <section className="space-y-8">
                    <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                      <div className="p-3 bg-accent-purple/10 rounded-2xl">
                        <Heart size={32} className="text-accent-purple" />
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold uppercase tracking-tight">{content.labels?.volunteerTitle || 'Volunteer'}</h4>
                        <p className="text-[10px] text-white/40 font-bold tracking-[0.2em]">{content.labels?.volunteerSubtitle || 'SOCIAL CONTRIBUTION'}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {(content as any).volunteer?.map((vol: any) => (
                        <div key={vol.id} className="bg-white/5 p-5 rounded-[20px] border border-white/5 flex flex-wrap justify-between items-center gap-6 hover:bg-white/10 transition-colors group">
                          <div className="flex-grow">
                            <div className="font-bold text-base mb-1 text-white/80 group-hover:text-white transition-colors">{vol.name}</div>
                            <div className="text-xs text-white/40 font-medium">{vol.role}</div>
                          </div>
                          <span className="text-xs text-white/30 font-mono bg-black/20 px-3 py-1 rounded-full border border-white/5">{vol.period}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Education */}
                  {(content as any).education && (
                    <section className="space-y-8">
                      <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                        <div className="p-3 bg-accent-purple/10 rounded-2xl">
                          <BookOpen size={32} className="text-accent-purple" />
                        </div>
                        <div>
                          <h4 className="text-2xl font-bold uppercase tracking-tight">{content.labels?.educationTitle || 'EDUCATION / OFFLINE LECTURE'}</h4>
                          <p className="text-[10px] text-white/40 font-bold tracking-[0.2em]">{content.labels?.educationSubtitle || 'LEARNING & GROWTH'}</p>
                        </div>
                      </div>
                      <div className="space-y-6">
                        {(content as any).education.map((edu: any, index: number) => (
                          <div key={edu.id} className="bg-white/5 p-6 rounded-[20px] border border-white/5 space-y-4 hover:bg-white/10 transition-colors group">
                            <div className="flex items-start justify-between gap-4">
                              <h5 className="text-lg font-bold text-white/90 group-hover:text-accent-purple transition-colors">
                                {edu.title}
                              </h5>
                              <span className="text-[10px] bg-accent-purple/10 text-accent-purple border border-accent-purple/20 px-3 py-1 rounded-full font-bold uppercase tracking-widest whitespace-nowrap">
                                {edu.organizer}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center gap-2 text-white/60">
                                <Calendar size={14} className="text-accent-purple" />
                                <span>{edu.period}</span>
                              </div>
                              <div className="flex items-center gap-2 text-white/60">
                                <MapPin size={14} className="text-accent-purple" />
                                <span>{edu.location}</span>
                              </div>
                            </div>
                            <p className="text-sm text-white/50 leading-relaxed pl-4 border-l-2 border-accent-purple/30">
                              {edu.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </div>
            )}

            {type === 'company' && (
              <div className="grid grid-cols-1 gap-6">
                {content.items.map(item => (
                  <div key={item.id} className="bg-white/5 p-6 rounded-[10px] border border-white/5 space-y-4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-bold text-accent-purple">{item.name}</h3>
                      <span className="text-xs bg-white/5 px-3 py-1 rounded-[10px]">{item.period}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {content.labels && Object.entries(content.labels).map(([field, label]) => {
                        const getFieldIcon = (f: string) => {
                          switch (f) {
                            case 'role': return <User size={12} className="text-accent-purple" />;
                            case 'reason': return <LogOut size={12} className="text-accent-purple" />;
                            case 'business': return <Globe size={12} className="text-accent-purple" />;
                            case 'scale': return <Layers size={12} className="text-accent-purple" />;
                            case 'revenue': return <DollarSign size={12} className="text-accent-purple" />;
                            case 'employees': return <Users size={12} className="text-accent-purple" />;
                            case 'workplace': return <MapPin size={12} className="text-accent-purple" />;
                            default: return null;
                          }
                        };
                        return field !== 'name' && field !== 'period' && (
                          <div key={field} className="space-y-1">
                            <div className="flex items-center gap-1.5 text-white/40">
                              {getFieldIcon(field)}
                              <span className="text-[10px] uppercase font-bold">{label}</span>
                            </div>
                            <div className="text-white/80">{item[field] || '-'}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {type === 'portfolio' && (
              <div className="w-full space-y-4">
                <div className="bg-white/5 p-4 rounded-[20px] border border-white/10 flex justify-between items-center mb-4">
                  <div className="flex items-start gap-3">
                    <FileText className="text-accent-purple shrink-0 mt-1" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{siteConfig.portfolioPdfName || 'portfolio.pdf'}</span>
                      {siteConfig.portfolioPdfDesc && (
                        <span className="text-[10px] text-white/40 mt-1 leading-relaxed whitespace-pre-line">
                          {siteConfig.portfolioPdfDesc}
                        </span>
                      )}
                    </div>
                  </div>
                  <a 
                    href={siteConfig.portfolioPdfUrl || '#'} 
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (!siteConfig.portfolioPdfUrl) {
                        e.preventDefault();
                        alert('링크가 등록되지 않았습니다.');
                      }
                    }}
                    className="text-xs bg-accent-purple/20 text-accent-purple px-4 py-2 rounded-full font-bold hover:bg-accent-purple hover:text-white transition-all"
                  >
                    {siteConfig.portfolioPdfButtonText || 'Download PDF'}
                  </a>
                </div>
              </div>
            )}

            {type === 'project' && (
              <div className="grid grid-cols-1 gap-8">
                {content.items.map(item => (
                  <div key={item.id} className="bg-white/5 p-8 rounded-[10px] border border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      {item.image ? (
                        <div className="rounded-[10px] overflow-hidden aspect-video">
                          <img src={item.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      ) : (
                        <div className="rounded-[10px] bg-white/5 aspect-video flex items-center justify-center text-white/20">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent-purple/10 rounded-[10px]">
                          {IconComponent(item.iconName, item.iconImage)}
                        </div>
                        <div>
                          <div className="text-xs text-accent-purple font-bold uppercase tracking-widest">{item.company}</div>
                          <h3 className="text-2xl font-bold">{item.name}</h3>
                        </div>
                      </div>
                      <p className="text-white/60 text-sm leading-relaxed">{item.desc}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t border-white/5">
                        {content.labels && Object.entries(content.labels).map(([field, label]) => (
                          !['company', 'name', 'desc', 'image'].includes(field) && (
                            <div key={field}>
                              <span className="text-white/40 block text-[10px] uppercase font-bold mb-1">{label}</span>
                              {item[field] || '-'}
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {type === 'subcontract' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {content.items.map(item => (
                  <div key={item.id} className="bg-white/5 p-6 rounded-[10px] border border-white/5 space-y-4">
                    {item.image && (
                      <div className="rounded-[10px] overflow-hidden aspect-video mb-4">
                        <img src={item.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-accent-purple/10 rounded-[10px]">
                        {IconComponent(item.iconName, item.iconImage)}
                      </div>
                      <h3 className="text-xl font-bold text-accent-purple">{item.client}</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <span className="text-white/40 block text-[10px] uppercase font-bold mb-1">{content.labels?.request}</span>
                        <p className="text-sm">{item.request}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t border-white/5">
                        {content.labels && Object.entries(content.labels).map(([field, label]) => (
                          !['client', 'request', 'image'].includes(field) && (
                            <div key={field}>
                              <span className="text-white/40 block text-[10px] uppercase font-bold mb-1">{label}</span>
                              {item[field] || '-'}
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

const PORTFOLIO_IMAGE_MAP: { keyword: string; file: string }[] = [
  { keyword: '아이오트러스트', file: '아이오트러스트.png' },
  { keyword: '브로스코', file: '브로스코.png' },
  { keyword: '글라이드', file: '글라이드.png' },
  { keyword: '머티리얼즈파크', file: '머티리얼즈파크.png' },
  { keyword: '한국정보기술', file: '한국정보기술.png' },
];

function getPortfolioImage(project: Project): string | null {
  if (project.portfolioImage) return project.portfolioImage;
  const match = PORTFOLIO_IMAGE_MAP.find(({ keyword }) => project.title.includes(keyword));
  return match ? match.file : null;
}

function App() {
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('projects');
    try {
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : initialProjects;
    } catch {
      return initialProjects;
    }
  });

  const [timeline, setTimeline] = useState<TimelineEntry[]>(() => {
    const saved = localStorage.getItem('timeline');
    try {
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : initialTimeline;
    } catch {
      return initialTimeline;
    }
  });

  const [awards, setAwards] = useState<AwardEntry[]>(() => {
    const saved = localStorage.getItem('awards');
    try {
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : initialAwards;
    } catch {
      return initialAwards;
    }
  });

  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => {
    const saved = localStorage.getItem('siteConfig');
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        // Deep merge sections to prevent undefined errors
        const mergedSections = { ...initialSiteConfig.sections };
        if (parsed.sections) {
          Object.keys(parsed.sections).forEach(key => {
            const k = key as keyof typeof initialSiteConfig.sections;
            if (mergedSections[k]) {
              // Deep merge for sections that have labels/items
              if (k !== 'about') {
                const section = mergedSections[k] as SectionContent;
                const parsedSection = parsed.sections[k] as Partial<SectionContent>;
                mergedSections[k] = { 
                  ...section, 
                  ...parsedSection,
                  items: parsedSection.items || section.items || []
                } as any;
              } else {
                mergedSections[k] = { ...mergedSections[k], ...parsed.sections[k] };
              }
            }
          });
        }
        return { ...initialSiteConfig, ...parsed, sections: mergedSections };
      }
    } catch (e) {
      console.error('Error parsing siteConfig:', e);
    }
    return initialSiteConfig;
  });

  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [pageHeight, setPageHeight] = useState(0);
  const mainRef = useRef<HTMLDivElement>(null);

  const [viewCount, setViewCount] = useState(0);
  const [trackingUrl, setTrackingUrl] = useState('');
  const [trackedUrls, setTrackedUrls] = useState<{ [url: string]: number }>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [portfolioViewerImage, setPortfolioViewerImage] = useState<string | null>(null);

  // Draft states for Admin Panel
  const [draftConfig, setDraftConfig] = useState<SiteConfig>(siteConfig);
  const [draftProjects, setDraftProjects] = useState<Project[]>(projects);
  const [draftTimeline, setDraftTimeline] = useState<TimelineEntry[]>(timeline);
  const [draftAwards, setDraftAwards] = useState<AwardEntry[]>(awards);

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Firebase Data Listeners
  useEffect(() => {
    // Test connection
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'config', 'main'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    // Listen to Config
    const unsubConfig = onSnapshot(doc(db, 'config', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Partial<SiteConfig>;
        setSiteConfig(prev => ({ ...prev, ...data }));
      }
    }, (error) => {
      console.warn('Firestore Config Listener Error:', error.message);
    });

    // Listen to Logo
    const unsubLogo = onSnapshot(doc(db, 'config', 'logo'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSiteConfig(prev => ({ ...prev, siteLogo: data.siteLogo || prev.siteLogo }));
      }
    });

    // Listen to Background
    const unsubBackground = onSnapshot(doc(db, 'config', 'background'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSiteConfig(prev => ({ ...prev, backgroundImage: data.backgroundImage || prev.backgroundImage }));
      }
    });

    // Listen to Skills
    const unsubSkills = onSnapshot(doc(db, 'config', 'skills'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.items) setSiteConfig(prev => ({ ...prev, skills: data.items }));
      }
    });

    // Listen to Workflow
    const unsubWorkflow = onSnapshot(doc(db, 'config', 'workflow'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSiteConfig(prev => ({ 
          ...prev, 
          workflowLeft: data.left || prev.workflowLeft,
          workflowRight: data.right || prev.workflowRight
        }));
      }
    });

    // Listen to Portfolio PDF
    const unsubPdf = onSnapshot(doc(db, 'config', 'portfolio_pdf'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSiteConfig(prev => ({ 
          ...prev, 
          portfolioPdfUrl: data.portfolioPdfUrl || prev.portfolioPdfUrl,
          portfolioPdfName: data.portfolioPdfName || prev.portfolioPdfName,
          portfolioPdfButtonText: data.portfolioPdfButtonText || prev.portfolioPdfButtonText,
          portfolioPdfDesc: data.portfolioPdfDesc || prev.portfolioPdfDesc
        }));
      }
    });

    // Listen to Timeline & Awards
    const unsubTimelineAwards = onSnapshot(doc(db, 'config', 'timeline_awards'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.timeline) setTimeline(data.timeline);
        if (data.awards) setAwards(data.awards);
      }
    });

    // Listen to Sections (Split documents to avoid 1MB limit)
    const sections = ['about', 'company', 'project', 'subcontract'];
    const unsubSections = sections.map(sectionKey => 
      onSnapshot(doc(db, 'config', `section_${sectionKey}`), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSiteConfig(prev => ({
            ...prev,
            sections: {
              ...prev.sections,
              [sectionKey]: data
            }
          }));
        }
      })
    );

    // Listen to Projects
    const unsubProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
      const projectsList = snapshot.docs.map(doc => doc.data() as Project);
      if (projectsList.length > 0) {
        setProjects(projectsList.sort((a, b) => (a as any).order - (b as any).order));
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'projects'));

    return () => {
      unsubConfig();
      unsubLogo();
      unsubBackground();
      unsubSkills();
      unsubWorkflow();
      unsubTimelineAwards();
      unsubSections.forEach(unsub => unsub());
      unsubProjects();
    };
  }, []);

  // Remove Force update Brosko image logic to allow user control
  useEffect(() => {
    if (isAdminOpen) {
      setDraftConfig(siteConfig);
      setDraftProjects(projects);
      setDraftTimeline(timeline);
      setDraftAwards(awards);
    }
  }, [isAdminOpen, siteConfig, projects, timeline, awards]);

  const handleSave = async () => {
    if (!currentUser || currentUser.email !== 'fp221227@gmail.com') {
      alert('관리자 권한이 필요합니다. Google 로그인을 해주세요.');
      return;
    }

    setSaveStatus('saving');
    setSaveErrorMessage(null);
    try {
      // Fix existing large images before saving
      let finalBackgroundImage = draftConfig.backgroundImage;
      let finalSiteLogo = draftConfig.siteLogo;

      if (finalBackgroundImage && finalBackgroundImage.length > 800 * 1024) {
        finalBackgroundImage = await compressImage(finalBackgroundImage, 1280, 720, 0.6);
      }
      if (finalSiteLogo && finalSiteLogo.length > 400 * 1024) {
        finalSiteLogo = await compressImage(finalSiteLogo, 400, 400, 0.8);
      }

      const batch = writeBatch(db);

      // 1. Save Main Config (Explicitly pick small fields to avoid 1MB limit)
      const mainConfig = {
        siteTitle: draftConfig.siteTitle,
        heroTagline: draftConfig.heroTagline,
        heroSubtitle: draftConfig.heroSubtitle,
        readCaseStudyLabel: draftConfig.readCaseStudyLabel,
        accentColor: draftConfig.accentColor,
        globalFontSize: draftConfig.globalFontSize,
        globalFontWeight: draftConfig.globalFontWeight,
        navLabels: draftConfig.navLabels,
        footerContact: draftConfig.footerContact,
        footerTitle: draftConfig.footerTitle,
        footerSubtitle: draftConfig.footerSubtitle,
        copyright: draftConfig.copyright,
        showBackgroundImage: draftConfig.showBackgroundImage,
        expertiseLabel: draftConfig.expertiseLabel,
        expertiseTitle: draftConfig.expertiseTitle,
        workflowSectionTitle: draftConfig.workflowSectionTitle,
        workflowTitleLeft: draftConfig.workflowTitleLeft,
        workflowTitleRight: draftConfig.workflowTitleRight,
        experienceTitle: draftConfig.experienceTitle,
        awardsTitle: draftConfig.awardsTitle,
        projectsLabel: draftConfig.projectsLabel,
        projectsTitle: draftConfig.projectsTitle,
      };
      const configRef = doc(db, 'config', 'main');
      batch.set(configRef, mainConfig);

      // 2. Save Logo separately
      const logoRef = doc(db, 'config', 'logo');
      batch.set(logoRef, { siteLogo: finalSiteLogo || '' });

      // 2.5 Save Background separately
      const backgroundRef = doc(db, 'config', 'background');
      batch.set(backgroundRef, { backgroundImage: finalBackgroundImage || '' });

      // 2.6 Save Portfolio PDF separately
      const pdfRef = doc(db, 'config', 'portfolio_pdf');
      batch.set(pdfRef, { 
        portfolioPdfUrl: draftConfig.portfolioPdfUrl || '',
        portfolioPdfName: draftConfig.portfolioPdfName || '',
        portfolioPdfButtonText: draftConfig.portfolioPdfButtonText || 'Download PDF',
        portfolioPdfDesc: draftConfig.portfolioPdfDesc || ''
      });

      // 3. Save Skills separately
      const skillsRef = doc(db, 'config', 'skills');
      batch.set(skillsRef, { items: draftConfig.skills });

      // 3. Save Workflow separately
      const workflowRef = doc(db, 'config', 'workflow');
      batch.set(workflowRef, { left: draftConfig.workflowLeft, right: draftConfig.workflowRight });

      // 4. Save Timeline & Awards separately
      const timelineAwardsRef = doc(db, 'config', 'timeline_awards');
      batch.set(timelineAwardsRef, {
        timeline: draftTimeline,
        awards: draftAwards
      });

      // 5. Save Sections as individual documents
      Object.entries(draftConfig.sections).forEach(([key, sectionData]) => {
        const sectionRef = doc(db, 'config', `section_${key}`);
        batch.set(sectionRef, sectionData);
      });

      // 6. Save Projects (Individual documents)
      draftProjects.forEach((project, index) => {
        const projectRef = doc(db, 'projects', project.id);
        batch.set(projectRef, { ...project, order: index });
      });

      await batch.commit();
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error: any) {
      setSaveStatus('error');
      setSaveErrorMessage(error.message || String(error));
      handleFirestoreError(error, OperationType.WRITE, 'batch commit');
    }
  };

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    const updateHeight = () => {
      if (mainRef.current) {
        setPageHeight(mainRef.current.scrollHeight);
      }
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    if (mainRef.current) observer.observe(mainRef.current);
    return () => observer.disconnect();
  }, []);

  const handleAuth = () => {
    if (adminPassword === '0613') {
      setIsAuthorized(true);
    } else {
      alert('비밀번호가 틀렸습니다.');
    }
  };

  const updateProject = (id: string, updated: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
  };

  const addProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      title: 'New Project',
      category: 'Category',
      description: 'Description',
      keywords: [],
      images: [],
      link: '#PROJECT'
    };
    setProjects([...projects, newProject]);
  };

  const deleteProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id));
  };

  return (
    <div 
      className="relative min-h-screen" 
      style={{ 
        fontSize: `${siteConfig.globalFontSize}px`,
        fontWeight: siteConfig.globalFontWeight,
        '--accent-purple': siteConfig.accentColor 
      } as any}
    >
      <BackgroundGraphic 
        showImage={siteConfig.showBackgroundImage} 
        imageUrl={siteConfig.backgroundImage}
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[120] glass-morphism py-4 px-6 md:px-12 flex justify-between items-center">
        <button 
          onClick={() => {
            setActiveModal(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="text-xl font-bold tracking-tighter hover:opacity-80 transition-opacity"
        >
          {siteConfig.siteLogo ? (
            <img src={siteConfig.siteLogo} alt={siteConfig.siteTitle} className="h-8 object-contain" referrerPolicy="no-referrer" />
          ) : (
            siteConfig.siteTitle
          )}
        </button>
        <div className="hidden md:flex gap-8 text-sm font-medium">
          <button onClick={() => { setActiveModal(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-accent-purple transition-colors">HOME</button>
          <button onClick={() => setActiveModal('about')} className="hover:text-accent-purple transition-colors">{siteConfig.navLabels.about}</button>
          <button onClick={() => setActiveModal('company')} className="hover:text-accent-purple transition-colors">{siteConfig.navLabels.company}</button>
        </div>
        <button 
          onClick={() => setIsAdminOpen(true)}
          className="p-2 hover:bg-white/10 rounded-[10px] transition-colors"
        >
          <Settings size={20} />
        </button>
      </nav>

      <main ref={mainRef} className="relative z-10 pt-32 px-6 md:px-12 max-w-7xl mx-auto">
        {/* Hero Section */}
        <section id="ABOUT" className="mb-32">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl"
          >
            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-8 whitespace-pre-line">
              {siteConfig.heroTagline}
            </h1>
            <p className="text-xl md:text-2xl text-text-gray mb-12 whitespace-pre-line">
              {siteConfig.heroSubtitle}
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setActiveModal('about')}
                className="purple-gradient px-8 py-4 rounded-[10px] font-bold flex items-center gap-2 hover:scale-105 transition-transform"
              >
                {siteConfig.readCaseStudyLabel} <ChevronRight size={20} />
              </button>
            </div>
          </motion.div>
        </section>

        {/* Projects Section */}
        <section id="PROJECT" className="mb-32">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-sm font-bold text-accent-purple tracking-widest uppercase mb-2">{siteConfig.projectsLabel}</h2>
              <h3 className="text-4xl font-bold whitespace-pre-line">{siteConfig.projectsTitle}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {projects.map((project, idx) => {
              const displayImage = project.images[0] || 'https://picsum.photos/seed/placeholder/800/600';

              return (
                <motion.div 
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group bg-bg-card rounded-[10px] overflow-hidden border border-white/5 hover:border-accent-purple/50 transition-all"
                >
                  <div className="aspect-video overflow-hidden relative">
                    <img 
                      src={displayImage} 
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => {
                          const img = getPortfolioImage(project);
                          if (img) setPortfolioViewerImage(img);
                        }}
                        className="bg-white text-black px-6 py-3 rounded-[10px] font-bold flex items-center gap-2 cursor-pointer"
                      >
                        View Project &gt;
                      </button>
                    </div>
                  </div>
                  <div className="p-8 h-full flex flex-col">
                    <div className="text-accent-purple text-sm font-bold mb-2">{project.category}</div>
                    <div className="h-16 mb-4">
                      <AutoShrinkText text={project.title} className="text-2xl font-bold text-left" />
                    </div>
                    <p className="text-text-gray mb-6 flex-grow whitespace-pre-line">{project.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {project.keywords.map(kw => (
                        <span key={kw} className="bg-white/5 px-3 py-1 rounded-[10px] text-xs text-white/60">#{kw}</span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Skills & AI Workflow */}
        <section id="COMPANY" className="mb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <h2 className="text-sm font-bold text-accent-purple tracking-widest uppercase mb-2">{siteConfig.expertiseLabel}</h2>
              <h3 className="text-4xl font-bold mb-8 whitespace-pre-line">{siteConfig.expertiseTitle}</h3>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
                {siteConfig.skills.map(tool => {
                  const IconComponent = {
                    Palette, Layers, Figma, Monitor, Layout, Zap, Cpu, Terminal, Github, Code
                  }[tool.iconName || ''] || Code;
                  return (
                    <motion.div 
                      key={tool.id} 
                      whileHover={{ y: -5, backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.3)' }}
                      className="flex flex-col items-center justify-center gap-3 p-4 bg-bg-card rounded-[10px] border border-white/5 transition-all duration-300 group"
                    >
                      <div className="text-accent-purple transition-transform duration-300 group-hover:scale-110">
                        {tool.iconImage ? (
                          <img 
                            src={tool.iconImage} 
                            alt={tool.name} 
                            className="w-10 h-10 object-cover rounded-sm" 
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              // Fallback if image fails to load
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="text-accent-purple"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2H2v10h10V2z"/><path d="m17.92 14 3.5 3.5-3.5 3.5"/><path d="M5 22h14"/><path d="M5 17h14"/><path d="M5 12h14"/></svg></div>';
                            }}
                          />
                        ) : (
                          <IconComponent size={40} />
                        )}
                      </div>
                      <span className="text-[10px] md:text-xs font-bold text-center leading-tight text-white/70 group-hover:text-white transition-colors">
                        {tool.name}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="bg-bg-card rounded-[10px] p-8 border border-white/5">
              <h3 className="text-2xl font-bold mb-8 flex items-center gap-2 whitespace-pre-line">
                <Zap className="text-accent-purple" /> {siteConfig.workflowSectionTitle}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                {/* Vertical Divider */}
                <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/10 -translate-x-1/2" />
                
                {/* Left Column: Design Workflow */}
                <div className="space-y-8">
                  <h4 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Palette size={16} className="text-accent-purple/50" />
                    {siteConfig.workflowTitleLeft}
                  </h4>
                  <div className="space-y-6">
                    {siteConfig.workflowLeft.map(item => (
                      <div key={item.id} className="flex gap-4">
                        <div className="text-accent-purple font-bold shrink-0">{item.step}</div>
                        <div>
                          <div className="font-bold mb-1">{item.title}</div>
                          <p className="text-sm text-text-gray whitespace-pre-line">{item.desc}</p>
                          {item.note && (
                            <div className="mt-2 p-3 bg-white/5 rounded-[10px] text-[10px] text-white/30 italic whitespace-pre-line">
                              {item.note}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Column: AI Workflow */}
                <div className="space-y-8">
                  <h4 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Zap size={16} className="text-accent-purple/50" />
                    {siteConfig.workflowTitleRight}
                  </h4>
                  <div className="space-y-6">
                    {siteConfig.workflowRight.map(item => (
                      <div key={item.id} className="flex gap-4">
                        <div className="text-accent-purple font-bold shrink-0">{item.step}</div>
                        <div>
                          <div className="font-bold mb-1">{item.title}</div>
                          <p className="text-sm text-text-gray whitespace-pre-line">{item.desc}</p>
                          {item.note && (
                            <div className="mt-2 p-3 bg-white/5 rounded-[10px] text-[10px] text-white/30 italic whitespace-pre-line">
                              {item.note}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline & Awards */}
        <section id="SUBCONTRACT" className="mb-32">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <h3 className="text-3xl font-bold mb-8 flex items-center gap-2">
                <Briefcase className="text-accent-purple" /> {siteConfig.experienceTitle}
              </h3>
              <div className="space-y-8">
                {timeline.map(item => (
                  <div key={item.id} className="relative pl-8 border-l border-white/10">
                    <div className="absolute left-[-5px] top-0 w-[10px] h-[10px] rounded-full bg-accent-purple" />
                    <div className="text-sm text-accent-purple font-bold mb-1">{item.year}</div>
                    <div className="text-xl font-bold mb-1">{item.company}</div>
                    <div className="text-sm font-medium text-white/80 mb-3">{item.role}</div>
                    <p className="text-text-gray text-sm leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-3xl font-bold mb-8 flex items-center gap-2">
                <FileText className="text-accent-purple" /> {siteConfig.awardsTitle}
              </h3>
              <div className="space-y-4">
                {awards.map(award => (
                  <div key={award.id} className="p-4 bg-bg-card rounded-[10px] border border-white/5">
                    <div className="text-xs text-accent-purple font-bold mb-1">{award.year}</div>
                    <div className="font-bold text-sm mb-1">{award.title}</div>
                    <div className="text-xs text-text-gray">{award.organization}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-bg-card py-20 px-6 md:px-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-4xl font-bold mb-8">{siteConfig.footerTitle}<br /><span className="text-accent-purple">{siteConfig.footerSubtitle}</span></h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-text-gray">
                <Mail size={20} className="text-accent-purple" />
                <span>{siteConfig.footerContact.email}</span>
              </div>
              <div className="flex items-center gap-4 text-text-gray">
                <Smartphone size={20} className="text-accent-purple" />
                <span>{siteConfig.footerContact.phone}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-between items-end">
            <div className="flex gap-4">
              <a 
                href={`https://mail.naver.com/v2/folders/0/all/write?to=${siteConfig.footerContact.email}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-4 bg-white/5 rounded-[10px] hover:bg-accent-purple transition-colors"
                title="Send Email via Naver"
              >
                <Mail />
              </a>
            </div>
            <div className="text-sm text-white/20 mt-8">
              {siteConfig.copyright}
            </div>
          </div>
        </div>
      </footer>

      <SectionModal 
        isOpen={activeModal !== null} 
        onClose={() => setActiveModal(null)} 
        content={siteConfig.sections[activeModal as keyof typeof siteConfig.sections]}
        type={activeModal || ''}
        siteConfig={siteConfig}
      />

      {/* Admin Modal */}
      <AnimatePresence>
        {isAdminOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl p-6 overflow-y-auto"
          >
            {/* Admin Background Image */}
            <div 
              className="fixed inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: draftConfig.backgroundImage ? `url(${draftConfig.backgroundImage})` : 'url(https://picsum.photos/seed/admin-bg/1920/1080?blur=10)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed'
              }}
            />
            <div className="max-w-4xl mx-auto relative z-10 pt-24">
              <div className="flex justify-between items-center mb-12">
                <div>
                  <h2 className="text-3xl font-bold">Admin Panel</h2>
                  <p className="text-xs text-white/40 mt-1">Main Page Height: {pageHeight}px</p>
                  {currentUser && (
                    <div className="flex items-center gap-2 mt-2 bg-white/5 px-3 py-1 rounded-full border border-white/10 w-fit">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px] text-white/60">{currentUser.email}</span>
                      <button onClick={logout} className="text-[10px] text-accent-purple hover:underline ml-2">Logout</button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {isAuthorized && (
                    <div className="flex items-center gap-4 bg-white/5 p-2 rounded-[10px] border border-white/10">
                      <div className="flex items-center gap-2">
                        <Globe size={14} className="text-white/40" />
                        <input 
                          type="text" 
                          placeholder="URL to track..."
                          value={trackingUrl}
                          onChange={(e) => setTrackingUrl(e.target.value)}
                          className="bg-black/40 border border-white/10 rounded-[5px] px-2 py-1 text-[10px] w-40"
                        />
                        <button 
                          onClick={() => {
                            if (!trackingUrl) return;
                            const newTracked = { ...trackedUrls };
                            newTracked[trackingUrl] = (newTracked[trackingUrl] || 0) + 1;
                            setTrackedUrls(newTracked);
                            localStorage.setItem('trackedUrls', JSON.stringify(newTracked));
                            alert(`Tracking updated for: ${trackingUrl}`);
                          }}
                          className="bg-white/10 px-2 py-1 rounded-[5px] text-[10px] font-bold hover:bg-white/20"
                        >
                          Enter
                        </button>
                      </div>
                      <div className="h-4 w-[1px] bg-white/10" />
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <TrendingUp size={14} className="text-accent-purple" />
                          <span className="text-[10px] font-bold uppercase text-white/40">Total Views: {viewCount}</span>
                        </div>
                        {trackingUrl && trackedUrls[trackingUrl] !== undefined && (
                          <span className="text-[10px] font-bold text-accent-purple">URL Views: {trackedUrls[trackingUrl]}</span>
                        )}
                      </div>
                    </div>
                  )}
                  {isAuthorized && (
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => {
                          if (confirm('로컬 스토리지에서 데이터를 복구하시겠습니까? 현재 저장되지 않은 변경사항은 사라집니다.')) {
                            const savedConfig = localStorage.getItem('siteConfig');
                            const savedProjects = localStorage.getItem('projects');
                            const savedTimeline = localStorage.getItem('timeline');
                            const savedAwards = localStorage.getItem('awards');
                            
                            if (savedConfig) setDraftConfig(JSON.parse(savedConfig));
                            if (savedProjects) setDraftProjects(JSON.parse(savedProjects));
                            if (savedTimeline) setDraftTimeline(JSON.parse(savedTimeline));
                            if (savedAwards) setDraftAwards(JSON.parse(savedAwards));
                            
                            alert('로컬 스토리지에서 데이터를 불러왔습니다. "Save Changes"를 눌러 데이터베이스에 반영하세요.');
                          }
                        }}
                        className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-[10px] text-xs font-bold hover:bg-white/20 transition-colors"
                        title="브라우저에 저장된 이전 데이터를 불러옵니다."
                      >
                        <RefreshCw size={14} /> Restore Local Data
                      </button>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                          {saveStatus === 'saving' && <span className="text-xs text-accent-purple animate-pulse">Saving...</span>}
                          {saveStatus === 'saved' && <span className="text-xs text-green-500">✓ Saved</span>}
                          {saveStatus === 'error' && <span className="text-xs text-red-500 font-bold">✗ Error</span>}
                        </div>
                        {saveStatus === 'error' && saveErrorMessage && (
                          <div className="text-[10px] text-red-400 max-w-[200px] text-right leading-tight bg-red-500/10 p-2 rounded border border-red-500/20">
                            {saveErrorMessage}
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-accent-purple px-6 py-2 rounded-[10px] font-bold hover:scale-105 transition-transform"
                      >
                        <Settings size={18} /> Save Changes
                      </button>
                    </div>
                  )}
                  <button onClick={() => setIsAdminOpen(false)} className="p-2 hover:bg-white/10 rounded-[10px]">
                    <X size={32} />
                  </button>
                </div>
              </div>

              {isAuthorized && (
                <div className="mb-12 bg-white/5 p-6 rounded-[10px] border border-white/10 flex flex-wrap items-center gap-8">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Tracking URL</label>
                    <div className="flex gap-2">
                      <input 
                        value={trackingUrl}
                        onChange={(e) => setTrackingUrl(e.target.value)}
                        placeholder="https://example.com/track"
                        className="bg-black/40 border border-white/10 rounded-[10px] px-4 py-2 text-sm w-64"
                      />
                      <button 
                        onClick={() => alert('IP Tracking requires a backend service. URL registered for analysis.')}
                        className="bg-white/10 px-4 py-2 rounded-[10px] text-xs font-bold hover:bg-white/20"
                      >
                        Enter
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Total Views</label>
                    <div className="text-2xl font-bold text-accent-purple flex items-center gap-2">
                      <Users size={24} /> {viewCount.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {!isAuthorized ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <h3 className="text-xl mb-6">관리자 인증이 필요합니다</h3>
                  <div className="flex flex-col items-center gap-6">
                    <div className="flex gap-4">
                      <input 
                        type="password" 
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-[10px] px-6 py-3 focus:outline-none focus:border-accent-purple"
                        placeholder="Password"
                        onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                      />
                      <button 
                        onClick={handleAuth}
                        className="purple-gradient px-8 py-3 rounded-[10px] font-bold"
                      >
                        Login
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-4 w-full">
                      <div className="h-[1px] bg-white/10 flex-grow" />
                      <span className="text-xs text-white/20 uppercase font-bold">OR</span>
                      <div className="h-[1px] bg-white/10 flex-grow" />
                    </div>

                    <button 
                      onClick={signIn}
                      className="flex items-center gap-3 bg-white text-black px-8 py-3 rounded-[10px] font-bold hover:bg-white/90 transition-colors"
                    >
                      <LogIn size={20} />
                      Sign in with Google
                    </button>
                    <p className="text-[10px] text-white/40 max-w-xs text-center">
                      Firestore 저장을 위해 Google 로그인이 필요합니다.<br/>
                      (허용된 관리자 계정만 저장이 가능합니다)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-8 items-start">
                  {/* Admin Sidebar Nav */}
                  <div className="hidden lg:block w-48 shrink-0 sticky top-32">
                    <div className="bg-white/5 border border-white/10 rounded-[20px] p-4 space-y-2 backdrop-blur-xl">
                      <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-4 px-2">Navigation</p>
                      <button 
                        onClick={() => document.getElementById('admin-nav-pages')?.scrollIntoView({ behavior: 'smooth' })}
                        className="w-full text-left px-4 py-2 rounded-[10px] text-xs font-bold hover:bg-accent-purple/20 hover:text-accent-purple transition-all flex items-center gap-2 group"
                      >
                        <div className="w-1 h-1 rounded-full bg-accent-purple opacity-0 group-hover:opacity-100 transition-opacity" />
                        ABOUT
                      </button>
                      <button 
                        onClick={() => document.getElementById('admin-company-page')?.scrollIntoView({ behavior: 'smooth' })}
                        className="w-full text-left px-4 py-2 rounded-[10px] text-xs font-bold hover:bg-accent-purple/20 hover:text-accent-purple transition-all flex items-center gap-2 group"
                      >
                        <div className="w-1 h-1 rounded-full bg-accent-purple opacity-0 group-hover:opacity-100 transition-opacity" />
                        COMPANY DESCRIPTION
                      </button>
                      <button 
                        onClick={() => document.getElementById('admin-portfolio-settings')?.scrollIntoView({ behavior: 'smooth' })}
                        className="w-full text-left px-4 py-2 rounded-[10px] text-xs font-bold hover:bg-accent-purple/20 hover:text-accent-purple transition-all flex items-center gap-2 group"
                      >
                        <div className="w-1 h-1 rounded-full bg-accent-purple opacity-0 group-hover:opacity-100 transition-opacity" />
                        PROJECT
                      </button>
                    </div>
                  </div>

                  <div className="flex-grow space-y-12 pb-20">
                    {/* Site Config Section */}
                    <div id="admin-about" className="bg-white/5 p-8 rounded-[10px] border border-white/10 scroll-mt-32">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold flex items-center gap-2"><Settings size={20} /> Site Configuration</h3>
                      <div className="text-xs font-bold text-white/40 bg-white/5 px-3 py-1 rounded-[10px]">
                        Main Page Height: {pageHeight}px
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <label className="block text-sm font-bold text-white/60">Site Title (Text)</label>
                        <input 
                          value={draftConfig.siteTitle}
                          onChange={(e) => setDraftConfig({...draftConfig, siteTitle: e.target.value})}
                          className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-sm"
                        />
                        <div className="space-y-2">
                          <label className="block text-sm font-bold text-white/60">Site Logo (Image - Recommended: 200x50px)</label>
                          <div className="flex items-center gap-4">
                            <label className="flex-grow flex items-center justify-center bg-black/40 border border-dashed border-white/10 rounded-[10px] p-4 cursor-pointer hover:border-accent-purple transition-colors">
                              <Upload size={20} />
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    if (file.size > 1024 * 1024) {
                                      alert('이미지 용량이 너무 큽니다. 1MB 이하의 이미지를 사용해주세요.');
                                      return;
                                    }
                                    const reader = new FileReader();
                                    reader.onloadend = async () => {
                                      const compressed = await compressImage(reader.result as string, 400, 400, 0.8);
                                      setDraftConfig({...draftConfig, siteLogo: compressed});
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                            {draftConfig.siteLogo && (
                              <div className="relative group">
                                <img src={draftConfig.siteLogo} className="h-10 object-contain bg-white/5 p-1 rounded" />
                                <button 
                                  onClick={() => setDraftConfig({...draftConfig, siteLogo: ''})}
                                  className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label className="block text-sm font-bold text-white/60">Accent Color</label>
                        <input 
                          type="color"
                          value={draftConfig.accentColor}
                          onChange={(e) => setDraftConfig({...draftConfig, accentColor: e.target.value})}
                          className="w-full h-10 bg-transparent border-none cursor-pointer"
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="block text-sm font-bold text-white/60">Global Font Size (px)</label>
                        <input 
                          type="number"
                          value={draftConfig.globalFontSize}
                          onChange={(e) => setDraftConfig({...draftConfig, globalFontSize: parseInt(e.target.value) || 16})}
                          className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-sm"
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="block text-sm font-bold text-white/60">Global Font Weight</label>
                        <select 
                          value={draftConfig.globalFontWeight}
                          onChange={(e) => setDraftConfig({...draftConfig, globalFontWeight: e.target.value})}
                          className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-sm"
                        >
                          <option value="300">Light (300)</option>
                          <option value="400">Regular (400)</option>
                          <option value="500">Medium (500)</option>
                          <option value="600">Semi-Bold (600)</option>
                          <option value="700">Bold (700)</option>
                        </select>
                      </div>
                      <div className="space-y-4">
                        <label className="block text-sm font-bold text-white/60">Hero Tagline</label>
                        <textarea 
                          value={draftConfig.heroTagline}
                          onChange={(e) => setDraftConfig({...draftConfig, heroTagline: e.target.value})}
                          className="w-full bg-black/40 border border-white/10 rounded-[10px] p-4 text-sm min-h-[100px]"
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="block text-sm font-bold text-white/60">Hero Subtitle</label>
                        <textarea 
                          value={draftConfig.heroSubtitle}
                          onChange={(e) => setDraftConfig({...draftConfig, heroSubtitle: e.target.value})}
                          className="w-full bg-black/40 border border-white/10 rounded-[10px] p-4 text-sm min-h-[100px]"
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="flex items-center gap-2 text-sm font-bold text-white/60 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={draftConfig.showBackgroundImage}
                            onChange={(e) => setDraftConfig({...draftConfig, showBackgroundImage: e.target.checked})}
                            className="w-5 h-5 rounded-[4px] border-white/10 bg-black/40"
                          />
                          Show Background Image
                        </label>
                        {draftConfig.showBackgroundImage && (
                          <div className="mt-2 space-y-2">
                            <label className="block text-xs font-bold text-white/40">Custom Background Image (PNG/JPG)</label>
                            <div className="flex items-center gap-4">
                              <label className="flex-grow flex items-center justify-center gap-2 bg-white/5 border border-dashed border-white/20 rounded-[10px] p-4 cursor-pointer hover:border-accent-purple transition-colors">
                                <Upload size={16} />
                                <span className="text-xs">Upload Image (Recommended: 1920x1080px)</span>
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      if (file.size > 1024 * 1024) {
                                        alert('이미지 용량이 너무 큽니다. 1MB 이하의 이미지를 사용해주세요.');
                                        return;
                                      }
                                      const reader = new FileReader();
                                      reader.onloadend = async () => {
                                        const compressed = await compressImage(reader.result as string, 1920, 1080, 0.7);
                                        setDraftConfig({...draftConfig, backgroundImage: compressed});
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </label>
                              <span className="text-[10px] text-white/30 whitespace-nowrap">Recommended: 1920x1080px</span>
                              {draftConfig.backgroundImage && (
                                <button 
                                  onClick={() => setDraftConfig({...draftConfig, backgroundImage: undefined})}
                                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-[10px]"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-white/40">Nav: About</label>
                          <input value={draftConfig.navLabels.about} onChange={(e) => setDraftConfig({...draftConfig, navLabels: {...draftConfig.navLabels, about: e.target.value}})} className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs" />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-white/40">Nav: Company</label>
                          <input value={draftConfig.navLabels.company} onChange={(e) => setDraftConfig({...draftConfig, navLabels: {...draftConfig.navLabels, company: e.target.value}})} className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs" />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-white/40">Nav: Project</label>
                          <input value={draftConfig.navLabels.project} onChange={(e) => setDraftConfig({...draftConfig, navLabels: {...draftConfig.navLabels, project: e.target.value}})} className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs" />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-white/40">Nav: Subcontract</label>
                          <input value={draftConfig.navLabels.subcontract} onChange={(e) => setDraftConfig({...draftConfig, navLabels: {...draftConfig.navLabels, subcontract: e.target.value}})} className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs" />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label className="block text-sm font-bold text-white/60">Read Case Study Button Label</label>
                        <input value={draftConfig.readCaseStudyLabel} onChange={(e) => setDraftConfig({...draftConfig, readCaseStudyLabel: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-sm" />
                      </div>
                      <div className="space-y-4">
                        <label className="block text-sm font-bold text-white/60">Expertise Section Label</label>
                        <input value={draftConfig.expertiseLabel} onChange={(e) => setDraftConfig({...draftConfig, expertiseLabel: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-sm" />
                        <label className="block text-sm font-bold text-white/60">Expertise Section Title</label>
                        <textarea value={draftConfig.expertiseTitle} onChange={(e) => setDraftConfig({...draftConfig, expertiseTitle: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-sm min-h-[80px]" />
                      </div>
                      <div className="space-y-4">
                        <label className="block text-sm font-bold text-white/60">Experience Section Title</label>
                        <textarea value={draftConfig.experienceTitle} onChange={(e) => setDraftConfig({...draftConfig, experienceTitle: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-sm min-h-[80px]" />
                        <label className="block text-sm font-bold text-white/60">Awards Section Title</label>
                        <textarea value={draftConfig.awardsTitle} onChange={(e) => setDraftConfig({...draftConfig, awardsTitle: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-sm min-h-[80px]" />
                      </div>
                      <div className="space-y-4">
                        <label className="block text-sm font-bold text-white/60">Projects Section Label</label>
                        <input value={draftConfig.projectsLabel} onChange={(e) => setDraftConfig({...draftConfig, projectsLabel: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-sm" />
                        <label className="block text-sm font-bold text-white/60">Projects Section Title</label>
                        <textarea value={draftConfig.projectsTitle} onChange={(e) => setDraftConfig({...draftConfig, projectsTitle: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-sm min-h-[80px]" />
                      </div>
                      <div className="space-y-4">
                        <label className="block text-sm font-bold text-white/60">Footer Title</label>
                        <input value={draftConfig.footerTitle} onChange={(e) => setDraftConfig({...draftConfig, footerTitle: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-sm" />
                        <label className="block text-sm font-bold text-white/60">Footer Subtitle</label>
                        <input value={draftConfig.footerSubtitle} onChange={(e) => setDraftConfig({...draftConfig, footerSubtitle: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-sm" />
                        <label className="block text-sm font-bold text-white/60">Copyright Text</label>
                        <input value={draftConfig.copyright} onChange={(e) => setDraftConfig({...draftConfig, copyright: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-sm" />
                      </div>
                    </div>
                  </div>

                  {/* Footer Contact Section */}
                  <hr className="border-white/10 border-t my-8" />
                  <div className="bg-white/5 p-8 rounded-[10px] border border-white/10">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Mail size={20} /> Footer Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <label className="block text-sm font-bold text-white/60">Footer Title</label>
                        <input value={draftConfig.footerTitle} onChange={(e) => setDraftConfig({...draftConfig, footerTitle: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-sm" />
                        <label className="block text-sm font-bold text-white/60">Footer Subtitle</label>
                        <input value={draftConfig.footerSubtitle} onChange={(e) => setDraftConfig({...draftConfig, footerSubtitle: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-sm" />
                        <label className="block text-sm font-bold text-white/60">Email Address</label>
                        <input value={draftConfig.footerContact.email} onChange={(e) => setDraftConfig({...draftConfig, footerContact: {...draftConfig.footerContact, email: e.target.value}})} className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-sm" />
                      </div>
                      <div className="space-y-4">
                        <label className="block text-sm font-bold text-white/60">Phone Number</label>
                        <input value={draftConfig.footerContact.phone} onChange={(e) => setDraftConfig({...draftConfig, footerContact: {...draftConfig.footerContact, phone: e.target.value}})} className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-sm" />
                        <label className="block text-sm font-bold text-white/60">Copyright Text</label>
                        <input value={draftConfig.copyright} onChange={(e) => setDraftConfig({...draftConfig, copyright: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-sm" />
                      </div>
                    </div>
                  </div>

                  {/* Modal Pages Section */}
                  <hr className="border-white/10 border-t my-8" />
                  <div className="bg-white/5 p-8 rounded-[10px] border border-white/10">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Layers size={20} /> Modal Pages Configuration</h3>
                    <div className="space-y-8">
                      {(['about', 'company', 'project', 'subcontract'] as const).map((sectionKey) => (
                        <div key={sectionKey} className="space-y-4 p-4 bg-black/20 rounded-[10px] border border-white/5">
                          <h4 className="text-lg font-bold capitalize text-accent-purple">{sectionKey} Page</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="block text-xs font-bold text-white/40">Page Title</label>
                              <input 
                                value={draftConfig.sections?.[sectionKey]?.title || ''} 
                                onChange={(e) => setDraftConfig({
                                  ...draftConfig, 
                                  sections: {
                                    ...draftConfig.sections,
                                    [sectionKey]: { ...draftConfig.sections[sectionKey], title: e.target.value }
                                  }
                                })} 
                                className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-sm" 
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-xs font-bold text-white/40">Page Subtitle</label>
                              <input 
                                value={draftConfig.sections?.[sectionKey]?.subtitle || ''} 
                                onChange={(e) => setDraftConfig({
                                  ...draftConfig, 
                                  sections: {
                                    ...draftConfig.sections,
                                    [sectionKey]: { ...draftConfig.sections[sectionKey], subtitle: e.target.value }
                                  }
                                })} 
                                className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-sm" 
                              />
                            </div>
                          </div>

                          {/* Labels Editor (if exists) */}
                          {draftConfig.sections?.[sectionKey]?.labels && (
                            <div className="space-y-3">
                              <h5 className="text-xs font-bold text-white/60 uppercase tracking-widest">Field Labels</h5>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {Object.entries(draftConfig.sections[sectionKey].labels || {}).map(([labelKey, labelValue]) => (
                                  <div key={labelKey} className="space-y-1">
                                    <label className="block text-[10px] font-bold text-white/30">{labelKey}</label>
                                    <input 
                                      value={labelValue as string} 
                                      onChange={(e) => {
                                        const newLabels = { ...draftConfig.sections[sectionKey].labels, [labelKey]: e.target.value };
                                        setDraftConfig({
                                          ...draftConfig,
                                          sections: {
                                            ...draftConfig.sections,
                                            [sectionKey]: { ...draftConfig.sections[sectionKey], labels: newLabels }
                                          }
                                        });
                                      }}
                                      className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Items Editor */}
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <h5 className="text-xs font-bold text-white/60 uppercase tracking-widest">Page Items</h5>
                              <button 
                                onClick={() => {
                                  const newItem = { id: Date.now().toString(), content: 'New Content', iconName: 'Info' };
                                  setDraftConfig({
                                    ...draftConfig,
                                    sections: {
                                      ...draftConfig.sections,
                                      [sectionKey]: { 
                                        ...draftConfig.sections[sectionKey], 
                                        items: [...(draftConfig.sections[sectionKey]?.items || []), newItem] 
                                      }
                                    }
                                  });
                                }}
                                className="text-[10px] bg-accent-purple/20 text-accent-purple px-2 py-1 rounded hover:bg-accent-purple/30 transition-colors"
                              >
                                + Add Item
                              </button>
                            </div>
                            <div className="space-y-3">
                              {(draftConfig.sections?.[sectionKey]?.items || []).map((item, itemIdx) => (
                                <div key={item.id} className="p-3 bg-white/5 rounded-[10px] border border-white/5 space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-white/20">Item #{itemIdx + 1}</span>
                                    <button 
                                      onClick={() => {
                                        const newItems = draftConfig.sections[sectionKey].items.filter(i => i.id !== item.id);
                                        setDraftConfig({
                                          ...draftConfig,
                                          sections: {
                                            ...draftConfig.sections,
                                            [sectionKey]: { ...draftConfig.sections[sectionKey], items: newItems }
                                          }
                                        });
                                      }}
                                      className="text-red-500 hover:text-red-400"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <label className="block text-[10px] font-bold text-white/40">Icon Type</label>
                                      <div className="flex items-center gap-2">
                                        <select 
                                          value={item.iconImage ? 'image' : 'lucide'}
                                          onChange={(e) => {
                                            const newItems = [...draftConfig.sections[sectionKey].items];
                                            if (e.target.value === 'lucide') {
                                              newItems[itemIdx].iconImage = undefined;
                                              newItems[itemIdx].iconName = 'Info';
                                            } else {
                                              newItems[itemIdx].iconImage = '';
                                              newItems[itemIdx].iconName = undefined;
                                            }
                                            setDraftConfig({
                                              ...draftConfig,
                                              sections: {
                                                ...draftConfig.sections,
                                                [sectionKey]: { ...draftConfig.sections[sectionKey], items: newItems }
                                              }
                                            });
                                          }}
                                          className="flex-grow bg-black/60 border border-white/10 rounded px-2 py-1 text-xs"
                                        >
                                          <option value="lucide">Lucide Icon</option>
                                          <option value="image">PNG Image</option>
                                        </select>
                                        {item.iconImage !== undefined ? (
                                          <label className="shrink-0 w-8 h-8 flex flex-col items-center justify-center bg-white/5 border border-dashed border-white/20 rounded cursor-pointer">
                                            <Upload size={12} />
                                            <span className="text-[6px] text-white/40">64x64px</span>
                                            <input 
                                              type="file" 
                                              className="hidden" 
                                              accept="image/png"
                                              onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                  if (file.size > 1024 * 1024) {
                                                    alert('이미지 용량이 너무 큽니다. 1MB 이하의 이미지를 사용해주세요.');
                                                    return;
                                                  }
                                                  const reader = new FileReader();
                                                  reader.onloadend = async () => {
                                                    const compressed = await compressImage(reader.result as string, 128, 128, 0.8);
                                                    const newItems = [...draftConfig.sections[sectionKey].items];
                                                    newItems[itemIdx].iconImage = compressed;
                                                    setDraftConfig({
                                                      ...draftConfig,
                                                      sections: {
                                                        ...draftConfig.sections,
                                                        [sectionKey]: { ...draftConfig.sections[sectionKey], items: newItems }
                                                      }
                                                    });
                                                  };
                                                  reader.readAsDataURL(file);
                                                }
                                              }}
                                            />
                                          </label>
                                        ) : (
                                          <select 
                                            value={item.iconName}
                                            onChange={(e) => {
                                              const newItems = [...draftConfig.sections[sectionKey].items];
                                              newItems[itemIdx].iconName = e.target.value;
                                              setDraftConfig({
                                                ...draftConfig,
                                                sections: {
                                                  ...draftConfig.sections,
                                                  [sectionKey]: { ...draftConfig.sections[sectionKey], items: newItems }
                                                }
                                              });
                                            }}
                                            className="flex-grow bg-black/60 border border-white/10 rounded px-2 py-1 text-xs"
                                          >
                                            {['User', 'Briefcase', 'Award', 'Layout', 'Info', 'Mail', 'Smartphone', 'Zap', 'Palette', 'Layers', 'Monitor', 'Code'].map(icon => (
                                              <option key={icon} value={icon}>{icon}</option>
                                            ))}
                                          </select>
                                        )}
                                        {(item.iconImage || item.iconName) && (
                                          <div className="shrink-0 w-8 h-8 flex items-center justify-center bg-white/5 rounded">
                                            {item.iconImage ? (
                                              <img src={item.iconImage} className="w-4 h-4 object-contain" />
                                            ) : (
                                              (() => {
                                                const Icon = { User, Briefcase, Award, Layout, Info, Mail, Smartphone, Zap, Palette, Layers, Monitor, Code }[item.iconName || 'Info'] || Info;
                                                return <Icon size={14} className="text-accent-purple" />;
                                              })()
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <label className="block text-[10px] font-bold text-white/40">Item Content</label>
                                      <textarea 
                                        value={item.content} 
                                        onChange={(e) => {
                                          const newItems = [...draftConfig.sections[sectionKey].items];
                                          newItems[itemIdx].content = e.target.value;
                                          setDraftConfig({
                                            ...draftConfig,
                                            sections: {
                                              ...draftConfig.sections,
                                              [sectionKey]: { ...draftConfig.sections[sectionKey], items: newItems }
                                            }
                                          });
                                        }}
                                        rows={2}
                                        className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs" 
                                      />
                                    </div>
                                  </div>
                                  {/* Dynamic Fields for Company/Project/Subcontract if needed */}
                                  {sectionKey === 'company' && (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2 border-t border-white/5">
                                      {Object.keys(draftConfig.sections.company.labels || {}).map(key => (
                                        <div key={key} className="space-y-1">
                                          <label className="block text-[9px] font-bold text-white/20 uppercase">{draftConfig.sections.company.labels?.[key]}</label>
                                          <input 
                                            value={item[key] || ''} 
                                            onChange={(e) => {
                                              const newItems = [...draftConfig.sections[sectionKey].items];
                                              newItems[itemIdx][key] = e.target.value;
                                              setDraftConfig({
                                                ...draftConfig,
                                                sections: {
                                                  ...draftConfig.sections,
                                                  [sectionKey]: { ...draftConfig.sections[sectionKey], items: newItems }
                                                }
                                              });
                                            }}
                                            className="w-full bg-black/20 border border-white/5 rounded px-2 py-1 text-[10px]"
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expertise (Skills) Section */}
                  <hr className="border-white/10 border-t my-8" />
                  <div className="bg-white/5 p-8 rounded-[10px] border border-white/10">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold flex items-center gap-2"><Palette size={20} /> Expertise (Skills)</h3>
                      <button 
                        onClick={() => setDraftConfig({...draftConfig, skills: [...draftConfig.skills, { id: Date.now().toString(), name: 'New Skill', iconName: 'Code' }]})}
                        className="flex items-center gap-2 bg-accent-purple px-4 py-2 rounded-[10px] text-sm font-bold"
                      >
                        <Plus size={16} /> Add Skill
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {draftConfig.skills.map((skill, idx) => (
                        <div key={skill.id} className="bg-black/40 p-4 rounded-[10px] border border-white/5 space-y-3">
                          <div className="flex gap-2 items-center">
                            <input 
                              value={skill.name}
                              onChange={(e) => {
                                const newSkills = [...draftConfig.skills];
                                newSkills[idx].name = e.target.value;
                                setDraftConfig({...draftConfig, skills: newSkills});
                              }}
                              className="flex-grow bg-transparent border-b border-white/10 focus:border-accent-purple text-sm"
                              placeholder="Skill Name"
                            />
                            <button 
                              onClick={() => setDraftConfig({...draftConfig, skills: draftConfig.skills.filter(s => s.id !== skill.id)})}
                              className="text-red-500 p-1"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex-grow">
                              <label className="block text-[10px] font-bold text-white/40 mb-1">Icon Type</label>
                              <select 
                                value={skill.iconImage ? 'image' : 'lucide'}
                                onChange={(e) => {
                                  const newSkills = [...draftConfig.skills];
                                  if (e.target.value === 'lucide') {
                                    newSkills[idx].iconImage = undefined;
                                  } else {
                                    newSkills[idx].iconImage = '';
                                  }
                                  setDraftConfig({...draftConfig, skills: newSkills});
                                }}
                                className="w-full bg-black/60 border border-white/10 rounded px-2 py-1 text-xs"
                              >
                                <option value="lucide">Lucide Icon</option>
                                <option value="image">PNG Image</option>
                              </select>
                            </div>
                            {skill.iconImage !== undefined ? (
                              <div className="flex-grow">
                                <label className="block text-[10px] font-bold text-white/40 mb-1">Upload PNG (64x64px)</label>
                                <div className="flex items-center gap-2">
                                  <label className="flex-grow flex items-center justify-center bg-white/5 border border-dashed border-white/20 rounded-[10px] p-2 cursor-pointer hover:border-accent-purple transition-colors">
                                    <Upload size={12} />
                                    <input 
                                      type="file" 
                                      className="hidden" 
                                      accept="image/png"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          if (file.size > 1024 * 1024) {
                                            alert('이미지 용량이 너무 큽니다. 1MB 이하의 이미지를 사용해주세요.');
                                            return;
                                          }
                                          const reader = new FileReader();
                                          reader.onloadend = async () => {
                                            const compressed = await compressImage(reader.result as string, 128, 128, 0.8);
                                            const newSkills = [...draftConfig.skills];
                                            newSkills[idx].iconImage = compressed;
                                            setDraftConfig({...draftConfig, skills: newSkills});
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                  </label>
                                  {skill.iconImage && <img src={skill.iconImage} className="w-6 h-6 object-contain" />}
                                </div>
                              </div>
                            ) : (
                              <div className="flex-grow">
                                <label className="block text-[10px] font-bold text-white/40 mb-1">Select Icon</label>
                                <select 
                                  value={skill.iconName}
                                  onChange={(e) => {
                                    const newSkills = [...draftConfig.skills];
                                    newSkills[idx].iconName = e.target.value;
                                    setDraftConfig({...draftConfig, skills: newSkills});
                                  }}
                                  className="w-full bg-black/60 border border-white/10 rounded px-2 py-1 text-xs"
                                >
                                  {['Palette', 'Layers', 'Figma', 'Monitor', 'Layout', 'Zap', 'Cpu', 'Terminal', 'Github', 'Code'].map(icon => (
                                    <option key={icon} value={icon}>{icon}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <hr className="border-accent-purple border-t-[3px] my-12" />

                  {/* Workflow Section */}
                  <hr className="border-white/10 border-t my-8" />
                  <div className="bg-white/5 p-8 rounded-[10px] border border-white/10">
                    <div className="mb-8 space-y-4">
                      <h3 className="text-xl font-bold flex items-center gap-2"><Zap size={20} /> Workflow Configuration</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-white/40">Section Main Title</label>
                          <textarea value={draftConfig.workflowSectionTitle} onChange={(e) => setDraftConfig({...draftConfig, workflowSectionTitle: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs min-h-[60px]" />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-white/40">Left Column Title</label>
                          <textarea value={draftConfig.workflowTitleLeft} onChange={(e) => setDraftConfig({...draftConfig, workflowTitleLeft: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs min-h-[60px]" />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-white/40">Right Column Title</label>
                          <textarea value={draftConfig.workflowTitleRight} onChange={(e) => setDraftConfig({...draftConfig, workflowTitleRight: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs min-h-[60px]" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Left Workflow */}
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-bold text-accent-purple uppercase tracking-widest">{draftConfig.workflowTitleLeft}</h4>
                          <button 
                            onClick={() => setDraftConfig({...draftConfig, workflowLeft: [...draftConfig.workflowLeft, { id: Date.now().toString(), step: '00', title: 'New Step', desc: '', note: '', icon: 'Code' }]})}
                            className="flex items-center gap-2 bg-accent-purple/20 text-accent-purple px-3 py-1 rounded-[10px] text-xs font-bold"
                          >
                            <Plus size={14} /> Add Step
                          </button>
                        </div>
                        <div className="space-y-4">
                          {draftConfig.workflowLeft.map((step, idx) => (
                            <div key={step.id} className="bg-black/40 p-4 rounded-[10px] border border-white/5 space-y-3">
                              <div className="flex gap-4">
                                <input 
                                  value={step.step}
                                  onChange={(e) => {
                                    const newWorkflow = [...draftConfig.workflowLeft];
                                    newWorkflow[idx].step = e.target.value;
                                    setDraftConfig({...draftConfig, workflowLeft: newWorkflow});
                                  }}
                                  className="w-12 bg-transparent border-b border-white/10 text-accent-purple font-bold"
                                />
                                <input 
                                  value={step.title}
                                  onChange={(e) => {
                                    const newWorkflow = [...draftConfig.workflowLeft];
                                    newWorkflow[idx].title = e.target.value;
                                    setDraftConfig({...draftConfig, workflowLeft: newWorkflow});
                                  }}
                                  className="flex-grow bg-transparent border-b border-white/10 font-bold"
                                />
                                <button 
                                  onClick={() => setDraftConfig({...draftConfig, workflowLeft: draftConfig.workflowLeft.filter(w => w.id !== step.id)})}
                                  className="text-red-500"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              <textarea 
                                value={step.desc}
                                onChange={(e) => {
                                  const newWorkflow = [...draftConfig.workflowLeft];
                                  newWorkflow[idx].desc = e.target.value;
                                  setDraftConfig({...draftConfig, workflowLeft: newWorkflow});
                                }}
                                className="w-full bg-white/5 border border-white/10 rounded-[10px] p-2 text-sm"
                                placeholder="Description"
                              />
                              <textarea 
                                value={step.note || ''}
                                onChange={(e) => {
                                  const newWorkflow = [...draftConfig.workflowLeft];
                                  newWorkflow[idx].note = e.target.value;
                                  setDraftConfig({...draftConfig, workflowLeft: newWorkflow});
                                }}
                                className="w-full bg-white/5 border border-white/10 rounded-[10px] p-2 text-xs italic opacity-60"
                                placeholder="Optional Note"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right Workflow */}
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-bold text-accent-purple uppercase tracking-widest">{draftConfig.workflowTitleRight}</h4>
                          <button 
                            onClick={() => setDraftConfig({...draftConfig, workflowRight: [...draftConfig.workflowRight, { id: Date.now().toString(), step: '00', title: 'New Step', desc: '', note: '', icon: 'Code' }]})}
                            className="flex items-center gap-2 bg-accent-purple/20 text-accent-purple px-3 py-1 rounded-[10px] text-xs font-bold"
                          >
                            <Plus size={14} /> Add Step
                          </button>
                        </div>
                        <div className="space-y-4">
                          {draftConfig.workflowRight.map((step, idx) => (
                            <div key={step.id} className="bg-black/40 p-4 rounded-[10px] border border-white/5 space-y-3">
                              <div className="flex gap-4">
                                <input 
                                  value={step.step}
                                  onChange={(e) => {
                                    const newWorkflow = [...draftConfig.workflowRight];
                                    newWorkflow[idx].step = e.target.value;
                                    setDraftConfig({...draftConfig, workflowRight: newWorkflow});
                                  }}
                                  className="w-12 bg-transparent border-b border-white/10 text-accent-purple font-bold"
                                />
                                <input 
                                  value={step.title}
                                  onChange={(e) => {
                                    const newWorkflow = [...draftConfig.workflowRight];
                                    newWorkflow[idx].title = e.target.value;
                                    setDraftConfig({...draftConfig, workflowRight: newWorkflow});
                                  }}
                                  className="flex-grow bg-transparent border-b border-white/10 font-bold"
                                />
                                <button 
                                  onClick={() => setDraftConfig({...draftConfig, workflowRight: draftConfig.workflowRight.filter(w => w.id !== step.id)})}
                                  className="text-red-500"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              <textarea 
                                value={step.desc}
                                onChange={(e) => {
                                  const newWorkflow = [...draftConfig.workflowRight];
                                  newWorkflow[idx].desc = e.target.value;
                                  setDraftConfig({...draftConfig, workflowRight: newWorkflow});
                                }}
                                className="w-full bg-white/5 border border-white/10 rounded-[10px] p-2 text-sm"
                                placeholder="Description"
                              />
                              <textarea 
                                value={step.note || ''}
                                onChange={(e) => {
                                  const newWorkflow = [...draftConfig.workflowRight];
                                  newWorkflow[idx].note = e.target.value;
                                  setDraftConfig({...draftConfig, workflowRight: newWorkflow});
                                }}
                                className="w-full bg-white/5 border border-white/10 rounded-[10px] p-2 text-xs italic opacity-60"
                                placeholder="Optional Note"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Experience (Timeline) Section */}
                  <hr className="border-white/10 border-t my-8" />
                  <div className="bg-white/5 p-8 rounded-[10px] border border-white/10">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold flex items-center gap-2"><Briefcase size={20} /> Experience</h3>
                      <button 
                        onClick={() => setDraftTimeline([...draftTimeline, { id: Date.now().toString(), year: 'Year', company: 'Company', role: 'Role', description: '' }])}
                        className="flex items-center gap-2 bg-accent-purple px-4 py-2 rounded-[10px] text-sm font-bold"
                      >
                        <Plus size={16} /> Add Experience
                      </button>
                    </div>
                    <div className="space-y-6">
                      {draftTimeline.map((item, idx) => (
                        <div key={item.id} className="bg-black/40 p-4 rounded-[10px] border border-white/5 space-y-3">
                          <div className="flex justify-between">
                            <input 
                              value={item.year}
                              onChange={(e) => {
                                const newTimeline = [...draftTimeline];
                                newTimeline[idx].year = e.target.value;
                                setDraftTimeline(newTimeline);
                              }}
                              className="bg-transparent border-b border-white/10 text-accent-purple text-sm font-bold"
                            />
                            <button onClick={() => setDraftTimeline(draftTimeline.filter(t => t.id !== item.id))} className="text-red-500">
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <input 
                            value={item.company}
                            onChange={(e) => {
                              const newTimeline = [...draftTimeline];
                              newTimeline[idx].company = e.target.value;
                              setDraftTimeline(newTimeline);
                            }}
                            className="w-full bg-transparent border-b border-white/10 font-bold"
                            placeholder="Company"
                          />
                          <input 
                            value={item.role}
                            onChange={(e) => {
                              const newTimeline = [...draftTimeline];
                              newTimeline[idx].role = e.target.value;
                              setDraftTimeline(newTimeline);
                            }}
                            className="w-full bg-transparent border-b border-white/10 text-sm"
                            placeholder="Role"
                          />
                          <textarea 
                            value={item.description}
                            onChange={(e) => {
                              const newTimeline = [...draftTimeline];
                              newTimeline[idx].description = e.target.value;
                              setDraftTimeline(newTimeline);
                            }}
                            className="w-full bg-white/5 border border-white/10 rounded-[10px] p-2 text-sm"
                            placeholder="Description"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Awards Section */}
                  <hr className="border-white/10 border-t my-8" />
                  <div className="bg-white/5 p-8 rounded-[10px] border border-white/10">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold flex items-center gap-2"><Award size={20} /> Awards</h3>
                      <button 
                        onClick={() => setDraftAwards([...draftAwards, { id: Date.now().toString(), year: 'Year', title: 'Award Title', organization: 'Organization' }])}
                        className="flex items-center gap-2 bg-accent-purple px-4 py-2 rounded-[10px] text-sm font-bold"
                      >
                        <Plus size={16} /> Add Award
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {draftAwards.map((award, idx) => (
                        <div key={award.id} className="bg-black/40 p-4 rounded-[10px] border border-white/5 space-y-2">
                          <div className="flex justify-between">
                            <input 
                              value={award.year}
                              onChange={(e) => {
                                const newAwards = [...draftAwards];
                                newAwards[idx].year = e.target.value;
                                setDraftAwards(newAwards);
                              }}
                              className="bg-transparent border-b border-white/10 text-accent-purple text-xs font-bold"
                            />
                            <button onClick={() => setDraftAwards(draftAwards.filter(a => a.id !== award.id))} className="text-red-500">
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <input 
                            value={award.title}
                            onChange={(e) => {
                              const newAwards = [...draftAwards];
                              newAwards[idx].title = e.target.value;
                              setDraftAwards(newAwards);
                            }}
                            className="w-full bg-transparent border-b border-white/10 font-bold text-sm"
                            placeholder="Title"
                          />
                          <input 
                            value={award.organization}
                            onChange={(e) => {
                              const newAwards = [...draftAwards];
                              newAwards[idx].organization = e.target.value;
                              setDraftAwards(newAwards);
                            }}
                            className="w-full bg-transparent border-b border-white/10 text-xs opacity-60"
                            placeholder="Organization"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Projects Section */}
                  <hr className="border-white/10 border-t my-8" />
                  <div id="admin-projects" className="bg-white/5 p-8 rounded-[10px] border border-white/10 scroll-mt-32">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold flex items-center gap-2"><Layout size={20} /> Projects</h3>
                      <button onClick={() => setDraftProjects([...draftProjects, { id: Date.now().toString(), title: 'New Project', category: 'Category', description: '', keywords: [], images: [] }])} className="flex items-center gap-2 bg-accent-purple px-4 py-2 rounded-[10px] text-sm font-bold">
                        <Plus size={16} /> Add Project
                      </button>
                    </div>
                    <div className="space-y-8">
                      {draftProjects.map((project, idx) => (
                        <div key={project.id} className="p-6 bg-black/40 rounded-[10px] border border-white/5">
                          <div className="flex justify-between mb-4">
                            <input 
                              value={project.title}
                              onChange={(e) => {
                                const newProjects = [...draftProjects];
                                newProjects[idx].title = e.target.value;
                                setDraftProjects(newProjects);
                              }}
                              className="bg-transparent text-xl font-bold focus:outline-none focus:border-b border-accent-purple"
                            />
                            <button onClick={() => setDraftProjects(draftProjects.filter(p => p.id !== project.id))} className="text-red-500 hover:bg-red-500/10 p-2 rounded-[10px]">
                              <Trash2 size={20} />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <input 
                                value={project.category}
                                onChange={(e) => {
                                  const newProjects = [...draftProjects];
                                  newProjects[idx].category = e.target.value;
                                  setDraftProjects(newProjects);
                                }}
                                className="w-full bg-white/5 border border-white/10 rounded-[10px] px-4 py-2 text-sm"
                                placeholder="Category"
                              />
                              <textarea 
                                value={project.description}
                                onChange={(e) => {
                                  const newProjects = [...draftProjects];
                                  newProjects[idx].description = e.target.value;
                                  setDraftProjects(newProjects);
                                }}
                                className="w-full bg-white/5 border border-white/10 rounded-[10px] px-4 py-2 text-sm min-h-[100px]"
                                placeholder="Description"
                              />
                              <input 
                                value={project.keywords.join(', ')}
                                onChange={(e) => {
                                  const newProjects = [...draftProjects];
                                  newProjects[idx].keywords = e.target.value.split(',').map(k => k.trim());
                                  setDraftProjects(newProjects);
                                }}
                                className="w-full bg-white/5 border border-white/10 rounded-[10px] px-4 py-2 text-sm"
                                placeholder="Keywords (comma separated)"
                              />
                            </div>
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 mb-2">
                                <input 
                                  type="checkbox"
                                  id={`isPdf-${project.id}`}
                                  checked={project.isPdf || false}
                                  onChange={(e) => {
                                    const newProjects = [...draftProjects];
                                    newProjects[idx].isPdf = e.target.checked;
                                    setDraftProjects(newProjects);
                                  }}
                                  className="w-4 h-4 accent-accent-purple"
                                />
                                <label htmlFor={`isPdf-${project.id}`} className="text-xs font-bold text-white/60">PDF 프로젝트 (전체 이미지 표시)</label>
                              </div>
                              <div className="flex flex-wrap gap-2 mb-2">
                                {project.images.map((img, i) => (
                                  <div key={i} className="relative w-20 h-20 rounded-[10px] overflow-hidden group">
                                    <img src={img} className="w-full h-full object-cover" />
                                    <button 
                                      onClick={() => {
                                        const newProjects = [...draftProjects];
                                        newProjects[idx].images = project.images.filter((_, imgIdx) => imgIdx !== i);
                                        setDraftProjects(newProjects);
                                      }}
                                      className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                ))}
                                <label className="w-20 h-20 rounded-[10px] border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-accent-purple transition-colors">
                                  <Plus size={24} />
                                  <span className="text-[8px] text-white/40">800x600px</span>
                                  <input 
                                    type="file" 
                                    multiple 
                                    className="hidden" 
                                    onChange={(e) => {
                                      const files = Array.from(e.target.files || []);
                                      files.forEach((file: File) => {
                                        if (file.size > 1024 * 1024) {
                                          alert(`이미지 용량이 너무 큽니다 (${(file.size / 1024).toFixed(0)}KB). 1MB 이하의 이미지를 사용해주세요. (주)브로스코 이미지 등 고해상도 이미지는 압축 후 업로드 바랍니다. Firestore의 단일 문서 제한은 1MB입니다.`);
                                          return;
                                        }
                                        const reader = new FileReader();
                                        reader.onloadend = async () => {
                                          const compressed = await compressImage(reader.result as string, 1200, 800, 0.7);
                                          const newProjects = [...draftProjects];
                                          newProjects[idx].images = [...project.images, compressed];
                                          setDraftProjects(newProjects);
                                        };
                                        reader.readAsDataURL(file);
                                      });
                                    }}
                                  />
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <hr className="border-accent-purple border-t-[3px] my-12" />

                  {/* Navigation Pages Content Section */}
                  <div id="admin-nav-pages" className="bg-white/5 p-8 rounded-[10px] border border-white/10 scroll-mt-32">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Layout size={20} /> Navigation Pages Content</h3>
                    <div className="space-y-12">
                      {(Object.entries(draftConfig.sections) as [keyof typeof draftConfig.sections, any][]).map(([key, section]) => (
                        <div 
                          key={key} 
                          id={key === 'company' ? 'admin-company-page' : undefined}
                          className="bg-black/40 p-6 rounded-[10px] border border-white/5 space-y-6"
                        >
                          <div className="flex justify-between items-center">
                            <h4 className="text-lg font-bold uppercase text-accent-purple">{key} Page</h4>
                            {key !== 'about' && (
                              <button 
                                onClick={() => {
                                  const newSections = { ...draftConfig.sections };
                                  const newItem = key === 'company' ? { id: Date.now().toString(), name: '', role: '', period: '', reason: '', business: '', scale: '', revenue: '', employees: '', workplace: '' } :
                                                 key === 'project' ? { id: Date.now().toString(), company: '', name: '', desc: '', image: '', contribution: '', period: '', size: '', iconName: 'Layout' } :
                                                 { id: Date.now().toString(), client: '', request: '', image: '', contribution: '', period: '', iconName: 'Layout' };
                                  (newSections[key] as any).items.push(newItem as any);
                                  setDraftConfig({ ...draftConfig, sections: newSections });
                                }}
                                className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-[10px] text-xs font-bold hover:bg-white/10"
                              >
                                <Plus size={14} /> Add Item
                              </button>
                            )}
                          </div>
                          
                          {/* Label Editor (for non-about sections) */}
                          {key !== 'about' && section.labels && (
                            <div className="bg-white/5 p-4 rounded-[10px] border border-white/5 space-y-4">
                              <h5 className="text-xs font-bold text-white/40 uppercase">Field Labels (English to Korean)</h5>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {Object.entries(section.labels).map(([field, label]) => (
                                  <div key={field} className="space-y-1">
                                    <label className="block text-[10px] font-bold text-white/20 uppercase">{field}</label>
                                    <input 
                                      value={label as string}
                                      onChange={(e) => {
                                        const newSections = { ...draftConfig.sections };
                                        if (newSections[key].labels) {
                                          (newSections[key].labels as any)[field] = e.target.value;
                                          setDraftConfig({ ...draftConfig, sections: newSections });
                                        }
                                      }}
                                      className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="block text-xs font-bold text-white/40">Title</label>
                              <input 
                                value={section.title} 
                                onChange={(e) => {
                                  const newSections = { ...draftConfig.sections };
                                  newSections[key].title = e.target.value;
                                  setDraftConfig({ ...draftConfig, sections: newSections });
                                }} 
                                className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-sm" 
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-xs font-bold text-white/40">Subtitle</label>
                              <input 
                                value={section.subtitle} 
                                onChange={(e) => {
                                  const newSections = { ...draftConfig.sections };
                                  newSections[key].subtitle = e.target.value;
                                  setDraftConfig({ ...draftConfig, sections: newSections });
                                }} 
                                className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-sm" 
                              />
                            </div>
                          </div>

                          {key === 'project' && (
                            <div id="admin-portfolio-settings" className="bg-white/5 p-4 rounded-[10px] border border-white/5 space-y-4 scroll-mt-32">
                              <h5 className="text-xs font-bold text-white/40 uppercase">Portfolio Link Settings</h5>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                  <label className="block text-[10px] font-bold text-white/20 uppercase">Display Name</label>
                                  <input 
                                    value={draftConfig.portfolioPdfName || ''}
                                    onChange={(e) => setDraftConfig({ ...draftConfig, portfolioPdfName: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs"
                                    placeholder="e.g. portfolio.pdf"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="block text-[10px] font-bold text-white/20 uppercase">Button Text</label>
                                  <input 
                                    value={draftConfig.portfolioPdfButtonText || ''}
                                    onChange={(e) => setDraftConfig({ ...draftConfig, portfolioPdfButtonText: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs"
                                    placeholder="e.g. Download PDF"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="block text-[10px] font-bold text-white/20 uppercase">Link URL</label>
                                  <input 
                                    value={draftConfig.portfolioPdfUrl || ''}
                                    onChange={(e) => setDraftConfig({ ...draftConfig, portfolioPdfUrl: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs"
                                    placeholder="https://example.com/portfolio.pdf"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-white/20 uppercase">Description</label>
                                <textarea 
                                  value={draftConfig.portfolioPdfDesc || ''}
                                  onChange={(e) => setDraftConfig({ ...draftConfig, portfolioPdfDesc: e.target.value })}
                                  className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs h-20 resize-none"
                                  placeholder="Enter description here..."
                                />
                              </div>
                            </div>
                          )}
                          
                          {key === 'about' ? (
                            <div className="space-y-8">
                              {/* Section Titles & Subtitles */}
                              <div className="bg-white/5 p-4 rounded-[10px] border border-white/5 space-y-4">
                                <h5 className="text-xs font-bold text-white/40 uppercase">Section Titles & Subtitles</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {[
                                    { key: 'experienceTitle', label: 'Experience Title' },
                                    { key: 'experienceSubtitle', label: 'Experience Subtitle' },
                                    { key: 'licenseTitle', label: 'License Title' },
                                    { key: 'licenseSubtitle', label: 'License Subtitle' },
                                    { key: 'awardTitle', label: 'Award Title' },
                                    { key: 'awardSubtitle', label: 'Award Subtitle' },
                                    { key: 'volunteerTitle', label: 'Volunteer Title' },
                                    { key: 'volunteerSubtitle', label: 'Volunteer Subtitle' },
                                    { key: 'educationTitle', label: 'Education Title' },
                                    { key: 'educationSubtitle', label: 'Education Subtitle' },
                                  ].map((item) => (
                                    <div key={item.key} className="space-y-1">
                                      <label className="block text-[10px] font-bold text-white/20 uppercase">{item.label}</label>
                                      <input 
                                        value={(draftConfig.sections.about.labels as any)?.[item.key] || ''}
                                        onChange={(e) => {
                                          const newSections = { ...draftConfig.sections };
                                          if (!newSections.about.labels) newSections.about.labels = {};
                                          (newSections.about.labels as any)[item.key] = e.target.value;
                                          setDraftConfig({ ...draftConfig, sections: newSections });
                                        }}
                                        className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs focus:border-accent-purple outline-none"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Personal Info */}
                              <div className="bg-white/5 p-4 rounded-[10px] border border-white/5 space-y-4">
                                <h5 className="text-xs font-bold text-white/40 uppercase">Personal Info</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="flex items-center gap-4">
                                    <label className="shrink-0 w-20 h-20 flex flex-col items-center justify-center bg-white/5 border border-dashed border-white/20 rounded-full cursor-pointer overflow-hidden hover:border-accent-purple transition-colors">
                                      {draftConfig.sections.about.personalInfo?.photo ? (
                                        <img src={draftConfig.sections.about.personalInfo.photo} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="flex flex-col items-center p-2 text-center">
                                          <Upload size={20} />
                                          <span className="text-[8px] text-white/40 mt-1">권장: 400x400px</span>
                                          <span className="text-[8px] text-white/20">Max: 1MB</span>
                                        </div>
                                      )}
                                      <input 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            if (file.size > 1024 * 1024) {
                                              alert('이미지 용량이 너무 큽니다. 1MB 이하의 이미지를 사용해주세요.');
                                              return;
                                            }
                                            const reader = new FileReader();
                                            reader.onloadend = async () => {
                                              const compressed = await compressImage(reader.result as string, 400, 400, 0.8);
                                              const newSections = { ...draftConfig.sections };
                                              if (!newSections.about.personalInfo) newSections.about.personalInfo = {};
                                              newSections.about.personalInfo.photo = compressed;
                                              setDraftConfig({ ...draftConfig, sections: newSections });
                                            };
                                            reader.readAsDataURL(file);
                                          }
                                        }}
                                      />
                                    </label>
                                    <div className="space-y-2 flex-grow">
                                      <div className="space-y-1">
                                        <label className="block text-[10px] font-bold text-white/20 uppercase">Name</label>
                                        <input 
                                          value={draftConfig.sections.about.personalInfo?.name || ''}
                                          onChange={(e) => {
                                            const newSections = { ...draftConfig.sections };
                                            if (!newSections.about.personalInfo) newSections.about.personalInfo = {};
                                            newSections.about.personalInfo.name = e.target.value;
                                            setDraftConfig({ ...draftConfig, sections: newSections });
                                          }}
                                          className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs focus:border-accent-purple outline-none"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="block text-[10px] font-bold text-white/20 uppercase">English Name</label>
                                        <input 
                                          value={draftConfig.sections.about.personalInfo?.englishName || ''}
                                          onChange={(e) => {
                                            const newSections = { ...draftConfig.sections };
                                            if (!newSections.about.personalInfo) newSections.about.personalInfo = {};
                                            newSections.about.personalInfo.englishName = e.target.value;
                                            setDraftConfig({ ...draftConfig, sections: newSections });
                                          }}
                                          className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs focus:border-accent-purple outline-none"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {['birthDate', 'phone', 'email'].map(field => (
                                      <div key={field} className="space-y-1">
                                        <label className="block text-[10px] font-bold text-white/20 uppercase">{field}</label>
                                        <input 
                                          value={(draftConfig.sections.about.personalInfo as any)?.[field] || ''}
                                          onChange={(e) => {
                                            const newSections = { ...draftConfig.sections };
                                            if (!newSections.about.personalInfo) newSections.about.personalInfo = {};
                                            (newSections.about.personalInfo as any)[field] = e.target.value;
                                            setDraftConfig({ ...draftConfig, sections: newSections });
                                          }}
                                          className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs focus:border-accent-purple outline-none"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Skills */}
                              <div className="bg-white/5 p-4 rounded-[10px] border border-white/5 space-y-4">
                                <div className="flex justify-between items-center">
                                  <h5 className="text-xs font-bold text-white/40 uppercase">Skills</h5>
                                  <button 
                                    onClick={() => {
                                      const newSections = { ...draftConfig.sections };
                                      newSections.about.skills.push({ id: Date.now().toString(), name: '', level: '중' });
                                      setDraftConfig({ ...draftConfig, sections: newSections });
                                    }}
                                    className="text-[10px] bg-white/5 px-2 py-1 rounded hover:bg-white/10"
                                  >
                                    + Add Skill
                                  </button>
                                </div>
                                <div className="space-y-2">
                                  {draftConfig.sections.about.skills.map((skill, idx) => (
                                    <div key={skill.id} className="flex gap-2 items-center">
                                      <input 
                                        value={skill.name}
                                        onChange={(e) => {
                                          const newSections = { ...draftConfig.sections };
                                          newSections.about.skills[idx].name = e.target.value;
                                          setDraftConfig({ ...draftConfig, sections: newSections });
                                        }}
                                        className="flex-grow bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs"
                                        placeholder="Skill Name"
                                      />
                                      <select 
                                        value={skill.level}
                                        onChange={(e) => {
                                          const newSections = { ...draftConfig.sections };
                                          newSections.about.skills[idx].level = e.target.value as any;
                                          setDraftConfig({ ...draftConfig, sections: newSections });
                                        }}
                                        className="bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs"
                                      >
                                        <option value="상">상</option>
                                        <option value="중">중</option>
                                        <option value="하">하</option>
                                      </select>
                                      <button 
                                        onClick={() => {
                                          const newSections = { ...draftConfig.sections };
                                          newSections.about.skills = newSections.about.skills.filter(s => s.id !== skill.id);
                                          setDraftConfig({ ...draftConfig, sections: newSections });
                                        }}
                                        className="text-red-500 p-1"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Experience */}
                              <div className="bg-white/5 p-4 rounded-[10px] border border-white/5 space-y-4">
                                <div className="flex justify-between items-center">
                                  <h5 className="text-xs font-bold text-white/40 uppercase">Experience</h5>
                                  <button 
                                    onClick={() => {
                                      const newSections = { ...draftConfig.sections };
                                      newSections.about.experience.push({ id: Date.now().toString(), period: '', role: '', company: '', job: '' });
                                      setDraftConfig({ ...draftConfig, sections: newSections });
                                    }}
                                    className="text-[10px] bg-white/5 px-2 py-1 rounded hover:bg-white/10"
                                  >
                                    + Add Experience
                                  </button>
                                </div>
                                <div className="space-y-4">
                                  {draftConfig.sections.about.experience.map((exp, idx) => (
                                    <div key={exp.id} className="bg-black/40 p-3 rounded-[10px] border border-white/5 space-y-2">
                                      <div className="flex justify-between">
                                        <span className="text-[10px] text-white/20">#{idx + 1}</span>
                                        <button 
                                          onClick={() => {
                                            const newSections = { ...draftConfig.sections };
                                            newSections.about.experience = newSections.about.experience.filter(e => e.id !== exp.id);
                                            setDraftConfig({ ...draftConfig, sections: newSections });
                                          }}
                                          className="text-red-500"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                        <input value={exp.period} onChange={(e) => { const ns = {...draftConfig.sections}; ns.about.experience[idx].period = e.target.value; setDraftConfig({...draftConfig, sections: ns}); }} className="bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs" placeholder="Period" />
                                        <input value={exp.role} onChange={(e) => { const ns = {...draftConfig.sections}; ns.about.experience[idx].role = e.target.value; setDraftConfig({...draftConfig, sections: ns}); }} className="bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs" placeholder="Role" />
                                        <input value={exp.company} onChange={(e) => { const ns = {...draftConfig.sections}; ns.about.experience[idx].company = e.target.value; setDraftConfig({...draftConfig, sections: ns}); }} className="bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs" placeholder="Company" />
                                        <input value={exp.job || ''} onChange={(e) => { const ns = {...draftConfig.sections}; ns.about.experience[idx].job = e.target.value; setDraftConfig({...draftConfig, sections: ns}); }} className="bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs" placeholder="Job Description" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* License */}
                              <div className="bg-white/5 p-4 rounded-[10px] border border-white/5 space-y-4">
                                <div className="flex justify-between items-center">
                                  <h5 className="text-xs font-bold text-white/40 uppercase">License</h5>
                                  <button 
                                    onClick={() => {
                                      const newSections = { ...draftConfig.sections };
                                      newSections.about.license.push({ id: Date.now().toString(), name: '', issuer: '' });
                                      setDraftConfig({ ...draftConfig, sections: newSections });
                                    }}
                                    className="text-[10px] bg-white/5 px-2 py-1 rounded hover:bg-white/10"
                                  >
                                    + Add License
                                  </button>
                                </div>
                                <div className="space-y-2">
                                  {draftConfig.sections.about.license.map((lic, idx) => (
                                    <div key={lic.id} className="flex gap-2 items-center">
                                      <input value={lic.name} onChange={(e) => { const ns = {...draftConfig.sections}; ns.about.license[idx].name = e.target.value; setDraftConfig({...draftConfig, sections: ns}); }} className="flex-grow bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs" placeholder="License Name" />
                                      <input value={lic.issuer} onChange={(e) => { const ns = {...draftConfig.sections}; ns.about.license[idx].issuer = e.target.value; setDraftConfig({...draftConfig, sections: ns}); }} className="flex-grow bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs" placeholder="Issuer" />
                                      <button onClick={() => { const ns = {...draftConfig.sections}; ns.about.license = ns.about.license.filter(l => l.id !== lic.id); setDraftConfig({...draftConfig, sections: ns}); }} className="text-red-500 p-1"><Trash2 size={14} /></button>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Award */}
                              <div className="bg-white/5 p-4 rounded-[10px] border border-white/5 space-y-4">
                                <div className="flex justify-between items-center">
                                  <h5 className="text-xs font-bold text-white/40 uppercase">Award</h5>
                                  <button 
                                    onClick={() => {
                                      const newSections = { ...draftConfig.sections };
                                      newSections.about.award.push({ id: Date.now().toString(), name: '', category: '', issuer: '' });
                                      setDraftConfig({ ...draftConfig, sections: newSections });
                                    }}
                                    className="text-[10px] bg-white/5 px-2 py-1 rounded hover:bg-white/10"
                                  >
                                    + Add Award
                                  </button>
                                </div>
                                <div className="space-y-4">
                                  {draftConfig.sections.about.award.map((awd, idx) => (
                                    <div key={awd.id} className="bg-black/40 p-3 rounded-[10px] border border-white/5 space-y-2">
                                      <div className="flex justify-between">
                                        <span className="text-[10px] text-white/20">#{idx + 1}</span>
                                        <button onClick={() => { const ns = {...draftConfig.sections}; ns.about.award = ns.about.award.filter(a => a.id !== awd.id); setDraftConfig({...draftConfig, sections: ns}); }} className="text-red-500"><Trash2 size={14} /></button>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        <input value={awd.name} onChange={(e) => { const ns = {...draftConfig.sections}; ns.about.award[idx].name = e.target.value; setDraftConfig({...draftConfig, sections: ns}); }} className="bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs" placeholder="Award Name" />
                                        <input value={awd.category} onChange={(e) => { const ns = {...draftConfig.sections}; ns.about.award[idx].category = e.target.value; setDraftConfig({...draftConfig, sections: ns}); }} className="bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs" placeholder="Category" />
                                        <input value={awd.issuer} onChange={(e) => { const ns = {...draftConfig.sections}; ns.about.award[idx].issuer = e.target.value; setDraftConfig({...draftConfig, sections: ns}); }} className="bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs" placeholder="Issuer" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Volunteer */}
                              <div className="bg-white/5 p-4 rounded-[10px] border border-white/5 space-y-4">
                                <div className="flex justify-between items-center">
                                  <h5 className="text-xs font-bold text-white/40 uppercase">Volunteer</h5>
                                  <button 
                                    onClick={() => {
                                      const newSections = { ...draftConfig.sections };
                                      newSections.about.volunteer.push({ id: Date.now().toString(), period: '', name: '', role: '' });
                                      setDraftConfig({ ...draftConfig, sections: newSections });
                                    }}
                                    className="text-[10px] bg-white/5 px-2 py-1 rounded hover:bg-white/10"
                                  >
                                    + Add Volunteer
                                  </button>
                                </div>
                                <div className="space-y-4">
                                  {draftConfig.sections.about.volunteer.map((vol, idx) => (
                                    <div key={vol.id} className="bg-black/40 p-3 rounded-[10px] border border-white/5 space-y-2">
                                      <div className="flex justify-between">
                                        <span className="text-[10px] text-white/20">#{idx + 1}</span>
                                        <button onClick={() => { const ns = {...draftConfig.sections}; ns.about.volunteer = ns.about.volunteer.filter(v => v.id !== vol.id); setDraftConfig({...draftConfig, sections: ns}); }} className="text-red-500"><Trash2 size={14} /></button>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        <input value={vol.period} onChange={(e) => { const ns = {...draftConfig.sections}; ns.about.volunteer[idx].period = e.target.value; setDraftConfig({...draftConfig, sections: ns}); }} className="bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs" placeholder="Period" />
                                        <input value={vol.name} onChange={(e) => { const ns = {...draftConfig.sections}; ns.about.volunteer[idx].name = e.target.value; setDraftConfig({...draftConfig, sections: ns}); }} className="bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs" placeholder="Volunteer Name" />
                                        <input value={vol.role} onChange={(e) => { const ns = {...draftConfig.sections}; ns.about.volunteer[idx].role = e.target.value; setDraftConfig({...draftConfig, sections: ns}); }} className="bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs" placeholder="Role" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Education */}
                              <div className="bg-white/5 p-4 rounded-[10px] border border-white/5 space-y-4">
                                <div className="flex justify-between items-center">
                                  <h5 className="text-xs font-bold text-white/40 uppercase">Education / Lecture</h5>
                                  <button 
                                    onClick={() => {
                                      const newSections = { ...draftConfig.sections };
                                      if (!newSections.about.education) newSections.about.education = [];
                                      newSections.about.education.push({ id: Date.now().toString(), title: '', organizer: '', period: '', location: '', content: '' });
                                      setDraftConfig({ ...draftConfig, sections: newSections });
                                    }}
                                    className="text-[10px] bg-white/5 px-2 py-1 rounded hover:bg-white/10"
                                  >
                                    + Add Education
                                  </button>
                                </div>
                                <div className="space-y-4">
                                  {(draftConfig.sections.about.education || []).map((edu, idx) => (
                                    <div key={edu.id} className="bg-black/40 p-3 rounded-[10px] border border-white/5 space-y-2">
                                      <div className="flex justify-between">
                                        <span className="text-[10px] text-white/20">#{idx + 1}</span>
                                        <button 
                                          onClick={() => { 
                                            const ns = {...draftConfig.sections}; 
                                            ns.about.education = (ns.about.education || []).filter(e => e.id !== edu.id); 
                                            setDraftConfig({...draftConfig, sections: ns}); 
                                          }} 
                                          className="text-red-500"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        <input value={edu.title} onChange={(e) => { const ns = {...draftConfig.sections}; ns.about.education![idx].title = e.target.value; setDraftConfig({...draftConfig, sections: ns}); }} className="bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs" placeholder="Title" />
                                        <input value={edu.organizer} onChange={(e) => { const ns = {...draftConfig.sections}; ns.about.education![idx].organizer = e.target.value; setDraftConfig({...draftConfig, sections: ns}); }} className="bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs" placeholder="Organizer" />
                                        <input value={edu.period} onChange={(e) => { const ns = {...draftConfig.sections}; ns.about.education![idx].period = e.target.value; setDraftConfig({...draftConfig, sections: ns}); }} className="bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs" placeholder="Period" />
                                        <input value={edu.location} onChange={(e) => { const ns = {...draftConfig.sections}; ns.about.education![idx].location = e.target.value; setDraftConfig({...draftConfig, sections: ns}); }} className="bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs" placeholder="Location" />
                                      </div>
                                      <textarea 
                                        value={edu.content} 
                                        onChange={(e) => { const ns = {...draftConfig.sections}; ns.about.education![idx].content = e.target.value; setDraftConfig({...draftConfig, sections: ns}); }} 
                                        className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs h-20 resize-none" 
                                        placeholder="Description" 
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {section.items.map((item: any, idx: number) => (
                                <div key={item.id} className="bg-white/5 p-4 rounded-[10px] border border-white/5 space-y-4">
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                      <span className="text-xs font-bold text-white/20">Item #{idx + 1}</span>
                                      {/* Icon Selector for Project, Subcontract */}
                                      {(key === 'project' || key === 'subcontract') && (
                                        <div className="flex items-center gap-2 bg-black/40 p-1 rounded-[10px] border border-white/5">
                                          <select 
                                            value={item.iconImage ? 'image' : 'lucide'}
                                            onChange={(e) => {
                                              const newSections = { ...draftConfig.sections };
                                              if (e.target.value === 'lucide') {
                                                (newSections[key] as any).items[idx].iconImage = undefined;
                                              } else {
                                                (newSections[key] as any).items[idx].iconImage = '';
                                              }
                                              setDraftConfig({ ...draftConfig, sections: newSections });
                                            }}
                                            className="bg-transparent text-[10px] border-none focus:ring-0"
                                          >
                                            <option value="lucide">Icon</option>
                                            <option value="image">PNG</option>
                                          </select>
                                          {item.iconImage !== undefined ? (
                                            <div className="flex items-center gap-2">
                                            <label className="shrink-0 w-8 h-8 flex flex-col items-center justify-center bg-white/5 border border-dashed border-white/20 rounded cursor-pointer">
                                              <Upload size={12} />
                                              <span className="text-[6px] text-white/40">64x64px</span>
                                              <span className="text-[5px] text-white/20">Max 100KB</span>
                                              <input 
                                                type="file" 
                                                className="hidden" 
                                                accept="image/png,image/jpeg"
                                                onChange={(e) => {
                                                  const file = e.target.files?.[0];
                                                  if (file) {
                                                    if (file.size > 100 * 1024) {
                                                      alert('아이콘 용량이 너무 큽니다. 100KB 이하의 이미지를 사용해주세요.');
                                                      return;
                                                    }
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                      const newSections = { ...draftConfig.sections };
                                                      (newSections[key] as any).items[idx].iconImage = reader.result as string;
                                                      setDraftConfig({ ...draftConfig, sections: newSections });
                                                    };
                                                    reader.readAsDataURL(file);
                                                  }
                                                }}
                                              />
                                            </label>
                                              {item.iconImage && <img src={item.iconImage} className="w-4 h-4 object-contain" />}
                                            </div>
                                          ) : (
                                            <select 
                                              value={item.iconName}
                                              onChange={(e) => {
                                                const newSections = { ...draftConfig.sections };
                                                (newSections[key] as any).items[idx].iconName = e.target.value;
                                                setDraftConfig({ ...draftConfig, sections: newSections });
                                              }}
                                              className="bg-transparent text-[10px] border-none focus:ring-0"
                                            >
                                              {['User', 'BarChart3', 'Lightbulb', 'Sparkles', 'CheckCircle2', 'MapPin', 'Calendar', 'Building2', 'Users', 'TrendingUp', 'DollarSign', 'Globe', 'FileText', 'PieChart', 'Maximize', 'Briefcase', 'Palette', 'Layers', 'Figma', 'Monitor', 'Layout', 'Zap', 'Cpu', 'Terminal', 'Github', 'Code'].map(icon => (
                                                <option key={icon} value={icon}>{icon}</option>
                                              ))}
                                            </select>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <button 
                                      onClick={() => {
                                        const newSections = { ...draftConfig.sections };
                                        (newSections[key] as any).items = section.items.filter((i: any) => i.id !== item.id);
                                        setDraftConfig({ ...draftConfig, sections: newSections });
                                      }}
                                      className="text-red-500 hover:bg-red-500/10 p-1 rounded"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>

                                  {key === 'company' && (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                      {['name', 'role', 'period', 'reason', 'business', 'scale', 'revenue', 'employees', 'workplace'].map(field => (
                                        <div key={field} className="space-y-1">
                                          <label className="block text-[10px] font-bold text-white/40 uppercase">{section.labels?.[field as keyof typeof section.labels] || field}</label>
                                          <input 
                                            value={item[field]}
                                            onChange={(e) => {
                                              const newSections = { ...draftConfig.sections };
                                              (newSections.company as any).items[idx][field] = e.target.value;
                                              setDraftConfig({ ...draftConfig, sections: newSections });
                                            }}
                                            className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs"
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {key === 'project' && (
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {['company', 'name', 'contribution', 'period', 'size'].map(field => (
                                          <div key={field} className="space-y-1">
                                            <label className="block text-[10px] font-bold text-white/40 uppercase">{section.labels?.[field as keyof typeof section.labels] || field}</label>
                                            <input 
                                              value={item[field]}
                                              onChange={(e) => {
                                                const newSections = { ...draftConfig.sections };
                                                (newSections.project as any).items[idx][field] = e.target.value;
                                                setDraftConfig({ ...draftConfig, sections: newSections });
                                              }}
                                              className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs"
                                            />
                                          </div>
                                        ))}
                                      </div>
                                      <textarea 
                                        value={item.desc}
                                        onChange={(e) => {
                                          const newSections = { ...draftConfig.sections };
                                          (newSections.project as any).items[idx].desc = e.target.value;
                                          setDraftConfig({ ...draftConfig, sections: newSections });
                                        }}
                                        className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs"
                                        placeholder="Description"
                                      />
                                      <div className="flex items-center gap-4">
                                        <label className="flex-grow flex items-center justify-center gap-2 bg-white/5 border border-dashed border-white/20 rounded-[10px] p-2 cursor-pointer hover:border-accent-purple transition-colors">
                                          <Upload size={12} />
                                          <span className="text-[10px]">Upload Image (1200x800px)</span>
                                          <input 
                                            type="file" 
                                            className="hidden" 
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                  const newSections = { ...draftConfig.sections };
                                                  (newSections.project as any).items[idx].image = reader.result as string;
                                                  setDraftConfig({ ...draftConfig, sections: newSections });
                                                };
                                                reader.readAsDataURL(file);
                                              }
                                            }}
                                          />
                                        </label>
                                        {item.image && <img src={item.image} className="w-12 h-12 object-cover rounded" />}
                                      </div>
                                    </div>
                                  )}

                                  {key === 'subcontract' && (
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {['client', 'contribution', 'period'].map(field => (
                                          <div key={field} className="space-y-1">
                                            <label className="block text-[10px] font-bold text-white/40 uppercase">{section.labels?.[field as keyof typeof section.labels] || field}</label>
                                            <input 
                                              value={item[field]}
                                              onChange={(e) => {
                                                const newSections = { ...draftConfig.sections };
                                                (newSections.subcontract as any).items[idx][field] = e.target.value;
                                                setDraftConfig({ ...draftConfig, sections: newSections });
                                              }}
                                              className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs"
                                            />
                                          </div>
                                        ))}
                                      </div>
                                      <textarea 
                                        value={item.request}
                                        onChange={(e) => {
                                          const newSections = { ...draftConfig.sections };
                                          (newSections.subcontract as any).items[idx].request = e.target.value;
                                          setDraftConfig({ ...draftConfig, sections: newSections });
                                        }}
                                        className="w-full bg-black/40 border border-white/10 rounded-[10px] p-2 text-xs"
                                        placeholder="Requirements"
                                      />
                                      <div className="flex items-center gap-4">
                                        <label className="flex-grow flex items-center justify-center gap-2 bg-white/5 border border-dashed border-white/20 rounded-[10px] p-2 cursor-pointer hover:border-accent-purple transition-colors">
                                          <Upload size={12} />
                                          <span className="text-[10px]">Upload Image (1200x800px)</span>
                                          <input 
                                            type="file" 
                                            className="hidden" 
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                  const newSections = { ...draftConfig.sections };
                                                  (newSections.subcontract as any).items[idx].image = reader.result as string;
                                                  setDraftConfig({ ...draftConfig, sections: newSections });
                                                };
                                                reader.readAsDataURL(file);
                                              }
                                            }}
                                          />
                                        </label>
                                        {item.image && <img src={item.image} className="w-12 h-12 object-cover rounded" />}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Portfolio Image Viewer Modal */}
      <AnimatePresence>
        {portfolioViewerImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/95 flex flex-col"
            onClick={() => setPortfolioViewerImage(null)}
          >
            <div className="flex justify-between items-center p-4 px-6 border-b border-white/10 glass-morphism" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold">{portfolioViewerImage.replace('.png', '')} — Portfolio</h2>
              <button
                onClick={() => setPortfolioViewerImage(null)}
                className="p-2 hover:bg-white/10 rounded-[10px] transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto flex justify-center p-6" onClick={e => e.stopPropagation()}>
              <img
                src={`${import.meta.env.BASE_URL}portfolio/${portfolioViewerImage}`}
                alt={portfolioViewerImage.replace('.png', '')}
                className="max-w-4xl w-full h-auto object-contain rounded-[10px]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
