
export type FunnelBlockType = 
  | 'vsl' 
  | 'question' 
  | 'input_numeric' 
  | 'image_select' 
  | 'analysis' 
  | 'approval' 
  | 'projection' 
  | 'social_proof' 
  | 'surprise' 
  | 'roulette' 
  | 'offer';

export interface Alternative {
  id: string;
  text: string;
  feedback: string;
}

export interface FunnelBlock {
  id: number;
  type: FunnelBlockType;
  title?: string;
  subtitle?: string;
  description?: string;
  alternatives?: Alternative[];
  inputType?: 'kg' | 'cm';
  images?: string[];
  nextId?: number;
}

export interface UserAnswers {
  [key: number]: any;
}
