# ---------- Stage 1: Build ----------
FROM node:20-alpine AS builder
WORKDIR /app

# pnpm 활성화(버전 고정은 원하는대로)
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# 락 기반 캐시 최적화
# (중요: pnpm-lock.yaml 이 .dockerignore 에 의해 무시되지 않도록!)
COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile

# 나머지 소스 복사 후 빌드
COPY . .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN echo ">>> Building with VITE_API_BASE_URL=${VITE_API_BASE_URL}" && \
    pnpm build

# ---------- Stage 2: Runtime (Nginx) ----------
FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.config /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]


## Stage 1: Build the application
#FROM node:20-alpine AS builder
#
#WORKDIR /app
#
#COPY package*.json ./
#RUN npm ci
#
#ARG VITE_API_BASE_URL
#ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
#
#COPY . .
#
#RUN echo ">>> Building with VITE_API_BASE_URL=$VITE_API_BASE_URL" \     && npm run build
#
## --------------------------------------------------
#
## Stage 2: Serve with Nginx
#FROM nginx:alpine
#
#RUN rm /etc/nginx/conf.d/default.conf
#COPY nginx.config /etc/nginx/conf.d/default.conf
#
#COPY --from=builder /app/dist /usr/share/nginx/html
#
#EXPOSE 80
#
#CMD ["nginx", "-g", "daemon off;"]
#
