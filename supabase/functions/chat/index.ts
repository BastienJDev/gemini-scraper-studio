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

    // Build system prompt with scraped content
    let systemPrompt = `Tu es un assistant IA expert en recherche d'informations. Tu réponds en français de manière claire, structurée et précise.`;
    
    // Add scraped content if available
    if (scrapedSites && scrapedSites.length > 0) {
      systemPrompt += `\n\n## CONTENU ANALYSÉ DES SITES WEB\n`;
      systemPrompt += `Tu as accès au contenu de ${scrapedSites.length} sites web que tu DOIS utiliser pour répondre.\n\n`;
      
      for (const site of scrapedSites as ScrapedSite[]) {
        systemPrompt += `---\n`;
        systemPrompt += `### ${site.siteName || site.title}\n`;
        systemPrompt += `**URL:** ${site.url}\n`;
        systemPrompt += `**Contenu:**\n${site.content?.substring(0, 8000) || 'Contenu non disponible'}\n\n`;
      }
      
      systemPrompt += `---\n\n`;
      systemPrompt += `## RÈGLES STRICTES\n`;
      systemPrompt += `1. Tu DOIS baser tes réponses UNIQUEMENT sur le contenu des sites ci-dessus\n`;
      systemPrompt += `2. Tu ne dois JAMAIS inventer d'informations\n`;
      systemPrompt += `3. Si une information n'est pas dans le contenu fourni, dis-le clairement\n\n`;
      
      systemPrompt += `## FORMAT DE RÉPONSE OBLIGATOIRE\n`;
      systemPrompt += `À la fin de CHAQUE réponse, tu DOIS inclure une section "📚 Sources" avec les liens EXACTS des sites où tu as trouvé les informations.\n\n`;
      systemPrompt += `Format obligatoire:\n\n`;
      systemPrompt += `📚 **Sources consultées:**\n`;
      
      for (const site of scrapedSites as ScrapedSite[]) {
        systemPrompt += `- [${site.siteName || site.title}](${site.url})\n`;
      }
      
      systemPrompt += `\nPour chaque information que tu donnes, indique de quel site elle provient en utilisant les liens ci-dessus.`;
    } else if (categories && categories.length > 0) {
      systemPrompt += `\n\nNote: Aucun site n'a pu être analysé pour les catégories ${categories.join(', ')}. Réponds en te basant sur tes connaissances générales mais précise que tu n'as pas pu accéder aux sites sources.`;
    }

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
