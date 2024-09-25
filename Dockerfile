FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y ffmpeg python3 python3-pip curl git && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean
RUN pip install yt-dlp soundfile msgpack numpy && \
    pip cache purge
COPY . /root/nikochan
WORKDIR /root/nikochan
RUN npm ci && \
    npx prisma generate && \
    npm run build && \
    npm cache clean --force
CMD ["sh", "-c", "npx prisma db push && npm run start"]
