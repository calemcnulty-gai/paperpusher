import { S3Event, Context } from "aws-lambda";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { simpleParser } from "mailparser";

const s3Client = new S3Client({ region: "us-east-1" });

export const handler = async (event: S3Event, context: Context) => {
    try {
        const record = event.Records[0];
        const bucket = record.s3.bucket.name;
        const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

        // Get email from S3
        const { Body } = await s3Client.send(
            new GetObjectCommand({ Bucket: bucket, Key: key })
        );

        if (!Body) throw new Error("No email body found");

        // Parse email
        const email = await simpleParser(Body as any);

        // Process attachments
        const pdfAttachments = email.attachments.filter(
            (att) => att.contentType === "application/pdf"
        );

        // TODO: Forward PDFs to Supabase processing pipeline
        console.log(`Found ${pdfAttachments.length} PDF attachments`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Processed ${pdfAttachments.length} PDF attachments`,
                subject: email.subject,
                from: email.from?.text,
                attachments: pdfAttachments.map(att => att.filename)
            })
        };
    } catch (error) {
        console.error("Error processing email:", error);
        throw error;
    }
}; 