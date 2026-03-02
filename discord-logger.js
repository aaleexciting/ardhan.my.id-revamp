import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";

async function collectAndSendDeviceData() {
    const userAgent = navigator.userAgent.toLowerCase();
    const isBot = /bot|googlebot|crawler|spider|robot|crawling|facebookexternalhit/i.test(userAgent);
    
    if (isBot) {
        console.log("Bot detected. Logging skipped.");
        return;
    }

    // 1. Gather advanced device & hardware data
    const deviceData = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        colorDepth: window.screen.colorDepth || 'Unknown',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        platform: navigator.platform || 'Unknown',
        cores: navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency}` : 'Unknown',
        ram: navigator.deviceMemory ? `${navigator.deviceMemory} GB+` : 'Unknown',
        connectionType: navigator.connection ? navigator.connection.effectiveType.toUpperCase() : 'Unknown',
        path: window.location.pathname
    };

    // Extract GPU Information
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        deviceData.gpu = gl ? (gl.getExtension('WEBGL_debug_renderer_info') ? gl.getParameter(gl.getExtension('WEBGL_debug_renderer_info').UNMASKED_RENDERER_WEBGL) : 'N/A') : 'WebGL not supported';
    } catch (e) {
        deviceData.gpu = 'Error getting WebGL info';
    }

    // Determine Device Type
    if (window.innerWidth < 768) {
        deviceData.deviceType = 'Mobile';
    } else if (window.innerWidth < 1024) {
        deviceData.deviceType = 'Tablet';
    } else {
        deviceData.deviceType = 'Desktop';
    }

    // Fetch IP and Location Data (Wrapped safely in case of AdBlockers)
    let ipData = { ip: 'Unknown', city: 'Unknown', country_name: 'Unknown', org: 'Unknown' };
    try {
        const ipResponse = await fetch('https://ipapi.co/json/');
        if (ipResponse.ok) {
            ipData = await ipResponse.json();
        }
    } catch (error) {
        console.warn('IP tracking blocked or failed.');
    }

    // 2. Initialize Firebase and Save to Database (For Admin Dashboard)
    try {
        const visitPayload = {
            ...deviceData,
            ip: ipData.ip || 'Unknown',
            city: ipData.city || 'Unknown',
            country: ipData.country_name || 'Unknown',
            isp: ipData.org || 'Unknown',
            visitedAt: serverTimestamp()
        };

        const configResponse = await fetch('/.netlify/functions/firebase-config');
        if (configResponse.ok) {
            const firebaseConfig = await configResponse.json();
            const app = initializeApp(firebaseConfig);
            const db = getFirestore(app);
            await addDoc(collection(db, "visits"), visitPayload);
            console.log('Visitor data securely logged to Firebase Dashboard.');
        }
    } catch (error) {
        console.error('Error logging visit to Firebase:', error);
    }

    // 3. Send Rich Notification to Discord (via Secure Netlify Function)
    try {
        const discordPayload = {
            username: 'Hanser Web Activity Logger',
            avatar_url: 'https://res.cloudinary.com/ddrtdofqo/image/upload/v1758215682/pfppfp_222_fgqlan.jpg',
            embeds: [{
                title: 'New Website Visit Detected!',
                description: `A user visited **${deviceData.path || '/'}** at ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })} (WIB).`,
                color: 3447003, // A nice subtle blue
                fields: [
                    { name: 'Location', value: `${ipData.city || 'N/A'}, ${ipData.country_name || 'N/A'}`, inline: true },
                    { name: 'IP Address', value: ipData.ip || 'Unknown', inline: true },
                    { name: 'ISP / Org', value: ipData.org || 'Unknown', inline: true },
                    { name: 'Hardware', value: `${deviceData.cores} Cores | ${deviceData.ram} RAM`, inline: true },
                    { name: 'Network', value: deviceData.connectionType, inline: true },
                    { name: 'Screen Size', value: `${deviceData.screenWidth}x${deviceData.screenHeight}`, inline: true },
                    { name: 'Device Type', value: `${deviceData.deviceType} (${deviceData.platform})`, inline: true },
                    { name: 'GPU Renderer', value: `\`${deviceData.gpu}\``, inline: false },
                    { name: 'User Agent', value: `\`${deviceData.userAgent}\``, inline: false }
                ],
                footer: { text: 'Logged to Firebase & Discord securely via Netlify' },
                timestamp: new Date().toISOString()
            }]
        };

        // Calls your server-side function, keeping the webhook secret safe
        const discordResponse = await fetch('/.netlify/functions/log-visit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(discordPayload)
        });
        
        if (discordResponse.ok) {
            console.log('Visitor data securely relayed to Discord!');
        }
    } catch (error) {
        console.error('Error triggering Discord webhook function:', error);
    }
}

// Trigger logging when page is fully loaded
if (document.readyState === 'complete') {
    collectAndSendDeviceData();
} else {
    window.addEventListener('load', collectAndSendDeviceData);
}