// netlify/functions/render-project.js
exports.handler = async function(event, context) {
  const projectId = event.queryStringParameters.id;
  if (!projectId) return { statusCode: 302, headers: { Location: '/' } };
  
  const projectIdClean = projectId.replace(/[^a-zA-Z0-9-_]/g, ''); // Sanitize

  // Your Firebase Project ID
  const FIREBASE_PROJECT_ID = "ardhan-s-website";
  
  try {
    // 1. Fetch data directly via Firebase REST API
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/projects/${projectIdClean}`;
    const response = await fetch(firestoreUrl);
    
    if (!response.ok) {
      // If project not found, redirect to home
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

    // Extract tags to intelligently decide which schema to use
    const tagsStr = project.tag ? project.tag.stringValue.toLowerCase() : "";
    const isWebApp = tagsStr.includes("web") || tagsStr.includes("app");

    // ---------------------------------------------------------
    // SCHEMA 1: Breadcrumb (Guides Google to create Sitelinks)
    // ---------------------------------------------------------
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [{
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://ardhan.my.id/"
      },{
        "@type": "ListItem",
        "position": 2,
        "name": "Projects",
        "item": "https://ardhan.my.id/#projects"
      },{
        "@type": "ListItem",
        "position": 3,
        "name": title,
        "item": url
      }]
    };

    // ---------------------------------------------------------
    // SCHEMA 2: Main Content (SoftwareApplication OR Article)
    // ---------------------------------------------------------
    let mainSchema;
    
    if (isWebApp) {
      mainSchema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": title,
        "operatingSystem": "Web Browser",
        "applicationCategory": "WebApplication",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "IDR"
        },
        "description": description,
        "image": imageUrl,
        "author": {
          "@type": "Person",
          "name": "Ardan Ridho",
          "url": "https://ardhan.my.id/"
        }
      };
    } else {
      mainSchema = {
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
    }

    // 3. Construct the injected HTML payload
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title} - Ardan Ridho</title>
          <meta name="description" content="${description}">
          
          <meta property="og:type" content="${isWebApp ? 'website' : 'article'}">
          <meta property="og:title" content="${title} - Ardan Ridho">
          <meta property="og:description" content="${description}">
          <meta property="og:image" content="${imageUrl}">
          <meta property="og:url" content="${url}">
          
          <meta name="twitter:card" content="summary_large_image">
          <meta name="twitter:title" content="${title} - Ardan Ridho">
          <meta name="twitter:description" content="${description}">
          <meta name="twitter:image" content="${imageUrl}">
          
          <script type="application/ld+json">
            [
              ${JSON.stringify(breadcrumbSchema)},
              ${JSON.stringify(mainSchema)}
            ]
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
        "Cache-Control": "public, max-age=3600" 
      },
      body: html
    };

  } catch (error) {
    console.error("Error generating SEO page:", error);
    return { statusCode: 302, headers: { Location: '/' } };
  }
};