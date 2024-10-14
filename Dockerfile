FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y curl git && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean
COPY . /root/nikochan
WORKDIR /root/nikochan
RUN npm ci && \
    npm run build && \
    npm cache clean --force
CMD ["npm", "run", "start"]
