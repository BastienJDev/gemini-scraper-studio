import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapedSite {
  url: string;
  title: string;
  content: string;
  siteName: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, scrapedSites, categories } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Chat request received');
    console.log('Categories:', categories);
    console.log('Scraped sites count:', scrapedSites?.length || 0);

    // Build optimized system prompt
    let systemPrompt = buildSystemPrompt(scrapedSites, categories);
    
    console.log('System prompt length:', systemPrompt.length);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        stream: true,
        temperature: 0.3, // Lower = more focused and factual
        max_tokens: 4096, // Allow comprehensive responses
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requêtes atteinte. Réessayez plus tard.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Crédits insuffisants.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Erreur du service AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (error) {
    console.error('Chat error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildSystemPrompt(scrapedSites: ScrapedSite[] | undefined, categories: string[] | undefined): string {
  const basePrompt = `# RÔLE ET IDENTITÉ
Tu es un assistant de recherche expert, spécialisé dans l'analyse et la synthèse d'informations provenant de sources web. Tu travailles exclusivement avec les contenus qui te sont fournis.

# COMPÉTENCES CLÉS
- Analyse approfondie de contenus web
- Synthèse claire et structurée
- Citation précise des sources
- Identification des informations pertinentes
- Réponses en français de qualité professionnelle`;

  if (!scrapedSites || scrapedSites.length === 0) {
    if (categories && categories.length > 0) {
      return `${basePrompt}

# SITUATION ACTUELLE
⚠️ Aucun contenu de site n'a pu être analysé pour les catégories: ${categories.join(', ')}.

# COMPORTEMENT ATTENDU
- Informe l'utilisateur que les sites n'ont pas pu être scrapés
- Propose de reformuler la recherche ou de sélectionner d'autres catégories
- Ne fournis PAS d'informations inventées`;
    }
    
    return `${basePrompt}

# SITUATION ACTUELLE
Aucune catégorie n'est sélectionnée. Guide l'utilisateur pour qu'il sélectionne des catégories dans le menu de gauche afin de cibler sa recherche.`;
  }

  // Build context from scraped sites with smart truncation
  const siteContexts = scrapedSites.map((site, index) => {
    // Smart content extraction - keep most relevant parts
    const content = extractRelevantContent(site.content, 6000);
    return `
## SOURCE ${index + 1}: ${site.siteName || site.title}
- **URL**: ${site.url}
- **Contenu analysé**:
${content}
---`;
  }).join('\n');

  return `${basePrompt}

# BASE DE CONNAISSANCES (${scrapedSites.length} sources analysées)
Les informations ci-dessous constituent ta SEULE source de vérité. Tu ne dois utiliser AUCUNE autre connaissance.

${siteContexts}

# RÈGLES ABSOLUES (À RESPECTER IMPÉRATIVEMENT)

## 1. Fidélité aux sources
- Utilise UNIQUEMENT les informations des sources ci-dessus
- Ne complète JAMAIS avec des connaissances externes
- Si une information n'est pas dans les sources, dis explicitement: "Cette information n'apparaît pas dans les sources analysées"

## 2. Attribution des informations
- Chaque fait mentionné DOIT être attribué à sa source
- Utilise des formulations comme: "Selon [Nom du site]..." ou "D'après le contenu de [URL]..."
- Ne fais JAMAIS de généralisation sans source

## 3. Qualité de la réponse
- Structure ta réponse avec des titres et sous-titres si pertinent
- Sois précis et factuel
- Évite les formulations vagues
- Utilise des listes à puces pour les énumérations

## 4. Format de citation OBLIGATOIRE
À la FIN de CHAQUE réponse, inclus une section sources:

📚 **Sources consultées:**
${scrapedSites.map(site => `- [${site.siteName || site.title}](${site.url})`).join('\n')}

# EXEMPLE DE BONNE RÉPONSE
"D'après le contenu de **[Nom du cabinet]**, les principales actualités concernent [X]. Le site indique que [citation ou paraphrase]. 

Sur **[Autre source]**, on trouve également des informations sur [Y], notamment [détails].

📚 **Sources consultées:**
- [Source 1](url1) - Information trouvée: X
- [Source 2](url2) - Information trouvée: Y"

# MAINTENANT
Analyse la question de l'utilisateur et réponds en utilisant EXCLUSIVEMENT les sources fournies ci-dessus.`;
}

function extractRelevantContent(content: string | undefined, maxLength: number): string {
  if (!content) return "Contenu non disponible";
  
  // Remove excessive whitespace and normalize
  let cleaned = content
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  // If content is short enough, return as is
  if (cleaned.length <= maxLength) return cleaned;
  
  // Smart truncation: try to cut at sentence boundaries
  const truncated = cleaned.substring(0, maxLength);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('. '),
    truncated.lastIndexOf('.\n'),
    truncated.lastIndexOf('! '),
    truncated.lastIndexOf('? ')
  );
  
  if (lastSentenceEnd > maxLength * 0.7) {
    return truncated.substring(0, lastSentenceEnd + 1) + '\n[...]';
  }
  
  return truncated + '...';
}
