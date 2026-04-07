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
  Target,
  Cpu,
  MessageSquare,
  ArrowRight,
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
  FileText,
  MapPin,
  Calendar,
  Building2,
  Users,
  TrendingUp,
  DollarSign,
  Globe,
  PieChart,
  Maximize,
  Heart,
  BookOpen,
  User,
  Info,
  BarChart3,
  Lightbulb,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

// --- Interfaces ---

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

// --- Initial Data ---

const initialProjects: Project[] = [
  {
    id: '1',
    title: '(주)아이오트러스트',
    category: 'Web Design / BX',
    description: 'CRM 자동 발송 메일 개편, 제품 판매 페이지 리뉴얼 및 AI Agent 생성/배포',
    keywords: ['Web3', 'Blockchain', 'Web Design', 'AI Agent'],
    images: [`${import.meta.env.BASE_URL}images/아이오트러스트_main.png`],
    link: '#PROJECT',
    portfolioImage: '아이오트러스트.png'
  },
  {
    id: '2',
    title: '머티리얼즈파크(주)',
    category: 'VMD / Brand',
    description: '글로벌 브랜드 \'LIFE\'의 VMD 총괄. 뉴욕 본사 승인을 거친 온·오프라인 디자인 가이드 리딩 / 성수동 팝업스토어 기획으로 자사몰 유입 및 구매 전환 성과를 창출.',
    keywords: ['VMD', 'Global Brand', 'Popup Store', 'E-commerce'],
    images: [`${import.meta.env.BASE_URL}images/머티리얼즈파크_main.png`],
    link: '#PROJECT',
    portfolioImage: '머티리얼즈파크.png'
  },
  {
    id: '3',
    title: '(주)글라이드',
    category: 'Web / SNS Design',
    description: '라이브방송 기획 및 출연, 상세페이지/웹배너 제작, SNS(Instagram, Meta, Youtube) 운영',
    keywords: ['E-commerce', 'SNS', 'Live Commerce', 'Web Banner'],
    images: [`${import.meta.env.BASE_URL}images/글라이드_main.png`],
    link: '#PROJECT',
    portfolioImage: '글라이드.png'
  },
  {
    id: '4',
    title: '한국정보기술(주)',
    category: 'Proposal Design',
    description: '조달청/지자체 대상 ICT 사업 수주 총 52건의 제안서와 발표 자료 디자인을 통한 공공 입찰 시각화 전략',
    keywords: ['Proposal', 'PPT Design', 'Public Sector', 'B2G'],
    images: [`${import.meta.env.BASE_URL}images/한국정보기술_main.png`],
    link: '#PROJECT',
    portfolioImage: '한국정보기술.png'
  },
  {
    id: '5',
    title: '(주)브로스코',
    category: 'Product Design',
    description: '라이선스 상품화 디자인 제작/검수 및 온·오프라인 프로모션 디자인',
    keywords: ['Product Design', 'License', 'Character IP', 'Promotion'],
    images: [`${import.meta.env.BASE_URL}images/브로스코_main.png`],
    link: '#PROJECT',
    portfolioImage: '브로스코.png'
  }
];

const initialTimeline: TimelineEntry[] = [
  {
    id: '1',
    year: '2025 - Present',
    company: '(주)아이오트러스트',
    role: 'Web Designer',
    description: 'CRM 자동 발송 메일 개편, 제품 판매 페이지 리뉴얼 및 AI Agent 생성/배포'
  },
  {
    id: '2',
    year: '2023 - 2025',
    company: '머티리얼즈파크(주)',
    role: 'VMD',
    description: '솔브레인㈜ 임직원몰 운영, 캠핑 브랜드(LIFE) VMD 담당'
  },
  {
    id: '3',
    year: '2020 - 2023',
    company: '(주)글라이드',
    role: 'Web/SNS Designer',
    description: '라이브방송 기획 및 출연, 상세페이지/웹배너 제작, SNS(Instagram, Meta, Youtube) 운영'
  },
  {
    id: '4',
    year: '2018 - 2020',
    company: '한국정보기술(주)',
    role: 'Proposal(PPT) Designer',
    description: '조달청/지자체 제출용 제안서 및 발표자료 디자인(52건)'
  },
  {
    id: '5',
    year: '2016 - 2018',
    company: '(주)브로스코',
    role: 'Product Designer',
    description: '라이선스 상품화 디자인 제작/검수 및 온·오프라인 프로모션 디자인'
  },
  {
    id: '6',
    year: '2015 - 2016',
    company: '(주)카카오',
    role: 'UX Researcher',
    description: '앱 별 사용자 분석 및 결과보고서 작성, UX 분석용 임팩트 영상 편집'
  }
];

const initialAwards: AwardEntry[] = [
  { id: '1', year: '1급', title: '컴퓨터 그래픽스운용기능사', organization: '한국산업인력공단' },
  { id: '2', year: '1급', title: '그래픽기술자격(GTQ)', organization: '한국생산성본부' },
  { id: '3', year: '2010', title: 'MOS PowerPoint®', organization: 'Microsoft' },
  { id: '4', year: '2010 Expert', title: 'MOS Word®', organization: 'Microsoft' },
  { id: '5', year: '2010 Expert', title: 'MOS Excel®', organization: 'Microsoft' },
  { id: '6', year: '2급', title: '산업레크리에이션 지도자', organization: '한국체육지도자협회' },
  { id: '7', year: '2종', title: '자동차 운전면허 2종 보통', organization: '경찰청' }
];

const initialSiteConfig: SiteConfig = {
  siteTitle: 'HEE SEUNG PF',
  siteLogo: '',
  heroTagline: '기획부터 디자인까지\nBX 디자이너 고희승입니다.',
  heroSubtitle: 'A Person Who Controls The AI',
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
    phone: '010-6333-6419'
  },
  footerTitle: "Let's Create Something",
  footerSubtitle: "Extraordinary",
  copyright: "© 2024 HEE SEUNG PF. All rights reserved.",
  showBackgroundImage: false,
  backgroundImage: undefined,
  expertiseLabel: 'Expertise',
  expertiseTitle: 'Skill & Workflow',
  workflowSectionTitle: 'Workflows',
  workflowTitleLeft: 'Design',
  workflowTitleRight: 'AI',
  experienceTitle: 'Experience',
  awardsTitle: 'Certifications',
  projectsLabel: 'Selected Works',
  projectsTitle: 'Main Projects',
  skills: [
    { id: '1', name: 'Photoshop', iconImage: `${import.meta.env.BASE_URL}images/Photoshop.png` },
    { id: '2', name: 'Illustrator', iconImage: `${import.meta.env.BASE_URL}images/Illustrator.png` },
    { id: '5', name: 'XD', iconImage: `${import.meta.env.BASE_URL}images/XD.png` },
    { id: '3', name: 'Figma', iconImage: `${import.meta.env.BASE_URL}images/Figma.png` },
    { id: '4', name: 'Sketch', iconImage: `${import.meta.env.BASE_URL}images/Sketch.png` },
    { id: '7', name: 'Ai (Gemini, Claude)', iconImage: `${import.meta.env.BASE_URL}images/Gemini.png` },
    { id: '8', name: 'Sopify', iconImage: `${import.meta.env.BASE_URL}images/Sopify.png` }
  ],
  workflowLeft: [
    { id: '1', step: 'Step.1', title: 'Research', desc: '시장 조사 및 경쟁사\n분석을 통한\n인사이트 도출', note: '', icon: 'BarChart3' },
    { id: '2', step: 'Step.2', title: 'Strategy', desc: '핵심 USP 정의\n> 이미지/ 내용 가독\n우선순위 선정', note: '', icon: 'Lightbulb' },
    { id: '3', step: 'Step.3', title: 'Design', desc: '이미지 편집: Photoshop\n이미지 생성: Gemini, Dzine\n인쇄: Illustrator\n페이지: Figma\n프로그램 우선 작업', note: '', icon: 'Palette' },
    { id: '4', step: 'Step.4', title: 'Review & Plan', desc: 'GA 결과값 데이터화\n: CTR/ROAS 분석,\n차기 프로젝트 반영', note: '', icon: 'CheckCircle2' }
  ],
  workflowRight: [
    { id: '1', step: 'Step.1', title: 'Recognition', desc: '반복적/ 긴소요시간/ 톤앤매너 통일이\n필요한 디자인 작업물 인지', note: '', icon: 'BarChart3' },
    { id: '2', step: 'Step.2', title: 'Frame Build', desc: '기본 가이드라인 구축:\n구글Gem > 제이슨프롬포트(HTML)\n에셋 생성', note: '', icon: 'Lightbulb' },
    { id: '3', step: 'Step.3', title: 'Coding', desc: 'VScode 내 클로드코드를 활용한\n스타일 가이드 생성', note: '', icon: 'Code' },
    { id: '4', step: 'Step.4', title: 'Share', desc: 'Github 등록 후 팀원 전체 사용 가능한\n디자인 Ai 공유 > 프로세스화 및\n오류 수정/업데이트', note: '', icon: 'CheckCircle2' }
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
        photo: `${import.meta.env.BASE_URL}images/profile.png`
      },
      skills: [
        { id: '1', name: 'Photoshop', level: '상' },
        { id: '2', name: 'Illustrator', level: '상' },
        { id: '5', name: 'XD', level: '중' },
        { id: '3', name: 'Figma', level: '상' },
        { id: '4', name: 'Sketch', level: '상' },
        { id: '7', name: 'Ai (Gemini, Claude code)', level: '상' }
      ],
      experience: [
        { id: '1', period: '2025.12.15 - 2026.03.05', role: '마케팅팀', company: '(주)아이오트러스트', job: 'CRM 자동 발송 메일 개편, 제품 판매 페이지 리뉴얼 및 AI Agent 생성/배포' },
        { id: '2', period: '2023. 08. 03 - 2025. 05. 09', role: '이커머스팀', company: '머티리얼즈파크(주)', job: '솔브레인㈜ 임직원몰 운영, 캠핑 브랜드(LIFE) VMD 담당' },
        { id: '3', period: '2020. 06. 08 - 2023. 06. 31', role: '마케팅팀', company: '(주)글라이드', job: '라이브방송 기획 및 출연, 상세페이지/웹배너 제작, SNS(Instagram, Meta, Youtube) 운영' },
        { id: '4', period: '2018. 03. 12 - 2020. 03. 31', role: '디자인팀', company: '한국정보기술(주)', job: '조달청/지자체 제출용 제안서 및 발표자료 디자인(52건)' },
        { id: '5', period: '2016. 07. 25 - 2018. 02. 28', role: '마케팅팀', company: '(주)브로스코', job: '라이선스 상품화 디자인 제작/검수 및 온·오프라인 프로모션 디자인' },
        { id: '6', period: '2015. 12. 08 - 2016. 06. 08', role: 'UX Research part', company: '(주)카카오', job: '앱 별 사용자 분석 및 결과보고서 작성, UX 분석용 임팩트 영상 편집' }
      ],
      license: [
        { id: '1', name: '컴퓨터 그래픽스운용기능사 1급', issuer: '한국산업인력공단' },
        { id: '2', name: '그래픽기술자격(GTQ) 1급', issuer: '한국생산성본부' },
        { id: '3', name: 'MOS PowerPoint® 2010', issuer: 'Microsoft' },
        { id: '4', name: 'MOS Word® 2010 Expert', issuer: 'Microsoft' },
        { id: '5', name: 'MOS Excel® 2010 Expert', issuer: 'Microsoft' },
        { id: '6', name: '산업레크리에이션 지도자 2급', issuer: '한국체육지도자협회' }
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
        { id: '1', period: '2016. 03 - 2016. 03', name: '(주)카카오 해외 봉사', role: '베트남 자원봉사단 | 숍손 특수 장애학교 - 정문 벽화 디자인 담당' },
        { id: '2', period: '2013. 05 - 2013. 10', name: '판교푸른학교', role: '미술 보조 교사 | 성남시 관할 공공기관(KT&G) 소속 - 원아관리/ 미술선생님으로 활동' },
        { id: '3', period: '2012. 04 - 2014. 06', name: '지체 장애인 아동 심리 미술 치료', role: '교내 학부봉사' }
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
        licenseTitle: 'Certifications',
        licenseSubtitle: 'LICENSE',
        awardTitle: 'Award',
        awardSubtitle: 'RECOGNITIONS',
        volunteerTitle: 'Volunteer',
        volunteerSubtitle: 'SOCIAL CONTRIBUTION',
        educationTitle: 'EDUCATION / OFFLINE LECTURE',
        educationSubtitle: 'LEARNING & GROWTH'
      }
    },
    company: {
      title: 'past companies',
      subtitle: '이전 근무지 요약본',
      labels: {
        name: 'Company Name',
        role: '업무',
        period: 'Period',
        reason: '퇴사 사유',
        business: '직종',
        scale: '기업 규모',
        revenue: '매출액',
        employees: '임직원',
        workplace: '근무 위치'
      },
      items: [
        { id: '1', name: '(주)아이오트러스트', role: 'Web Designer', period: '2025.12 ~ 2026.03', reason: '업 직종 전환', business: '블록체인/웹3', scale: '중소기업', revenue: '60억', employees: '54명', workplace: '서울 청담' },
        { id: '2', name: '머티리얼즈파크(주)', role: 'Brand VMD', period: '2023.08 ~ 2025.05', reason: '직무 확장', business: 'B2C 도소매업', scale: '중소기업', revenue: '467억', employees: '110명', workplace: '성남 판교' },
        { id: '3', name: '(주)글라이드', role: 'Web/SNS Design', period: '2020.06 ~ 2023.06', reason: '경영 악화', business: '식품 판매업', scale: '대기업', revenue: '32억', employees: '-', workplace: '성남 판교' },
        { id: '4', name: '한국정보기술(주)', role: 'Proposal(PPT) Design', period: '2018.03 ~ 2020.03', reason: '근무 조건', business: '응용 소프트웨어 개발 및 공급업', scale: '중소기업', revenue: '726억', employees: '331명', workplace: '성남 판교' },
        { id: '5', name: '(주)브로스코', role: 'Product Design', period: '2016.07 ~ 2018.02', reason: '조직 규모', business: '캐릭터 디자인 개발 라이센스 대행사', scale: '중소기업', revenue: '-', employees: '10+', workplace: '성남 판교' }
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
          errorMessage = `Error: ${parsed.error}`;
          errorDetail = parsed.operationType ? `Operation: ${parsed.operationType} on ${parsed.path}` : '';
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
                          const SkillIcon = masterSkill ? ({
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
                                      <SkillIcon size={20} />
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
                        <h4 className="text-2xl font-bold uppercase tracking-tight">{content!.labels?.experienceTitle || 'Experience'}</h4>
                        <p className="text-[10px] text-white/40 font-bold tracking-[0.2em]">{content!.labels?.experienceSubtitle || 'PROFESSIONAL JOURNEY'}</p>
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
                        <h4 className="text-2xl font-bold uppercase tracking-tight">{content!.labels?.licenseTitle || 'License'}</h4>
                        <p className="text-[10px] text-white/40 font-bold tracking-[0.2em]">{content!.labels?.licenseSubtitle || 'CERTIFICATIONS'}</p>
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
                        <h4 className="text-2xl font-bold uppercase tracking-tight">{content!.labels?.awardTitle || 'Award'}</h4>
                        <p className="text-[10px] text-white/40 font-bold tracking-[0.2em]">{content!.labels?.awardSubtitle || 'RECOGNITIONS'}</p>
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
                        <h4 className="text-2xl font-bold uppercase tracking-tight">{content!.labels?.volunteerTitle || 'Volunteer'}</h4>
                        <p className="text-[10px] text-white/40 font-bold tracking-[0.2em]">{content!.labels?.volunteerSubtitle || 'SOCIAL CONTRIBUTION'}</p>
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
                          <h4 className="text-2xl font-bold uppercase tracking-tight">{content!.labels?.educationTitle || 'EDUCATION / OFFLINE LECTURE'}</h4>
                          <p className="text-[10px] text-white/40 font-bold tracking-[0.2em]">{content!.labels?.educationSubtitle || 'LEARNING & GROWTH'}</p>
                        </div>
                      </div>
                      <div className="space-y-6">
                        {(content as any).education.map((edu: any) => (
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
                {content!.items.map(item => (
                  <div key={item.id} className="bg-white/5 p-6 rounded-[10px] border border-white/5 space-y-4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-bold text-accent-purple">{item.name}</h3>
                      <span className="text-xs bg-white/5 px-3 py-1 rounded-[10px]">{item.period}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {content!.labels && Object.entries(content!.labels).map(([field, label]) => {
                        const getFieldIcon = (f: string) => {
                          switch (f) {
                            case 'role': return <User size={12} className="text-accent-purple" />;
                            case 'reason': return <Globe size={12} className="text-accent-purple" />;
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
                {content!.items.map(item => (
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
                        {content!.labels && Object.entries(content!.labels).map(([field, label]) => (
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
                {content!.items.map(item => (
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
                        <span className="text-white/40 block text-[10px] uppercase font-bold mb-1">{content!.labels?.request}</span>
                        <p className="text-sm">{item.request}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t border-white/5">
                        {content!.labels && Object.entries(content!.labels).map(([field, label]) => (
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

// --- Portfolio Image Map ---

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

// --- App Wrapper ---

export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

// --- Main App ---

function App() {
  const [projects] = useState<Project[]>(initialProjects);
  const [timeline] = useState<TimelineEntry[]>(initialTimeline);
  const [awards] = useState<AwardEntry[]>(initialAwards);
  const [siteConfig] = useState<SiteConfig>(initialSiteConfig);

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [portfolioViewerImage, setPortfolioViewerImage] = useState<string | null>(null);

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
      <nav className="fixed top-0 left-0 right-0 z-[120] glass-morphism py-4 px-6 md:px-12 grid grid-cols-3 items-center">
        <button
          onClick={() => {
            setActiveModal(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="text-xl font-bold tracking-tighter hover:opacity-80 transition-opacity justify-self-start"
        >
          {siteConfig.siteLogo ? (
            <img src={siteConfig.siteLogo} alt={siteConfig.siteTitle} className="h-8 object-contain" referrerPolicy="no-referrer" />
          ) : (
            siteConfig.siteTitle
          )}
        </button>
        <div className="hidden md:flex justify-center gap-8 text-sm font-medium">
          <button onClick={() => { setActiveModal(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-accent-purple transition-colors">HOME</button>
          <button onClick={() => setActiveModal('about')} className="hover:text-accent-purple transition-colors">RESUME</button>
          <button onClick={() => setActiveModal('company')} className="hover:text-accent-purple transition-colors">COMPANY</button>
        </div>
        <div />
      </nav>

      <main className="relative z-10 pt-32 px-6 md:px-12 max-w-7xl mx-auto">
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
                  const ToolIcon = ({
                    Palette, Layers, Figma, Monitor, Layout, Zap, Cpu, Terminal, Github, Code
                  }[tool.iconName || ''] || Code) as React.ComponentType<{ size: number }>;
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
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="text-accent-purple"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2H2v10h10V2z"/><path d="m17.92 14 3.5 3.5-3.5 3.5"/><path d="M5 22h14"/><path d="M5 17h14"/><path d="M5 12h14"/></svg></div>';
                            }}
                          />
                        ) : (
                          <ToolIcon size={40} />
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
            <div className="flex-1 overflow-hidden flex items-center justify-center bg-black" onClick={e => e.stopPropagation()}>
              <img
                src={`${import.meta.env.BASE_URL}portfolio/${portfolioViewerImage}`}
                alt={portfolioViewerImage.replace('.png', '')}
                className="w-full h-full object-contain"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
