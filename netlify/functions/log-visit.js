exports.handler = async function(event, context) {
  const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
  const visitData = JSON.parse(event.body);

  try {
    await fetch(discordWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(visitData),
    });

    return {
      statusCode: 200,
      body: "Log sent successfully."
    };
  } catch (error) {
    console.error("Error sending to Discord:", error);
    return {
      statusCode: 500,
      body: "Failed to send log."
    };
  }
};
