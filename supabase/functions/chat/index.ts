import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapedPage {
  url: string;
  title: string;
  content: string;
}

interface ScrapedSite {
  url: string;
  title: string;
  content: string;
  siteName: string;
  pages?: ScrapedPage[];
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
        console.log(`Site ${site.siteName}: ${site.pages?.length || 1} pages, ${site.content?.length || 0} chars`);
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
        max_tokens: 8192,
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

// Extract all individual pages from scraped sites
function extractAllPages(scrapedSites: ScrapedSite[]): Array<{ siteName: string; pageUrl: string; pageTitle: string; content: string }> {
  const allPages: Array<{ siteName: string; pageUrl: string; pageTitle: string; content: string }> = [];
  
  for (const site of scrapedSites) {
    if (site.pages && site.pages.length > 0) {
      // Use individual pages with exact URLs
      for (const page of site.pages) {
        allPages.push({
          siteName: site.siteName || site.title,
          pageUrl: page.url,
          pageTitle: page.title,
          content: page.content
        });
      }
    } else if (site.content) {
      // Fallback to main site content
      allPages.push({
        siteName: site.siteName || site.title,
        pageUrl: site.url,
        pageTitle: site.title,
        content: site.content
      });
    }
  }
  
  return allPages;
}

function buildSystemPrompt(scrapedSites: ScrapedSite[] | undefined, categories: string[] | undefined): string {
  const basePrompt = `# RÔLE
Tu es un assistant de recherche EXHAUSTIF et EXPERT. Tu dois analyser EN PROFONDEUR tout le contenu fourni et donner des réponses COMPLÈTES, DÉTAILLÉES et BIEN STRUCTURÉES.

# OBJECTIF PRINCIPAL
Extraire et présenter TOUTES les informations pertinentes des sources de manière claire et professionnelle.`;

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

  // Extract ALL individual pages with their exact URLs
  const allPages = extractAllPages(scrapedSites);
  
  console.log('Total individual pages for prompt:', allPages.length);

  // Build context with individual page URLs
  const pageContexts = allPages.map((page, index) => {
    const sourceNum = index + 1;
    return `
═══════════════════════════════════════════════════════════════
[${sourceNum}] ${page.siteName} - ${page.pageTitle}
URL EXACTE: ${page.pageUrl}
═══════════════════════════════════════════════════════════════
${page.content || "Contenu non disponible"}
`;
  }).join('\n');

  // Build sources list with exact page URLs as clickable markdown links
  const sourcesList = allPages.map((page, index) => {
    return `- **[${index + 1}]** [${page.siteName}](${page.pageUrl})`;
  }).join('\n');

  return `${basePrompt}

# SOURCES DISPONIBLES (${allPages.length} pages avec URLs exactes, numérotées de [1] à [${allPages.length}])

${pageContexts}

═══════════════════════════════════════════════════════════════
FIN DES SOURCES
═══════════════════════════════════════════════════════════════

# FORMAT DE RÉPONSE OBLIGATOIRE (MARKDOWN)

Tu DOIS utiliser le format Markdown pour structurer ta réponse de manière claire et professionnelle:

## STRUCTURE À SUIVRE:

1. **Introduction** : Commence par une phrase d'accroche contextualisant le sujet
2. **Titre principal** : Utilise ### pour le titre principal (ex: ### Le CDD Sportif en France)
3. **Sections numérotées** : Structure avec des sous-sections claires
4. **Listes à puces** : Utilise - ou * pour les listes
5. **Texte en gras** : Utilise **texte** pour les points importants
6. **Séparateurs** : Utilise --- pour séparer les sections
7. **Citations** : Place [1], [2], [3] après chaque information

## EXEMPLE DE FORMAT:

\`\`\`
Il semble que vous cherchiez des informations sur [sujet]. Voici une analyse complète.

---

### **[Titre du Sujet] : Une Vue d'Ensemble**

[Introduction contextuelle du sujet]

**1. [Première Section] :**

- **Point clé 1** : Explication détaillée [1]
- **Point clé 2** : Explication détaillée [2]
- **Point clé 3** : Explication détaillée [1][3]

**2. [Deuxième Section] :**

- Information importante [2]
- Autre information [3]

---

### 📚 **Sources citées**

${sourcesList}
\`\`\`

## RÈGLES CRITIQUES

1. **MARKDOWN OBLIGATOIRE** : Utilise les headers ###, le gras **, les listes -, et les séparateurs ---
2. **CITATIONS** : Mets [1], [2], [3] après CHAQUE information dans le texte
3. **LIENS CLIQUABLES** : Dans la section sources, utilise le format [Nom](URL) pour les liens
4. **EXHAUSTIVITÉ** : Parcours CHAQUE source en détail
5. **CLARTÉ** : Structure la réponse de façon logique et professionnelle
6. **NE PAS INVENTER** : Utilise UNIQUEMENT le contenu fourni

# SECTION SOURCES FINALE (OBLIGATOIRE)

Ta réponse DOIT se terminer par:

---

### 📚 **Sources citées**

${sourcesList}

---`;
}
