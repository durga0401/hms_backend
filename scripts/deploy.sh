#!/bin/bash
set -e

# Variables (passed from GitHub Actions)
EC2_HOST=$1
ECR_IMAGE=$2
AWS_REGION=$3

echo "Deploying to EC2: $EC2_HOST"
echo "Image: $ECR_IMAGE"

# SSH into EC2 and deploy
ssh -o StrictHostKeyChecking=no ec2-user@$EC2_HOST << EOF
  # Login to ECR
  aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin 070648356305.dkr.ecr.$AWS_REGION.amazonaws.com

  # Stop and remove existing container
  docker stop hms-backend || true
  docker rm hms-backend || true

  # Pull latest image
  docker pull $ECR_IMAGE

  # Run new container
  docker run -d \
    --name hms-backend \
    --restart unless-stopped \
    -p 5000:5000 \
    --env-file /home/ec2-user/.env \
    $ECR_IMAGE

  echo "Deployment complete!"
  docker ps
EOF
