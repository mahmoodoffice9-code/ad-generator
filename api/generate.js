export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { productName, features, audience, purpose } = req.body;

    if (!productName || !features || !audience || !purpose) {
        return res.status(400).json({ error: 'Missing parameters' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured in Vercel environment variables.' });
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                response_format: { type: "json_object" },
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert SaaS copywriter. Your task is to output a JSON object containing exactly 4 marketing assets:
                        1. "instagram": An engaging Instagram caption with hashtags and emojis.
                        2. "facebook": A structured Facebook ad copy with a Hook, Body, and Call to Action.
                        3. "whatsapp": A friendly, direct WhatsApp promotional message with bold highlights.
                        4. "description": A short, catchy product description (max 3-4 sentences).
                        Ensure the JSON output strictly follows this structure:
                        {
                            "instagram": "...",
                            "facebook": "...",
                            "whatsapp": "...",
                            "description": "..."
                        }`
                    },
                    {
                        role: 'user',
                        content: `Generate marketing assets for:
                        - Product: ${productName}
                        - Features/Benefits: ${features}
                        - Target Audience: ${audience}
                        - Goal of campaign: ${purpose}`
                    }
                ],
                temperature: 0.7
            })
        });

        const rawData = await response.json();
        if (rawData.choices && rawData.choices[0]) {
            const parsedData = JSON.parse(rawData.choices[0].message.content);
            return res.status(200).json({ success: true, data: parsedData });
        } else {
            return res.status(500).json({ error: 'Failed to parse AI response' });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
