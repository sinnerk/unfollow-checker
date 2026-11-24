# Static host for the Unfollow Checker website (Railway / any Docker host).
# The site is 100% client-side, so all this container does is serve files.
FROM nginx:1.27-alpine

RUN rm -rf /usr/share/nginx/html/*
COPY docs/ /usr/share/nginx/html/
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
