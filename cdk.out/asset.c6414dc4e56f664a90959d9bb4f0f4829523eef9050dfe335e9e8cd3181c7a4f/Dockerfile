# Use AWS Lambda Node.js 18 base image
FROM public.ecr.aws/lambda/nodejs:18


# Install LibreOffice and utilities (Amazon Linux)
RUN yum -y install epel-release && \
yum -y update && \
yum -y install libreoffice-headless libreoffice-writer libreoffice-calc libreoffice-impress \
which unzip tar gzip && \
yum clean all && rm -rf /var/cache/yum


# Create app dir
WORKDIR /var/task


# Copy package.json and install dependencies
COPY package.json package-lock.json* /var/task/
RUN npm install --production || true


# Copy function code
COPY . /var/task


# Lambda container entry
CMD [ "index.handler" ]