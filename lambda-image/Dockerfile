FROM public.ecr.aws/lambda/nodejs:18

# Copy function code
COPY index.js package.json ./

# Install only production deps (if any)
RUN npm install --only=production

# Lambda entrypoint
CMD ["index.handler"]