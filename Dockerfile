# Washio Admin Panel - Multi-stage Docker Build
# Serves pre-built React app with Nginx

FROM nginx:alpine

# Copy the pre-built dist folder
COPY dist/ /usr/share/nginx/html/

# Create nginx config - will proxy API to external backend
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
