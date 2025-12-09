// server.js - Complete Facebook Messenger Bot with RAG using Groq (FREE & FAST)

require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// ============ COSINE SIMILARITY FUNCTION ============
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ============ CONFIGURATION FROM .ENV ============
const CONFIG = {
  PAGE_ACCESS_TOKEN: process.env.PAGE_ACCESS_TOKEN,
  VERIFY_TOKEN: process.env.VERIFY_TOKEN,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  PORT: process.env.PORT || 5000
};

// Validate environment variables
const requiredEnvVars = ['PAGE_ACCESS_TOKEN', 'VERIFY_TOKEN', 'GROQ_API_KEY'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('Please check your .env file');
  process.exit(1);
}

// ============ DUMMY BUSINESS DATABASE ============
const BUSINESS_DATA = [
  {
    id: 1,
    content: "We specialize in selling premium NFC cards that allow you to share your digital information instantly with just a tap. We offer over 800+ unique designs to match your style and personality.",
    category: "about"
  },
  {
    id: 2,
    content: "We are currently not taking orders at the moment, but we will be back soon, In Sha Allah! Please check back later or leave us a message and we'll notify you when we resume operations.",
    category: "status"
  },
  {
    id: 3,
    content: "Our standard NFC cards are priced at 500 Taka. Custom orders are available and pricing may vary based on your specific customization requirements.",
    category: "pricing"
  },
  {
    id: 4,
    content: "We offer fast delivery within 2-3 days of order confirmation. Once we resume operations, we'll ensure your NFC cards reach you quickly.",
    category: "delivery"
  },
  {
    id: 5,
    content: "We specialize in custom NFC card orders! You can customize the design, and we can even input your personal portfolio, contact information, social media links, or business details directly into the card.",
    category: "customization"
  },
  {
    id: 6,
    content: "We have an extensive collection of over 800+ designs to choose from! Whether you want something professional, creative, minimalist, or bold, we have a design that matches your personality.",
    category: "designs"
  },
  {
    id: 7,
    content: "Our NFC cards can store your personal portfolio, business card information, social media profiles, website links, contact details, and more. Just tap your card on any smartphone to instantly share your information!",
    category: "features"
  },
  {
    id: 8,
    content: "Custom orders may have different pricing depending on the level of customization - such as special designs, premium materials, or complex information programming. Contact us for a personalized quote!",
    category: "custom-pricing"
  },
  {
    id: 9,
    content: "NFC cards are the modern way to network! Instead of traditional paper business cards, simply tap your NFC card on someone's phone and all your information transfers instantly. It's eco-friendly, professional, and unforgettable.",
    category: "benefits"
  },
  {
    id: 10,
    content: "Although we're temporarily not accepting orders, feel free to browse our designs and plan your custom NFC card. We'll be back soon, In Sha Allah, and we can't wait to serve you!",
    category: "status"
  },
  {
    id: 11,
    content: "You can reach us for inquiries even while we're not operating. Leave us a message and we'll get back to you as soon as we resume operations, In Sha Allah.",
    category: "contact"
  },
  {
    id: 12,
    content: "Our NFC cards work with all modern smartphones - both Android and iPhone. No app installation required! Just tap and share your information instantly.",
    category: "compatibility"
  }
];

// ============ SIMPLE EMBEDDING FUNCTION ============
// Simple word-based embedding for demonstration
function createSimpleEmbedding(text) {
  const words = text.toLowerCase().split(/\s+/);
  const wordFreq = {};
  
  // Common words to create a basic vocabulary
  const vocabulary = [
    'nfc', 'card', 'price', 'cost', 'taka', 'delivery', 'custom', 'design',
    'order', 'buy', 'purchase', 'portfolio', 'contact', 'business', 'tap',
    'phone', 'smartphone', 'information', 'share', 'digital', 'modern',
    'customization', 'designs', 'available', 'sha', 'allah', 'soon', 'return'
  ];
  
  // Create embedding vector
  const embedding = vocabulary.map(word => {
    return words.filter(w => w.includes(word) || word.includes(w)).length;
  });
  
  return embedding;
}

// ============ RAG: RETRIEVE RELEVANT DOCUMENTS ============
function retrieveRelevantDocs(query, topK = 3) {
  const queryEmbedding = createSimpleEmbedding(query);
  
  // Calculate similarity scores
  const scores = BUSINESS_DATA.map(doc => {
    const docEmbedding = createSimpleEmbedding(doc.content);
    const similarity = cosineSimilarity(queryEmbedding, docEmbedding) || 0;
    
    return {
      ...doc,
      score: similarity
    };
  });
  
  // Sort by score and return top K
  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

// ============ GENERATE RESPONSE WITH GROQ ============
async function generateResponse(userMessage) {
  try {
    // Step 1: Retrieve relevant context
    const relevantDocs = retrieveRelevantDocs(userMessage, 3);
    const context = relevantDocs
      .map(doc => doc.content)
      .join('\n\n');
    
    console.log('📚 Retrieved context:', context.substring(0, 100) + '...');
    
    // Step 2: Create prompt for the LLM
    const systemPrompt = `You are a helpful customer service assistant for an NFC Card business.

Context from our business knowledge base:
${context}

Instructions:
- Answer based on the context provided above
- Be friendly, helpful, and use "In Sha Allah" naturally when talking about future operations
- If asked about ordering, politely mention we're temporarily closed but will return soon, In Sha Allah
- Keep responses concise (2-3 sentences)
- Show enthusiasm about our 800+ designs and customization options
- Emphasize the modern, convenient nature of NFC cards`;

    // Step 3: Call Groq API (using Llama 3.3 70B - FAST & FREE)
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        temperature: 0.7,
        max_tokens: 300,
        top_p: 1
      },
      {
        headers: {
          'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Extract response
    const finalResponse = response.data.choices[0].message.content.trim();
    
    return finalResponse || "I'd be happy to help! Could you please rephrase your question?";
    
  } catch (error) {
    console.error('❌ Error generating response:', error.response?.data || error.message);
    
    // Handle rate limits
    if (error.response?.status === 429) {
      return "I'm experiencing high traffic right now. Please try again in a moment! 🤖";
    }
    
    return "I'm having trouble processing your request right now. Please leave us a message and we'll get back to you soon, In Sha Allah!";
  }
}

// ============ FACEBOOK MESSENGER FUNCTIONS ============
function sendMessage(recipientId, messageText) {
  const url = `https://graph.facebook.com/v18.0/me/messages?access_token=${CONFIG.PAGE_ACCESS_TOKEN}`;
  
  return axios.post(url, {
    recipient: { id: recipientId },
    message: { text: messageText }
  });
}

function sendTypingIndicator(recipientId, isTyping = true) {
  const url = `https://graph.facebook.com/v18.0/me/messages?access_token=${CONFIG.PAGE_ACCESS_TOKEN}`;
  
  return axios.post(url, {
    recipient: { id: recipientId },
    sender_action: isTyping ? 'typing_on' : 'typing_off'
  });
}

// ============ WEBHOOK ENDPOINTS ============

// Webhook verification
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  if (mode === 'subscribe' && token === CONFIG.VERIFY_TOKEN) {
    console.log('✅ Webhook verified successfully!');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Webhook verification failed');
    res.sendStatus(403);
  }
});

// Webhook to receive messages
app.post('/webhook', async (req, res) => {
  const data = req.body;
  
  // Quickly respond to Facebook
  res.status(200).send('EVENT_RECEIVED');
  
  if (data.object === 'page') {
    for (const entry of data.entry) {
      for (const event of entry.messaging) {
        const senderId = event.sender.id;
        
        if (event.message && event.message.text) {
          const messageText = event.message.text;
          console.log(`📨 Received message from ${senderId}: ${messageText}`);
          
          try {
            // Show typing indicator
            await sendTypingIndicator(senderId, true);
            
            // Generate AI response using RAG
            const response = await generateResponse(messageText);
            
            // Turn off typing indicator
            await sendTypingIndicator(senderId, false);
            
            // Send response
            await sendMessage(senderId, response);
            console.log(`✅ Sent response: ${response}`);
            
          } catch (error) {
            console.error('❌ Error handling message:', error);
            await sendMessage(
              senderId, 
              "Sorry, I encountered an error. Please leave us a message and we'll get back to you soon, In Sha Allah!"
            );
          }
        }
      }
    }
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.send('✅ Facebook Messenger Bot with RAG is running! 🤖');
});

// Test RAG endpoint (for debugging)
app.get('/test-rag', async (req, res) => {
  const testQuery = req.query.q || "What are your business hours?";
  
  try {
    const relevantDocs = retrieveRelevantDocs(testQuery, 3);
    const response = await generateResponse(testQuery);
    
    res.json({
      query: testQuery,
      relevantDocs: relevantDocs,
      aiResponse: response
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ START SERVER ============
app.listen(CONFIG.PORT, () => {
  console.log('='.repeat(50));
  console.log('🚀 Server running on port', CONFIG.PORT);
  console.log('📝 Webhook URL: http://localhost:' + CONFIG.PORT + '/webhook');
  console.log('✅ Business knowledge base loaded:', BUSINESS_DATA.length, 'documents');
  console.log('🔑 Environment variables loaded successfully');
  console.log('🤖 Using Groq API with Llama 3.3 70B (FREE & FAST)');
  console.log('='.repeat(50));
});