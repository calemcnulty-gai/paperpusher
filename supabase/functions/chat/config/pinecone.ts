import { Pinecone } from 'npm:@pinecone-database/pinecone'
import { PineconeStore } from 'npm:@langchain/pinecone'
import { embeddings, envConfig } from './langchain.ts'

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: envConfig.PINECONE_API_KEY,
})

// Initialize both vector stores
const productIndex = pinecone.Index(envConfig.PINECONE_INDEX)
export const productVectorStore = await PineconeStore.fromExistingIndex(
  embeddings,
  {
    pineconeIndex: productIndex,
    textKey: 'text',
    metadataKeys: ['name', 'sku', 'description', 'price', 'category']
  }
)

const productIndex2 = pinecone.Index(envConfig.PINECONE_INDEX_TWO)
export const productVectorStore2 = await PineconeStore.fromExistingIndex(
  embeddings,
  {
    pineconeIndex: productIndex2,
    textKey: 'text',
    metadataKeys: ['name', 'sku', 'description', 'price', 'category']
  }
)

// Create retrievers
export const retriever1 = productVectorStore.asRetriever({ k: 3 })
export const retriever2 = productVectorStore2.asRetriever({ k: 3 }) 