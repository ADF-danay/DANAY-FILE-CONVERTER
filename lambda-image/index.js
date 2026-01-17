exports.handler = async (event) => {
  console.log("Danay File Converter Lambda invoked!");
  console.log("Event:", JSON.stringify(event, null, 2));

  // If called by API Gateway (HTTP)
  if (event.httpMethod) {
    // For now we just echo back what we received
    const body = event.body || "";
    const isBase64 = event.isBase64Encoded;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Received HTTP request via API Gateway ✅",
        httpMethod: event.httpMethod,
        bodyLength: body.length,
        isBase64Encoded: !!isBase64,
      }),
    };
  }

  // If triggered by S3 (file upload)
  if (event.Records && event.Records[0].eventSource === "aws:s3") {
    const record = event.Records[0];
    console.log("S3 event for bucket:", record.s3.bucket.name);
    console.log("Object key:", record.s3.object.key);

    // Keep it simple for now
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Handled S3 event ✅",
        bucket: record.s3.bucket.name,
        key: record.s3.object.key,
      }),
    };
  }

  // Fallback
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Lambda is deployed and running ✅ (unknown event type)",
    }),
  };
};