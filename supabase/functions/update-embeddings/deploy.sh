#!/bin/bash

# Deploy the Edge Function
supabase functions deploy update-embeddings --project-ref gukvkyekmmdlmliomxtj

# Set environment variables
supabase secrets set \
  OPENAI_API_KEY="${OPENAI_API_KEY}" \
  PINECONE_API_KEY="${PINECONE_API_KEY}" \
  PINECONE_INDEX="${PINECONE_INDEX}" \
  SUPABASE_PROJECT_URL="${SUPABASE_PROJECT_URL}" \
  SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}" \
  --project-ref gukvkyekmmdlmliomxtj 