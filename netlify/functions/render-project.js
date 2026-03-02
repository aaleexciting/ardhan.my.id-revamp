// netlify/functions/render-project.js
exports.handler = async function(event, context) {
  const projectId = event.queryStringParameters.id;
  const projectIdClean = projectId.replace(/[^a-zA-Z0-9-_]/g, ''); // Sanitize

  // Replace with your actual Firebase Project ID
  const FIREBASE_PROJECT_ID = "ardhan-s-website";
  
  try {
    // 1. Fetch data directly via Firebase REST API (Blazing fast, no SDK needed)
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/projects/${projectIdClean}`;
    const response = await fetch(firestoreUrl);
    
    if (!response.ok) {
      // If project not found, redirect to home or a 404 page
      return { statusCode: 302, headers: { Location: '/' } };
    }

    const data = await response.json();
    const project = data.fields;

    // Extract values safely from Firestore REST format
    const title = project.title ? project.title.stringValue : "Project Details";
    const description = project.description ? project.description.stringValue : "Read about this project.";
    const imageUrl = project.imageUrl ? project.imageUrl.stringValue : "https://ardhan.my.id/banner.png";
    const content = project.content ? project.content.stringValue : "";
    const url = `https://ardhan.my.id/project/${projectIdClean}`;

    // 2. Build the Article Schema
    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": title,
      "image": imageUrl,
      "author": {
        "@type": "Person",
        "name": "Ardan Ridho",
        "url": "https://ardhan.my.id/"
      },
      "publisher": {
        "@type": "Person",
        "name": "Ardan Ridho"
      },
      "description": description
    };

    // 3. Construct the injected HTML payload
    // We return a lightweight HTML shell with the exact meta tags needed for SEO.
    // It includes a script that immediately redirects human users to your actual CSR detail.html page, 
    // but Googlebot will read the meta tags and schema perfectly.
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title} - Ardan Ridho</title>
          <meta name="description" content="${description}">
          
          <meta property="og:type" content="article">
          <meta property="og:title" content="${title} - Ardan Ridho">
          <meta property="og:description" content="${description}">
          <meta property="og:image" content="${imageUrl}">
          <meta property="og:url" content="${url}">
          
          <meta name="twitter:card" content="summary_large_image">
          <meta name="twitter:title" content="${title} - Ardan Ridho">
          <meta name="twitter:description" content="${description}">
          <meta name="twitter:image" content="${imageUrl}">
          
          <script type="application/ld+json">
            ${JSON.stringify(articleSchema)}
          </script>

          <script>
             window.location.replace("/detail.html?type=projects&id=${projectIdClean}");
          </script>
      </head>
      <body>
          <h1>${title}</h1>
          <p>${description}</p>
          <img src="${imageUrl}" alt="${title}">
          <div>${content}</div>
      </body>
      </html>
    `;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        // Cache at the edge for 1 hour to prevent spamming your Firebase database
        "Cache-Control": "public, max-age=3600" 
      },
      body: html
    };

  } catch (error) {
    console.error("Error generating SEO page:", error);
    return { statusCode: 302, headers: { Location: '/' } };
  }
};