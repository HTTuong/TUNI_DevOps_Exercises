#!/bin/bash

# Stop and remove containers
docker-compose down

# Remove volumes
docker volume rm exercise1_storage-data exercise1_vstorage 2>/dev/null || true

# Remove local vstorage files
rm -f vstorage/log.txt

# Remove Docker images
docker rmi exercise1_service1 exercise1_service2 exercise1_storage 2>/dev/null || true

echo "Cleanup completed!"
