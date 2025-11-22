terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile == "" ? null : var.aws_profile
}

locals {
  tags = {
    Project = var.project
    Managed = "terraform"
  }
  availability_zone = var.availability_zone != "" ? var.availability_zone : "${var.aws_region}a"
  availability_zone_b = var.availability_zone != "" ? var.availability_zone : "${var.aws_region}b"
}

resource "aws_s3_bucket" "data" {
  bucket        = var.s3_data_bucket
  force_destroy = true
  tags          = local.tags
}

resource "aws_s3_bucket" "models" {
  bucket        = var.s3_model_bucket
  force_destroy = true
  tags          = local.tags
}

resource "aws_cognito_user_pool" "this" {
  name                     = "${var.project}-users"
  auto_verified_attributes = ["email"]
  mfa_configuration        = "OFF"

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true
    developer_only_attribute = false
    string_attribute_constraints {
      min_length = "5"
      max_length = "254"
    }
  }

  tags = local.tags
}

resource "aws_cognito_user_pool_client" "this" {
  name                                 = "${var.project}-client"
  user_pool_id                         = aws_cognito_user_pool.this.id
  generate_secret                      = false
  prevent_user_existence_errors        = "ENABLED"
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  supported_identity_providers         = ["COGNITO", "Google"]
  callback_urls                        = var.oauth_callback_urls
  logout_urls                          = var.oauth_logout_urls
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  explicit_auth_flows = [
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]
  depends_on = [aws_cognito_identity_provider.google]
  tags = local.tags
}

resource "aws_cognito_identity_provider" "google" {
  user_pool_id  = aws_cognito_user_pool.this.id
  provider_name = "Google"
  provider_type = "Google"

  provider_details = {
    authorize_scopes = "email profile openid"
    client_id        = var.google_client_id
    client_secret    = var.google_client_secret
  }

  attribute_mapping = {
    email    = "email"
    username = "sub"
    name     = "name"
  }
}

resource "aws_cognito_user_pool_domain" "this" {
  domain       = var.cognito_domain_prefix
  user_pool_id = aws_cognito_user_pool.this.id
}

resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags                 = local.tags
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.this.id
  cidr_block              = var.public_subnet_cidr
  map_public_ip_on_launch = true
  availability_zone       = local.availability_zone
  tags = local.tags
}

resource "aws_subnet" "public_b" {
  vpc_id                  = aws_vpc.this.id
  cidr_block              = var.public_subnet_cidr_b
  map_public_ip_on_launch = true
  availability_zone       = local.availability_zone_b
  tags = local.tags
}

resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id
  tags   = local.tags
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.this.id
  }

  tags = local.tags
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public.id
}

resource "aws_security_group" "app" {
  name        = "${var.project}-sg"
  description = "Permit SSH and app traffic"
  vpc_id      = aws_vpc.this.id

  ingress {
    description      = "SSH"
    from_port        = 22
    to_port          = 22
    protocol         = "tcp"
    cidr_blocks      = [var.allowed_ingress_cidr]
    ipv6_cidr_blocks = []
  }

  ingress {
    description = "Frontend"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ingress_cidr]
  }

  ingress {
    description = "Backend"
    from_port   = 4000
    to_port     = 4000
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ingress_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.tags
}

resource "aws_security_group" "docdb" {
  name        = "${var.project}-docdb-sg"
  description = "Permit DocumentDB traffic from app hosts"
  vpc_id      = aws_vpc.this.id

  ingress {
    description     = "DocumentDB"
    from_port       = var.docdb_port
    to_port         = var.docdb_port
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.tags
}

data "aws_ami" "ubuntu" {
  owners      = ["099720109477"]
  most_recent = true

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_docdb_subnet_group" "this" {
  name       = "${var.project}-docdb-subnets"
  subnet_ids = [aws_subnet.public.id, aws_subnet.public_b.id]
  tags       = local.tags
}

resource "aws_docdb_cluster" "this" {
  cluster_identifier              = "${var.project}-docdb"
  engine                          = "docdb"
  engine_version                  = "5.0"
  master_username                 = var.docdb_username
  master_password                 = var.docdb_password
  port                            = var.docdb_port
  db_subnet_group_name            = aws_docdb_subnet_group.this.name
  vpc_security_group_ids          = [aws_security_group.docdb.id]
  backup_retention_period         = 1
  preferred_backup_window         = "03:00-05:00"
  preferred_maintenance_window    = "sun:06:00-sun:07:00"
  storage_encrypted               = true
  deletion_protection             = false
  apply_immediately               = true
  skip_final_snapshot             = true
  enabled_cloudwatch_logs_exports = ["audit"]
  tags                            = local.tags
}

resource "aws_docdb_cluster_instance" "this" {
  count              = var.docdb_instance_count
  identifier         = "${var.project}-docdb-${count.index}"
  cluster_identifier = aws_docdb_cluster.this.id
  instance_class     = var.docdb_instance_class
  apply_immediately  = true
  tags               = local.tags
}

resource "aws_key_pair" "deployer" {
  key_name   = var.ssh_key_name
  public_key = file(var.ssh_public_key_path)
  tags       = local.tags
}

resource "aws_instance" "app" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.public.id
  vpc_security_group_ids      = [aws_security_group.app.id]
  key_name                    = aws_key_pair.deployer.key_name
  associate_public_ip_address = true

  user_data = <<-EOT
              #!/bin/bash
              set -euxo pipefail
              apt-get update
              apt-get install -y ca-certificates curl gnupg lsb-release
              install -m 0755 -d /etc/apt/keyrings
              curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
              chmod a+r /etc/apt/keyrings/docker.gpg
              echo \"deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable\" > /etc/apt/sources.list.d/docker.list
              apt-get update
              apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin git
              usermod -aG docker ubuntu
              systemctl enable docker
              systemctl start docker
              mkdir -p ${var.remote_deploy_path}
              chown ubuntu:ubuntu ${var.remote_deploy_path}
              EOT

  tags = local.tags
}
