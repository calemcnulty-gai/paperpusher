// User Profile Types
export interface UserProfile {
  id: string;
  role: 'principal' | 'user';
  email: string;
  email_confirmed_at?: string;
  created_at?: string;
  updated_at?: string;
  app_metadata?: Record<string, any>;
  user_metadata?: Record<string, any>;
  aud?: string;
  phone?: string;
  confirmed_at?: string;
  last_sign_in_at?: string;
  identities?: UserIdentity[];
  is_anonymous?: boolean;
}

export interface UserIdentity {
  identity_id: string;
  id: string;
  user_id: string;
  identity_data: Record<string, any>;
  provider: string;
  last_sign_in_at: string;
  created_at: string;
  updated_at: string;
  email?: string;
}

// Task Types
export interface CreateTaskPayload {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  assignee_id: string;
}

export interface UpdateTaskPayload {
  id: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface UpdateProductPayload {
  id: string;
  updates: Record<string, any>;
}

// Action Types
export interface ActionMetadata {
  userId: string;
  timestamp: string;
  status: 'success' | 'error';
}

export type ActionType = 'CREATE_TASK' | 'UPDATE_TASK' | 'UPDATE_PRODUCT' | 'NORMAL_RESPONSE';

export interface Action {
  type: ActionType;
  payload: CreateTaskPayload | UpdateTaskPayload | UpdateProductPayload | { message?: string };
  metadata: ActionMetadata;
}

// Request/Response Types
export interface AgentRequest {
  action: Action;
  userProfile: UserProfile;
}

export interface AgentResponse {
  message: string;
  action: {
    type: ActionType;
    status: 'success' | 'error';
    data: any;
    links?: Record<string, string>;
  };
}

// Chat Types
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatRequest {
  messages: Message[];
}

export interface ChatResponse {
  message: string;
  action?: Action;
}

// Vector Store Types
export interface ProductContext {
  name: string;
  sku: string;
  price?: number;
  category?: string;
  description?: string;
}

// Classification Types
export interface MessageClassification {
  requires_action: boolean;
  reasoning: string;
  confidence: number;
}

// Environment Configuration
export interface EnvConfig {
  OPENAI_API_KEY: string;
  PINECONE_API_KEY: string;
  PINECONE_INDEX: string;
  PINECONE_INDEX_TWO: string;
  LANGSMITH_ENDPOINT: string;
  LANGSMITH_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
} 