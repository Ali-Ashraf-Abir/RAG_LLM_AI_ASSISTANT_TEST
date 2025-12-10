Facebook NFC Page Chatbot

This is a Node.js chatbot built for my Facebook NFC page. It uses the Grok/DeepSeek R1 model for LLM responses and includes a retrieval-augmented generation setup with vector search. The chatbot interacts with users through the Messenger API and answers NFC-related questions as well as questions about the page itself.

How it works

The user sends a message to the page on Messenger.

The Node.js server receives the message through the Facebook webhook.

The incoming text is embedded using the embedding model.

Vector search is performed over stored embeddings (from the local knowledge base).

The most relevant context is retrieved and attached to the LLM prompt.

The Grok/DeepSeek R1 model generates a response using both the user query and retrieved context.

The answer is sent back through the Messenger Send API.

Features

Uses the Grok/DeepSeek R1 model for natural language responses

Retrieval-Augmented Generation with vector search

Node.js backend with Express

Embeddings stored locally for now (can later be moved to a DB or vector DB)

Custom knowledge base for NFC information and page details

Works directly as a Facebook page Messenger bot

Vector search design

The project includes:

a small embedding generator (either via DeepSeek or another embedding model)

a local store of embeddings generated from the JSON data

cosine similarity (or similar metric) to find matching chunks

retrieval of the top chunks as context for the LLM

The embedding storage method is currently local (JSON files) but can be replaced with any vector database such as Pinecone, Chroma, Weaviate, or Qdrant without major code changes.

Requirements

Node.js (version 18 or newer recommended)

Facebook Page + Facebook App with Messenger access

Grok/DeepSeek R1 API key

An embedding model (DeepSeek embeddings recommended)

Basic understanding of webhooks and Facebook developer panel

Setup
npm install


Add a .env file:

PAGE_ACCESS_TOKEN=
VERIFY_TOKEN=
DEEPSEEK_API_KEY=
EMBEDDING_API_KEY=


Place your JSON knowledge content in /data and generate embeddings once before running. If you change the JSON, update embeddings.

Running the project
npm start


or with nodemon:

npm run dev

Notes

This is a lightweight RAG implementation. The similarity search only returns the top few results and attaches them to the prompt. In most cases it’s effective for short page-related questions. If needed, the retrieval part can be expanded to include hybrid search, metadata filtering, or multi-round retrieval.

Future improvements

Move embeddings to a real vector database

Add conversation memory

Improve context filtering

Add a UI dashboard for embedding updates
