import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CLIENT_ID = Deno.env.get('FRANCE_TRAVAIL_CLIENT_ID');
const CLIENT_SECRET = Deno.env.get('FRANCE_TRAVAIL_CLIENT_SECRET');

async function getAccessToken(): Promise<string> {
  console.log('Getting access token...');
  
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: CLIENT_ID!,
    client_secret: CLIENT_SECRET!,
    scope: 'api_offresdemploiv2 o2dsoffre'
  });

  const response = await fetch('https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Token error:', response.status, errorText);
    throw new Error(`Failed to get access token: ${response.status}`);
  }

  const data = await response.json();
  console.log('Access token obtained successfully');
  return data.access_token;
}

async function searchJobs(accessToken: string, query: string, commune?: string, departement?: string): Promise<any> {
  console.log('Searching jobs with query:', query, 'commune:', commune, 'departement:', departement);
  
  const params = new URLSearchParams();
  
  if (query) {
    params.append('motsCles', query);
  }
  
  // Paris commune code is 75056, but we can also use departement 75
  if (commune) {
    params.append('commune', commune);
  } else if (departement) {
    params.append('departement', departement);
  }
  
  params.append('range', '0-49'); // Get first 50 results
  
  const url = `https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search?${params.toString()}`;
  console.log('Request URL:', url);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Search error:', response.status, errorText);
    throw new Error(`Failed to search jobs: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('Found', data.resultats?.length || 0, 'jobs');
  return data;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!CLIENT_ID || !CLIENT_SECRET) {
      throw new Error('France Travail API credentials not configured');
    }

    const { query, commune, departement } = await req.json();
    console.log('Received request:', { query, commune, departement });

    // Get access token
    const accessToken = await getAccessToken();

    // Search for jobs
    const results = await searchJobs(accessToken, query || '', commune, departement);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in france-travail function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
