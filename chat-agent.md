# Chat Agent Implementation Plan

## Project Context

### Tech Stack
- Frontend: React + Redux + Tailwind + Radix UI
- Backend: Supabase Edge Functions (Deno)
- Database: Postgres (Supabase)
- Vector Store: Pinecone
- LLM: GPT-4 Turbo via LangChain
- Observability: LangSmith

### Current Implementation
- RAG-based chat system using Pinecone for product search
- LangChain with streaming capability (backend only)
- LangSmith integration for observability
- Redux-based state management

### Database Schema

#### Profiles Table
```sql
profiles (
  id uuid PRIMARY KEY,
  full_name text,
  role text,  -- 'principal' for admin access
  email text,
  created_at timestamptz,
  updated_at timestamptz
)
```

#### Tasks Table
```sql
tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'medium',
  assignee_id uuid REFERENCES profiles(id),
  creator_id uuid NOT NULL REFERENCES profiles(id),
  product_id uuid REFERENCES products(id),
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  collaborator_id uuid REFERENCES profiles(id)
)
```

### Project Layout
```
paperpusher/
├── src/
│   ├── components/
│   │   └── chat/
│   │       ├── ChatBar.tsx
│   │       └── ChatMessage.tsx
│   └── store/
│       ├── index.ts
│       └── chatSlice.ts
└── supabase/
    └── functions/
        └── chat/
            ├── index.ts
            └── types.ts
```

## Implementation Requirements

### Agent Capabilities
1. Create tasks
   - Auto-assign to requesting user unless specified
   - Set default status="open" and priority="medium"
2. Mark tasks as done
3. Update product information
4. Maintain existing RAG functionality
5. Restrict write operations to principal users
6. Log actions in LangSmith

### Data Structures

#### Agent Action Types
```typescript
interface AgentAction {
  type: 'CREATE_TASK' | 'UPDATE_TASK' | 'UPDATE_PRODUCT' | 'NORMAL_RESPONSE';
  payload: any;
  metadata: {
    userId: string;
    timestamp: string;
    status: 'success' | 'error';
  };
}
```

#### Agent Response Format
```typescript
interface AgentResponse {
  message: string;
  action?: {
    type: string;
    status: 'success' | 'error';
    data?: any;
    links?: {
      task?: string;
      product?: string;
    };
  };
}
```

## Implementation Checklist

### 1. Redux Setup [✓]
- [✓] Create new agentSlice.ts
- [✓] Add agent types file
- [✓] Connect to root reducer
- [✓] Add async thunks for agent actions

### 2. Edge Function Modifications [✓]
- [✓] Add agent prompt templates
- [✓] Create AgentOutputParser
- [✓] Modify chain to include agent capabilities
- [✓] Add principal user check
- [✓] Implement task operations
- [✓] Implement product operations
- [✓] Add LangSmith traces for agent actions

### 3. Frontend Updates [✓]
- [✓] Add agent action handling to ChatBar
- [✓] Create success/error notifications for agent actions
- [✓] Add loading states for agent operations
- [✓] Update chat message display for agent responses

### 4. Testing [ ]
- [ ] Test task creation
- [ ] Test task completion
- [ ] Test product updates
- [ ] Test permission checks
- [ ] Test error handling
- [ ] Verify LangSmith traces

### 5. Documentation [ ]
- [ ] Update API documentation
- [ ] Document agent capabilities
- [ ] Add example agent interactions
- [ ] Document error scenarios and handling

## Progress Log

[2024-01-31] - Initial document creation
[2024-01-31] - Completed Redux setup:
  - Created agentTypes.ts with type definitions for actions and state
  - Created agentSlice.ts with reducers and thunks for agent actions
  - Connected agent slice to root reducer
[2024-01-31] - Added Edge Function components:
  - Created prompts.ts with system template and action formats
  - Created AgentOutputParser.ts for handling LLM responses
[2024-01-31] - Created separate agent Edge Function:
  - Set up secure internal-only configuration
  - Implemented task and product operations
  - Added principal user verification
  - Integrated LangSmith tracing
  - Added error handling and response formatting
[2024-01-31] - Updated chat Edge Function:
  - Integrated agent prompt and parser
  - Added user profile context
  - Added agent function calling
  - Updated response handling for actions
[2024-01-31] - Completed frontend updates:
  - Created ActionMessage component for displaying action results
  - Updated ChatMessage to handle loading states and actions
  - Added toast notifications using Radix UI
  - Updated ChatBar with action handling and notifications
[2024-01-31] - Deployed Edge Functions:
  - Deployed chat function (6.1MB)
  - Deployed agent function (1.1MB)
  - Both functions available at gukvkyekmmdlmliomxtj.functions.supabase.co 