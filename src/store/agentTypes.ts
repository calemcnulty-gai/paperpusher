export type AgentActionType = 'CREATE_TASK' | 'UPDATE_TASK' | 'UPDATE_PRODUCT' | 'NORMAL_RESPONSE';

export interface AgentAction {
  type: AgentActionType;
  payload: CreateTaskPayload | UpdateTaskPayload | UpdateProductPayload | null;
  metadata: {
    userId: string;
    timestamp: string;
    status: 'success' | 'error';
  };
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  assignee_id?: string;
  product_id?: string;
}

export interface UpdateTaskPayload {
  id: string;
  status: 'open' | 'in_progress' | 'done';
  updated_at?: string;
}

export interface UpdateProductPayload {
  id: string;
  updates: {
    name?: string;
    description?: string;
    price?: number;
    brand?: string;
    category?: string;
    [key: string]: any;
  };
}

export interface AgentResponse {
  message: string;
  action?: {
    type: AgentActionType;
    status: 'success' | 'error';
    data?: any;
    links?: {
      task?: string;
      product?: string;
    };
  };
}

export interface AgentState {
  lastAction: AgentAction | null;
  isProcessing: boolean;
  error: string | null;
} 