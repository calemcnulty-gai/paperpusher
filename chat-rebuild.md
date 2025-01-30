# Chat Migration: Lambda to Supabase Edge Function

## Overview
Moving the chat functionality from AWS Lambda to Supabase Edge Functions while maintaining the core RAG pipeline and streaming capabilities.

## Migration Checklist

### 1. Edge Function Setup ✅
- [x] Create `functions/chat/` directory structure:
  ```
  functions/chat/
  ├── index.ts        # Main handler & chain
  ├── types.ts        # TypeScript interfaces
  └── deno.json      # Deno configuration
  ```
- [ ] Set up environment variables in Supabase dashboard:
  - [ ] OPENAI_API_KEY
  - [ ] PINECONE_API_KEY
  - [ ] PINECONE_INDEX
  - [ ] SUPABASE_URL
  - [ ] SUPABASE_SERVICE_ROLE_KEY

### 2. Core Dependencies ⏳
- [x] Add ESM imports:
  ```typescript
  import { createClient } from '@supabase/supabase-js'
  ```
- [ ] Add remaining dependencies:
  ```typescript
  import OpenAI from 'openai'
  import { Pinecone } from '@pinecone-database/pinecone'
  import { ChatOpenAI, OpenAIEmbeddings } from 'langchain/chat_models'
  ```
- [ ] Configure LangChain with same models:
  - [ ] text-embedding-3-large for embeddings
  - [ ] gpt-4-turbo-preview for chat
  - [ ] Verify model parameters match current setup

### 3. Port RAG Pipeline ⏳
- [x] Set up basic request/response structure
- [ ] Implement core chain functionality:
  - [ ] Base prompt templates
  - [ ] System message with product context
  - [ ] Conversation memory handling
  - [ ] Streaming response setup
- [ ] Set up Pinecone integration:
  - [ ] Initialize client
  - [ ] Implement similarity search
  - [ ] Product context injection

### 4. Chat Interface ⏳
- [x] Define message types and interfaces
- [x] Set up basic error handling
- [ ] Implement streaming response handler
- [ ] Add error handling for common failure modes
- [ ] Test end-to-end with sample conversations

### 5. Testing & Deployment ⏳
- [x] Local testing with Supabase CLI
- [x] Initial deployment successful
- [ ] Verify streaming works correctly
- [ ] Test Pinecone integration
- [ ] Deploy to Supabase
- [ ] Update frontend to use new endpoint

### 6. Frontend Updates ⏳
- [ ] Update chat endpoint in API client
- [ ] Verify streaming still works with UI
- [ ] Test error handling
- [ ] Remove AWS-specific code

### 7. Cleanup ⏳
- [ ] Archive Lambda function
- [ ] Update documentation
- [ ] Remove unused dependencies
- [ ] Clean up environment variables

## Implementation Notes
- Using LangChain.js instead of Python LangChain
- Maintaining same model configurations
- Keeping existing Redux integration
- Preserving streaming functionality
- No changes needed to database schema

## Testing Checklist
- [x] Basic request/response functionality
- [ ] Streaming responses
- [ ] Product context retrieval
- [x] Basic error handling
- [ ] Memory/history handling
- [ ] Load testing