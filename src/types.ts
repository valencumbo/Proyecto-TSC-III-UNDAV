export interface SurveyResponse {
  id?: string;
  intervieweeName?: string;
  bornInArgentina: string; // "Sí" | "No"
  bornInArgentinaExtra?: string;
  countryOfOrigin?: string; // If 'No'
  familyMigrated: string;
  familyMigratedExtra?: string;
  difficultiesLivingAbroad: string;
  difficultiesLivingAbroadExtra?: string;
  equalOpportunities: string;
  equalOpportunitiesExtra?: string;
  stateMeasures: string;
  stateMeasuresExtra?: string;
  immigrantTaboo: string;
  immigrantTabooExtra?: string;
  needVisibility: string;
  needVisibilityExtra?: string;
  plansToMigrate: string;
  plansToMigrateExtra?: string;
  interviewerName?: string;
  createdAt?: any;
}

export const YES_NO = [
  'Sí',
  'No'
];

export const YES_NO_UNSURE = [
  'Sí',
  'No',
  'No estoy seguro/a'
];
