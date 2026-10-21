/**
 * Universal Web Search & General AI Knowledge Engine
 * Cleanly extracts search intent, strips conversational noise,
 * and fetches relevant encyclopedic data without returning irrelevant albums or pop culture.
 */

export const searchService = {
  // Extract core encyclopedic topic from conversational queries
  sanitizeSearchQuery(rawQuery) {
    if (!rawQuery) return '';
    let q = rawQuery.toLowerCase().trim();

    // Specific health & medical keyword mapping
    if (q.includes('fever') || q.includes('बुखार') || q.includes('102') || q.includes('101') || q.includes('103') || q.includes('pyrexia')) {
      return 'Fever';
    }
    if (q.includes('snake') || q.includes('सांप') || q.includes('asv')) {
      return 'Snakebite';
    }
    if (q.includes('headache') || q.includes('migraine') || q.includes('सिरदर्द')) {
      return 'Headache';
    }
    if (q.includes('chest pain') || q.includes('heart attack') || q.includes('सीने में दर्द')) {
      return 'Myocardial infarction';
    }
    if (q.includes('dengue') || q.includes('डेंगू')) {
      return 'Dengue fever';
    }
    if (q.includes('malaria') || q.includes('मलेरिया')) {
      return 'Malaria';
    }
    if (q.includes('cold') || q.includes('cough') || q.includes('खांसी') || q.includes('जुकाम')) {
      return 'Common cold';
    }
    if (q.includes('quantum')) {
      return 'Quantum computing';
    }
    if (q.includes('quicksort') || (q.includes('sort') && q.includes('array'))) {
      return 'Quicksort';
    }
    if (q.includes('pm') || q.includes('prime minister') && q.includes('india')) {
      return 'Prime Minister of India';
    }

    // Strip conversational fillers
    q = q.replace(/^(i got|i have|my|what should i do|what i will do now|what can i do|what to do|what is|how to|can you|please tell me|tell me about|explain|who is|where is)\s+/gi, '');
    q = q.replace(/\s+(what should i do|what i will do now|what to do|now|please|help|today)\b/gi, '');
    q = q.replace(/[\?\.!,]/g, ' ').trim();
    q = q.replace(/\s+/g, ' ');

    return q.length > 2 ? q : rawQuery.trim();
  },

  // Live Web Search via Wikipedia CORS-enabled Open API
  async searchWeb(rawQuery) {
    if (!rawQuery || !rawQuery.trim()) return null;
    const cleanSearchTopic = this.sanitizeSearchQuery(rawQuery);

    try {
      // 1. Search for matching articles
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanSearchTopic)}&utf8=&format=json&origin=*`;
      const searchRes = await fetch(searchUrl);
      if (!searchRes.ok) return null;

      const searchData = await searchRes.json();
      const items = searchData.query?.search || [];
      if (items.length === 0) return null;

      // Filter out irrelevant pop culture false positives (albums, songs, films) if query is educational/medical
      const isHealthOrScience = /fever|temperature|pain|health|cold|drug|doctor|medicine|science|algorithm|math/i.test(rawQuery);
      
      const filteredHits = items.filter(item => {
        if (!isHealthOrScience) return true;
        const t = item.title.toLowerCase();
        const s = item.snippet.toLowerCase();
        // Reject music albums, singles, video games when query is medical
        if (t.includes('(album)') || t.includes('(song)') || t.includes('(band)') || t.includes('(film)')) {
          return false;
        }
        if (s.includes('studio album') || s.includes('rock band') || s.includes('video game') || s.includes('single by')) {
          return false;
        }
        return true;
      });

      const candidateHits = filteredHits.length > 0 ? filteredHits : items;

      const cleanSnippet = (html) => {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
      };

      const topHits = candidateHits.slice(0, 4).map(item => ({
        title: item.title,
        snippet: cleanSnippet(item.snippet),
        pageId: item.pageid,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/\s+/g, '_'))}`
      }));

      // 2. Fetch rich summary & thumbnail for the most relevant page
      let topSummary = null;
      try {
        const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topHits[0].title.replace(/\s+/g, '_'))}`;
        const sumRes = await fetch(summaryUrl);
        if (sumRes.ok) {
          const sumData = await sumRes.json();
          // Verify summary isn't an album if query is health-related
          const desc = (sumData.description || '').toLowerCase();
          if (isHealthOrScience && (desc.includes('album') || desc.includes('film') || desc.includes('band') || desc.includes('song'))) {
            // Discard irrelevant pop culture
            topSummary = null;
          } else {
            topSummary = {
              title: sumData.title,
              description: sumData.description,
              extract: sumData.extract,
              thumbnail: sumData.thumbnail?.source || null,
              pageUrl: sumData.content_urls?.desktop?.page || topHits[0].url
            };
          }
        }
      } catch (err) {
        console.warn('Summary fetch error:', err);
      }

      return {
        query: cleanSearchTopic,
        topSummary,
        webHits: topHits,
        totalFound: searchData.query?.searchinfo?.totalhits || items.length
      };
    } catch (err) {
      console.warn('Live web search failed:', err.message);
      return null;
    }
  },

  // Direct Browser-to-Gemini Query with Multi-Turn Memory
  async queryGeminiLive(apiKey, prompt, vitals = null, history = []) {
    if (!apiKey) return null;
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;
      const systemContext = `You are an advanced, helpful, and articulate AI assistant.
You can converse naturally and answer ANY question: coding, science, writing, analysis, math, history, as well as emergency medical guidance and fever care.
- If asked about high fever (102°F), provide immediate practical steps, tepid sponging, exact Paracetamol dosage, hydration, and red flags.
- Maintain full conversational context.
- Format cleanly with markdown, bullet points, and code blocks.`;

      const historyContents = (history || []).slice(-8).map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            ...historyContents,
            {
              role: 'user',
              parts: [{ text: `${systemContext}\n\nUser Question: ${prompt}` }]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1800
          }
        })
      });

      if (!res.ok) return null;
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) return null;

      return {
        answer: text,
        source: 'Google Gemini 1.5 Flash'
      };
    } catch (err) {
      console.warn('Gemini query error:', err);
      return null;
    }
  },

  // Direct Browser-to-OpenAI GPT Query with Multi-Turn Memory
  async queryOpenAILive(apiKey, prompt, vitals = null, history = []) {
    if (!apiKey) return null;
    try {
      const url = 'https://api.openai.com/v1/chat/completions';
      const systemContext = `You are an advanced, helpful, and articulate AI assistant powered by OpenAI GPT.
You can converse naturally and answer ANY question the user asks: coding, software engineering, science, creative writing, analysis, math, history, everyday questions, as well as medical guidance and first aid.
- When asked medical or health questions (such as high fever 102°F or trauma), give immediate, clear, practical advice, exact Paracetamol / antipyretic dosages, hydration, and emergency red flag symptoms.
- Maintain full conversational context across multi-turn questions.
- Format responses beautifully with clean markdown, bold titles, bullet points, and syntax-highlighted code blocks.`;

      const formattedHistory = (history || []).slice(-8).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemContext },
            ...formattedHistory,
            { role: 'user', content: prompt }
          ],
          temperature: 0.4,
          max_tokens: 1800
        })
      });

      if (!res.ok) return null;
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text) return null;

      return {
        answer: text,
        source: 'ChatGPT (OpenAI GPT-4o-mini)'
      };
    } catch (err) {
      console.warn('OpenAI query error:', err);
      return null;
    }
  },

  // Unified Universal LLM Dispatcher (Gemini or GPT) with Memory
  async queryUniversalLLM(apiKey, prompt, vitals = null, preferredProvider = 'auto', history = []) {
    if (!apiKey) return null;
    const cleanKey = apiKey.trim();

    if (preferredProvider === 'openai' || cleanKey.startsWith('sk-')) {
      return await this.queryOpenAILive(cleanKey, prompt, vitals, history);
    } else {
      return await this.queryGeminiLive(cleanKey, prompt, vitals, history);
    }
  }
};
