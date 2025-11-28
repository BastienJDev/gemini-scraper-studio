import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sites data embedded for quick access
const SITES_DATA: Record<string, Array<{name: string, url: string}>> = {
  "droit": [
    { name: "Droit du sport", url: "https://www.droitdusport.com/" },
    { name: "Assemblée nationale", url: "https://www.assemblee-nationale.fr/" },
    { name: "Sénat", url: "https://www.senat.fr/" },
  ],
  "federation": [
    { name: "Annuaire des fédérations", url: "https://www.sports.gouv.fr/annuaire-des-federations" },
  ],
  "sport": [
    { name: "Cabinet AVOSPORTS", url: "https://www.asemeria-avocat.fr/" },
    { name: "Cabinet ILLOUZ AVOCATS", url: "https://www.illouz-avocats.com/" },
    { name: "Légi Conseils", url: "https://www.legiconseils.com/" },
    { name: "Cabinet FICHOU", url: "https://www.fichou-avocat.fr/" },
    { name: "Earvin & Lew", url: "https://earvinlew.com/" },
    { name: "NFALAW", url: "https://www.nfalaw.com/" },
    { name: "Cabinet Derby Avocats", url: "https://www.derby-avocats.com/" },
    { name: "Cabinet Ibanez Avocat", url: "https://ibanez-avocat.com/" },
    { name: "Cabinet Barry Avocats", url: "https://www.barryavocat.fr/" },
    { name: "BGSL Avocats", url: "https://www.bgsl-avocats.com/" },
    { name: "De Gaulle Fleurance & Associés", url: "https://www.degaullefleurance.com" },
    { name: "Lobe Law", url: "https://www.lobe-law.com" },
    { name: "LMT Avocats", url: "https://www.lmtavocats.com" },
    { name: "Clifford Chance", url: "https://www.cliffordchance.com" },
    { name: "Joffe & Associés", url: "https://www.joffeassocies.com" },
    { name: "August Debouzy", url: "https://www.august-debouzy.com" },
    { name: "Bahri Avocats", url: "https://bahri-avocats.com" },
    { name: "Bignon Lebray", url: "https://www.bignonlebray.com" },
    { name: "DLA Piper", url: "https://www.dlapiper.com" },
    { name: "Valther", url: "https://valther-avocats.com" },
    { name: "Paul Hastings LLP", url: "https://www.paulhastings.com" },
    { name: "Klein Wenner", url: "https://www.kleinwenner.eu" },
    { name: "DWF France", url: "https://www.dwfgroup.com/fr-fr" },
  ],
  "generaliste": [
    { name: "Jeantet Avocats", url: "https://www.jeantet.fr" },
    { name: "Flichy Grangé Avocats", url: "https://www.flichygrange.fr" },
    { name: "Bredin Prat", url: "https://www.bredinprat.fr" },
    { name: "Darrois Villey Maillot Brochier", url: "https://www.darroisvilley.com" },
    { name: "De Pardieu Brocas Maffei", url: "https://www.de-pardieu.com" },
    { name: "Allen & Overy Paris", url: "https://www.allenovery.com" },
    { name: "Clifford Chance Paris", url: "https://www.cliffordchance.com" },
    { name: "Gide Loyrette Nouel", url: "https://www.gide.com" },
    { name: "Fidal", url: "https://www.fidal.fr/" },
    { name: "August Debouzy", url: "https://www.august-debouzy.com/fr/" },
    { name: "Hoche Avocats", url: "https://www.hoche-avocats.com/" },
    { name: "Bignon Lebray", url: "https://www.bignonlebray.com/" },
    { name: "LPA Law", url: "https://www.lpalaw.com/" },
    { name: "Proskauer Rose LLP", url: "https://www.proskauer.com/" },
    { name: "Baker McKenzie Paris", url: "https://www.bakermckenzie.com" },
  ],
  "presse": [
    { name: "L'Équipe", url: "https://www.lequipe.fr/" },
    { name: "RMC Sport", url: "https://rmcsport.bfmtv.com/" },
    { name: "Eurosport France", url: "https://www.eurosport.fr/" },
    { name: "France Football", url: "https://www.francefootball.fr/" },
    { name: "So Foot", url: "https://www.sofoot.com/" },
    { name: "Midi Olympique", url: "https://www.midi-olympique.fr/" },
    { name: "Sport Stratégies", url: "https://www.sportstrategies.com/" },
    { name: "France TV Sport", url: "https://www.francetvinfo.fr/sports/" },
    { name: "Le Monde Sport", url: "https://www.lemonde.fr/sport/" },
    { name: "Le Figaro Sport", url: "https://sport24.lefigaro.fr/" },
    { name: "Goal France", url: "https://www.goal.com/fr/" },
    { name: "Transfermarkt FR", url: "https://www.transfermarkt.fr/" },
    { name: "SofaScore", url: "https://www.sofascore.com/" },
  ],
  "finance": [
    { name: "Sites financiers sportifs", url: "Various financial sport sites" },
  ],
  "syndicat": [
    { name: "UNFP", url: "https://www.unfp.org/" },
    { name: "UNECATEF", url: "https://www.unecatef.fr/" },
    { name: "SNMS", url: "https://snms.org/" },
  ],
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, scrapedContent, categories } = await req.json();
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
    console.log('Has scraped content:', !!scrapedContent);

    // Build system prompt
    let systemPrompt = `Tu es un assistant IA expert en recherche d'informations sur des sites web spécifiques. Tu réponds en français de manière claire, structurée et précise.`;
    
    // Add category context
    if (categories && categories.length > 0) {
      const categoryNames = categories.map((c: string) => c.toUpperCase()).join(', ');
      systemPrompt += `\n\nL'utilisateur recherche des informations dans les catégories suivantes: ${categoryNames}`;
      
      // Add sites list for each category
      systemPrompt += `\n\nVoici la liste des sites de référence pour ces catégories:`;
      
      for (const category of categories) {
        const sites = SITES_DATA[category.toLowerCase()];
        if (sites && sites.length > 0) {
          systemPrompt += `\n\n**${category.toUpperCase()}:**`;
          for (const site of sites) {
            systemPrompt += `\n- ${site.name}: ${site.url}`;
          }
        }
      }
      
      systemPrompt += `\n\nQuand tu réponds:
1. Base tes réponses UNIQUEMENT sur les sites listés ci-dessus
2. Cite les sources (noms des sites) quand tu donnes des informations
3. Si tu ne connais pas une information précise, dis-le clairement
4. Propose des sites pertinents de la liste pour approfondir la recherche`;
    }
    
    // Add scraped content context if available
    if (scrapedContent) {
      systemPrompt += `\n\n---\nContenu scrapé d'une page web:\n`;
      systemPrompt += `Titre: ${scrapedContent.title || 'Non disponible'}\n`;
      systemPrompt += `URL: ${scrapedContent.url || 'Non disponible'}\n`;
      systemPrompt += `Contenu:\n${scrapedContent.content?.substring(0, 25000) || 'Contenu non disponible'}`;
      systemPrompt += `\n---\n\nUtilise ce contenu pour répondre aux questions de l'utilisateur.`;
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
