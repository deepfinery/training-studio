variable "project" {
  type        = string
  description = "Project prefix for tagging"
  default     = "deepfinery-training-studio"
}

variable "aws_region" {
  type        = string
  description = "AWS region for all resources"
}

variable "aws_profile" {
  type        = string
  description = "Optional named AWS profile"
  default     = ""
}

variable "s3_data_bucket" {
  type        = string
  description = "S3 bucket for datasets"
}

variable "s3_model_bucket" {
  type        = string
  description = "S3 bucket for trained models"
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR for VPC"
  default     = "10.20.0.0/16"
}

variable "public_subnet_cidr" {
  type        = string
  description = "CIDR for the public subnet"
}

variable "availability_zone" {
  type        = string
  description = "Specific availability zone for subnet"
  default     = ""
}

variable "allowed_ingress_cidr" {
  type        = string
  description = "CIDR allowed to reach the instance"
  default     = "0.0.0.0/0"
}

variable "ssh_key_name" {
  type        = string
  description = "EC2 key pair name"
}

variable "ssh_public_key_path" {
  type        = string
  description = "Path to the public key used for the instance"
}

variable "instance_type" {
  type        = string
  description = "EC2 instance size"
  default     = "t3.small"
}

variable "remote_deploy_path" {
  type        = string
  description = "Path on the VM that will host the docker-compose deployment"
  default     = "/opt/deepfinery"
}
