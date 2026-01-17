const AWS = require('aws-sdk');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');


const s3 = new AWS.S3();
const TMP_DIR = '/tmp';


exports.handler = async (event) => {
console.log('Event:', JSON.stringify(event, null, 2));
const record = (event.Records && event.Records[0]) || event;
const bucket = record.s3 ? record.s3.bucket.name : event.sourceBucket;
const key = record.s3 ? decodeURIComponent(record.s3.object.key.replace(/\+/g, ' ')) : event.sourceKey;


if (!bucket || !key) throw new Error('Missing source bucket or key');


const basename = path.basename(key);
const id = uuidv4();
const localInput = path.join(TMP_DIR, `${id}-${basename}`);
const outputPdfName = `${path.parse(basename).name}.pdf`;
const localOutput = path.join(TMP_DIR, `${id}-${outputPdfName}`);


try {
console.log(`Downloading s3://${bucket}/${key} -> ${localInput}`);
const resp = await s3.getObject({ Bucket: bucket, Key: key }).promise();
fs.writeFileSync(localInput, resp.Body);


console.log('Converting with LibreOffice...');
const cmd = `libreoffice --headless --convert-to pdf "${localInput}" --outdir "${TMP_DIR}"`;
console.log('Run:', cmd);
execSync(cmd, { stdio: 'inherit', timeout: 2 * 60 * 1000 });


// find produced PDF
let producedPdf = null;
if (fs.existsSync(localOutput)) producedPdf = localOutput;
else {
const files = fs.readdirSync(TMP_DIR).filter(f => f.endsWith('.pdf'));
if (files.length === 0) throw new Error('No PDF produced by LibreOffice');
// pick newest
const recent = files.map(f => ({ f, m: fs.statSync(path.join(TMP_DIR,f)).mtimeMs }))
.sort((a,b) => b.m - a.m)[0].f;
producedPdf = path.join(TMP_DIR, recent);
}


const destBucket = process.env.DEST_BUCKET || bucket;
const destPrefix = process.env.DEST_PREFIX || 'converted/';
const destKey = `${destPrefix}${path.basename(producedPdf)}`;


console.log(`Uploading ${producedPdf} -> s3://${destBucket}/${destKey}`);
const body = fs.readFileSync(producedPdf);
await s3.putObject({ Bucket: destBucket, Key: destKey, Body: body, ContentType: 'application/pdf' }).promise();


console.log('Done:', destBucket, destKey);
return { status: 'ok', bucket: destBucket, key: destKey };
} catch (err) {
console.error('Error during conversion:', err);
throw err;
} finally {
// cleanup
try { fs.unlinkSync(localInput); } catch(e){}
try { fs.unlinkSync(localOutput); } catch(e){}
}
};