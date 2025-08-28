export interface RewardProgram {
  id: number;
  name: string;
  description: string;
  businessTypeId: number;
  isActive: boolean;
  pointsRequired: number;
  rewardType: RewardType;
  rewardValue: number;
  maxRedemptions?: number;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientReward {
  id: number;
  clientId: number;
  programId: number;
  points: number;
  earnedAt: string;
  redeemedAt?: string;
  isActive: boolean;
  expiresAt?: string;
  program: RewardProgram;
}

export interface RewardMetrics {
  totalPrograms: number;
  activePrograms: number;
  totalRewards: number;
  redeemedRewards: number;
  totalPoints: number;
  averagePointsPerClient: number;
  topPrograms: TopRewardProgram[];
  recentActivity: RewardActivity[];
}

export interface TopRewardProgram {
  id: number;
  name: string;
  totalRedemptions: number;
  totalPoints: number;
}

export interface RewardActivity {
  id: number;
  type: 'earned' | 'redeemed';
  clientName: string;
  programName: string;
  points: number;
  date: string;
}

export enum RewardType {
  DISCOUNT_PERCENTAGE = 'discount_percentage',
  DISCOUNT_FIXED = 'discount_fixed',
  FREE_SERVICE = 'free_service',
  GIFT_CARD = 'gift_card',
  CASHBACK = 'cashback'
}

export interface CreateRewardProgramDto {
  name: string;
  description: string;
  businessTypeId: number;
  pointsRequired: number;
  rewardType: RewardType;
  rewardValue: number;
  maxRedemptions?: number;
  startDate: string;
  endDate?: string;
}

export interface UpdateRewardProgramDto extends Partial<CreateRewardProgramDto> {
  isActive?: boolean;
}

export interface RewardTrigger {
  id: number;
  eventType: 'appointment_completed' | 'consultation_completed' | 'service_completed' | 'purchase_completed';
  businessTypeId: number;
  pointsAwarded: number;
  isActive: boolean;
  conditions?: RewardCondition[];
}

export interface RewardCondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'between';
  value: any;
}