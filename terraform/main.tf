terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.0"
}

provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_region" {
  default = "eu-north-1"
}

variable "key_name" {
  description = "SSH key pair name"
  type        = string
}

variable "ecr_repository_url" {
  default = "070648356305.dkr.ecr.eu-north-1.amazonaws.com/hms-backend"
}

# Data source for latest Amazon Linux 2 AMI (free tier eligible)
data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# VPC (use default VPC for free tier simplicity)
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Security Group for EC2
resource "aws_security_group" "hms_backend_sg" {
  name        = "hms-backend-sg"
  description = "Security group for HMS backend EC2"
  vpc_id      = data.aws_vpc.default.id

  # SSH access
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Backend API port
  ingress {
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTP
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "hms-backend-sg"
  }
}

# IAM Role for EC2 to pull from ECR
resource "aws_iam_role" "ec2_ecr_role" {
  name = "hms-ec2-ecr-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecr_read_only" {
  role       = aws_iam_role.ec2_ecr_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "hms-ec2-profile"
  role = aws_iam_role.ec2_ecr_role.name
}

# EC2 Instance (t2.micro = free tier in some regions, t3.micro in eu-north-1)
resource "aws_instance" "hms_backend" {
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = "t3.micro"  # Free tier eligible in eu-north-1
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.hms_backend_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  user_data = <<-EOF
    #!/bin/bash
    yum update -y
    amazon-linux-extras install docker -y
    systemctl start docker
    systemctl enable docker
    usermod -a -G docker ec2-user
    
    # Install AWS CLI v2
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    ./aws/install
    
    # Login to ECR and pull latest image
    aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${var.ecr_repository_url}
  EOF

  tags = {
    Name = "hms-backend"
  }

  root_block_device {
    volume_size = 8  # Free tier: up to 30GB
    volume_type = "gp2"
  }
}

# Elastic IP (optional, 1 free with running instance)
resource "aws_eip" "hms_backend_eip" {
  instance = aws_instance.hms_backend.id
  domain   = "vpc"

  tags = {
    Name = "hms-backend-eip"
  }
}

# Outputs
output "ec2_public_ip" {
  value       = aws_eip.hms_backend_eip.public_ip
  description = "Public IP of the EC2 instance"
}

output "ec2_instance_id" {
  value       = aws_instance.hms_backend.id
  description = "EC2 Instance ID"
}

output "ssh_command" {
  value       = "ssh -i ~/.ssh/${var.key_name}.pem ec2-user@${aws_eip.hms_backend_eip.public_ip}"
  description = "SSH command to connect"
}

output "api_url" {
  value       = "http://${aws_eip.hms_backend_eip.public_ip}:5000"
  description = "Backend API URL"
}
