// netlify/functions/sitemap.js
exports.handler = async function(event, context) {
  const FIREBASE_PROJECT_ID = "ardhan-s-website"; 
  
  try {
    // 1. Fetch all projects directly from Firebase REST API
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/projects`;
    const response = await fetch(firestoreUrl);
    const data = await response.json();
    
    const documents = data.documents || [];
    
    // 2. Start building the XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;
    
    // 3. Add your static Homepage WITH your Knowledge Panel image array
    xml += `
  <url>
    <loc>https://ardhan.my.id/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>https://ardhan.my.id/ardan-ridho.png</image:loc>
      <image:title>Ardan Ridho - Creative Media Technologist</image:title>
    </image:image>
    <image:image>
      <image:loc>https://ardhan.my.id/photos/ardan-ridho-aquarium-portrait.webp</image:loc>
      <image:title>Ardan Ridho portrait at an aquarium</image:title>
    </image:image>
    <image:image>
      <image:loc>https://ardhan.my.id/photos/ardan-ridho-aquarium-side.webp</image:loc>
      <image:title>Ardan Ridho side profile at an aquarium</image:title>
    </image:image>
    <image:image>
      <image:loc>https://ardhan.my.id/photos/ardan-ridho-candid.webp</image:loc>
      <image:title>Candid photo of Ardan Ridho</image:title>
    </image:image>
    <image:image>
      <image:loc>https://ardhan.my.id/photos/ardan-ridho-comifuro.webp</image:loc>
      <image:title>Ardan Ridho at Comifuro event</image:title>
    </image:image>
    <image:image>
      <image:loc>https://ardhan.my.id/photos/ardan-ridho-mxfest.webp</image:loc>
      <image:title>Ardan Ridho at MXFest</image:title>
    </image:image>
    <image:image>
      <image:loc>https://ardhan.my.id/photos/ardan-ridho-portrait-casual.webp</image:loc>
      <image:title>Casual portrait of Ardan Ridho</image:title>
    </image:image>
    <image:image>
      <image:loc>https://ardhan.my.id/photos/ardan-ridho-portrait.webp</image:loc>
      <image:title>Professional portrait of Ardan Ridho</image:title>
    </image:image>
    <image:image>
      <image:loc>https://ardhan.my.id/photos/ardan-ridho-rain.webp</image:loc>
      <image:title>Ardan Ridho in the rain</image:title>
    </image:image>
    <image:image>
      <image:loc>https://ardhan.my.id/photos/ardan-ridho-sea.webp</image:loc>
      <image:title>Ardan Ridho by the sea</image:title>
    </image:image>
    <image:image>
      <image:loc>https://ardhan.my.id/photos/ardan-ridho-sky.webp</image:loc>
      <image:title>Ardan Ridho with sky background</image:title>
    </image:image>
    <image:image>
      <image:loc>https://ardhan.my.id/photos/ardan-ridho-unsera.webp</image:loc>
      <image:title>Ardan Ridho at Universitas Serang Raya</image:title>
    </image:image>
    <image:image>
      <image:loc>https://ardhan.my.id/photos/ardan-ridho-unsera2.webp</image:loc>
      <image:title>Ardan Ridho at Universitas Serang Raya campus</image:title>
    </image:image>
  </url>
  <url>
    <loc>https://ardhan.my.id/contact.html</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
`;

    // 4. Dynamically loop through your Firebase projects
    documents.forEach(doc => {
      const pathParts = doc.name.split('/');
      const projectId = pathParts[pathParts.length - 1];
      const lastMod = doc.updateTime ? doc.updateTime.split('T')[0] : new Date().toISOString().split('T')[0];
      
      // Extract project image for Image SEO
      let projectImageXml = '';
      if (doc.fields && doc.fields.imageUrl && doc.fields.imageUrl.stringValue) {
          const imgUrl = doc.fields.imageUrl.stringValue;
          // Use project title for alt/title if available, else generic fallback
          const imgTitle = (doc.fields.title && doc.fields.title.stringValue) ? doc.fields.title.stringValue : 'Project Image';
          
          projectImageXml = `
    <image:image>
      <image:loc>${imgUrl}</image:loc>
      <image:title>${imgTitle}</image:title>
    </image:image>`;
      }

      xml += `  <url>
    <loc>https://ardhan.my.id/project/${projectId}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>${projectImageXml}
  </url>\n`;
    });

    xml += `</urlset>`;

    // 5. Return the XML document
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600" // Cache at the edge for 1 hour
      },
      body: xml
    };

  } catch (error) {
    console.error("Error generating sitemap:", error);
    return { statusCode: 500, body: "Error generating sitemap" };
  }
};