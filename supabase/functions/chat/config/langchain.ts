import { ChatOpenAI } from 'npm:@langchain/openai'
import { OpenAIEmbeddings } from 'npm:@langchain/openai'
import { Client } from 'npm:langsmith'
import { EnvConfig } from '../../shared/types.ts'

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

function getEnvConfig(): EnvConfig {
  const config = {
    OPENAI_API_KEY: Deno.env.get('OPENAI_API_KEY'),
    PINECONE_API_KEY: Deno.env.get('PINECONE_API_KEY'),
    PINECONE_INDEX: Deno.env.get('PINECONE_INDEX'),
    PINECONE_INDEX_TWO: Deno.env.get('PINECONE_INDEX_TWO'),
    LANGSMITH_ENDPOINT: Deno.env.get('LANGSMITH_ENDPOINT'),
    LANGSMITH_API_KEY: Deno.env.get('LANGSMITH_API_KEY'),
    SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
    SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  } as EnvConfig

  // Validate all required env vars are present
  Object.entries(config).forEach(([key, value]) => {
    if (!value) throw new Error(`Missing required environment variable: ${key}`)
  })

  return config
}

export const envConfig = getEnvConfig()

// Initialize chat model
export const chatModel = new ChatOpenAI({
  modelName: 'gpt-4-turbo-preview',
  temperature: 0.7,
  streaming: true,
  openAIApiKey: envConfig.OPENAI_API_KEY,
  configuration: {
    baseOptions: {
      adapter: 'fetch'
    }
  }
})

// Initialize embeddings
export const embeddings = new OpenAIEmbeddings({
  openAIApiKey: envConfig.OPENAI_API_KEY,
  modelName: 'text-embedding-3-large',
  dimensions: 3072,
  batchSize: 512,
  stripNewLines: true
})

// Initialize LangSmith client
export const langsmith = new Client({
  apiUrl: envConfig.LANGSMITH_ENDPOINT,
  apiKey: envConfig.LANGSMITH_API_KEY,
}) 