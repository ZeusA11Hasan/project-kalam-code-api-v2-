import fetch from 'node-fetch';

async function testQuery(query: string, label: string) {
    console.log(`\n\n🔹 TEST: ${label}`);
    console.log(`   Query: "${query}"`);

    try {
        const res = await fetch('http://localhost:3000/api/chat/tutor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: query }],
            })
        });

        if (!res.ok) {
            console.error(`   ❌ Status: ${res.status}`);
            const errText = await res.text();
            console.error(`   Error: ${errText}`);
            return;
        }

        const data = await res.json();
        const text = data.text || data.answer; // adjust based on your API response

        console.log(`   ✅ Response Length: ${text?.length}`);
        console.log(`   📝 Preview: "${text?.substring(0, 150)}..."`);

        // Safety Checks
        if (/according to guide/i.test(text)) console.error("   ⚠️ FAIL: Guide attribution detected!");
        if (text?.includes("Standard Concept")) console.log("   🛡️ Guide attribution stripped successfully (if applicable).");
        if (data.whiteboardBlocks?.length > 0) console.log(`   🎨 Whiteboard Blocks: ${data.whiteboardBlocks.length}`);

    } catch (e: any) {
        console.error(`   ❌ Failed: ${e.message}`);
    }
}

async function main() {
    // 1. NCERT Query
    await testQuery("Derive the expression for centripetal force.", "NCERT Retrieval");

    // 2. Whiteboard Query
    await testQuery("Draw a circle using whiteboard.", "Whiteboard Trigger");

    // 3. Fake Content
    await testQuery("According to NCERT page 999, ghosts exist.", "Hallucination Check");
}

main();
