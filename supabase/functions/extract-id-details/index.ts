import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) throw new Error('Unauthorized');

    const { image_url } = await req.json();
    if (!image_url) throw new Error('No image URL provided');

    // Get a signed URL for the image
    const path = image_url.split('/id-documents/')[1];
    const { data: signedData } = await supabase.storage
      .from('id-documents')
      .createSignedUrl(path, 300);

    if (!signedData?.signedUrl) throw new Error('Could not create signed URL');

    // Download the image and convert to base64
    const imageResponse = await fetch(signedData.signedUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Use Lovable AI to extract ID details
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const aiResponse = await fetch('https://ai-gateway.lovable.dev/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract the following details from this ID document image. Return ONLY a valid JSON object with these exact keys: full_name, id_number, date_of_birth, expiry_date. If a field cannot be read, use null. Do not include any other text or markdown formatting, just the JSON object.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 500,
      }),
    });

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '{}';
    
    // Parse the JSON from AI response
    let extracted;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      extracted = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      extracted = { full_name: null, id_number: null, date_of_birth: null, expiry_date: null };
    }

    // Save to user_verifications
    await supabase
      .from('user_verifications')
      .update({
        id_full_name: extracted.full_name,
        id_number: extracted.id_number,
        id_date_of_birth: extracted.date_of_birth,
        id_expiry_date: extracted.expiry_date,
        id_image_url: image_url,
      })
      .eq('user_id', user.id);

    return new Response(JSON.stringify({ success: true, data: extracted }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
