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
    
    // Log content sizes for debugging
    if (scrapedSites) {
      scrapedSites.forEach((site: ScrapedSite) => {
        console.log(`Site ${site.siteName}: ${site.content?.length || 0} chars`);
      });
    }

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
        temperature: 0.4,
        max_tokens: 8192, // Réponses longues et détaillées
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
  const basePrompt = `# RÔLE
Tu es un assistant de recherche EXHAUSTIF. Tu dois analyser EN PROFONDEUR tout le contenu fourni et donner des réponses COMPLÈTES et DÉTAILLÉES.

# OBJECTIF PRINCIPAL
Extraire et présenter TOUTES les informations pertinentes des sources, pas seulement un résumé superficiel.`;

  if (!scrapedSites || scrapedSites.length === 0) {
    if (categories && categories.length > 0) {
      return `${basePrompt}

# SITUATION
⚠️ Aucun contenu n'a pu être récupéré pour: ${categories.join(', ')}.
Informe l'utilisateur et propose de sélectionner d'autres catégories.`;
    }
    
    return `${basePrompt}

# SITUATION
Aucune catégorie sélectionnée. Guide l'utilisateur vers le menu de gauche.`;
  }

  // Build FULL context from scraped sites with numbered references
  const siteContexts = scrapedSites.map((site, index) => {
    const sourceNum = index + 1;
    return `
═══════════════════════════════════════════════════════════════
[${sourceNum}] ${site.siteName || site.title}
URL: ${site.url}
═══════════════════════════════════════════════════════════════
${site.content || "Contenu non disponible"}
`;
  }).join('\n');

  // Build sources list for citation at the end
  const sourcesList = scrapedSites.map((site, index) => {
    return `[${index + 1}] ${site.siteName || site.title} - ${site.url}`;
  }).join('\n');

  return `${basePrompt}

# SOURCES DISPONIBLES (${scrapedSites.length} sources numérotées de [1] à [${scrapedSites.length}])

${siteContexts}

═══════════════════════════════════════════════════════════════
FIN DES SOURCES
═══════════════════════════════════════════════════════════════

# FORMAT DE RÉPONSE OBLIGATOIRE

Tu DOIS structurer ta réponse EXACTEMENT comme suit:

## 1. CORPS DE LA RÉPONSE
- Réponds de manière COMPLÈTE et DÉTAILLÉE
- Dans le texte, cite les sources avec [1], [2], [3] etc. quand tu mentionnes une information
- Exemple: "Le projet a été lancé en 2024 [1] et a obtenu un financement majeur [2]."

## 2. SECTION SOURCES (OBLIGATOIRE À LA FIN)

Ta réponse DOIT se terminer par cette section exacte:

---

## 📚 Sources citées

${sourcesList}

---

# RÈGLES CRITIQUES

1. CITE les sources avec [1], [2], [3] dans le TEXTE quand tu utilises une info
2. TERMINE TOUJOURS par la section "📚 Sources citées" avec les liens
3. NE PAS inventer - utilise UNIQUEMENT le contenu fourni
4. Sois EXHAUSTIF - parcours CHAQUE source en détail

# RAPPEL FINAL
Tu as ${scrapedSites.length} sources numérotées. Place [1], [2], etc. dans ton texte ET liste les sources à la FIN.`;
}
