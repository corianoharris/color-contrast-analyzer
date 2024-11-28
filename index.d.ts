interface AccessibilityAnalysis {
    contrastIssues: Array<{
      colors: string[];
      ratio: number;
      recommendation: string;
    }>;
    wcagCompliance: {
      level: 'AAA' | 'AA' | 'A' | 'Fail';
      issues: string[];
    };
    aiRecommendations: string[];
  }
