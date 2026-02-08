# ==============================================
# SHADOW BEAN CO - Terraform Variables
# ==============================================

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "shadowbeanco"
}

variable "environment" {
  description = "Environment (dev, staging, production)"
  type        = string
  default     = "production"
}

variable "domain_name" {
  description = "Primary domain name"
  type        = string
  default     = "shadowbeanco.net"
}

variable "admin_subdomain" {
  description = "Admin panel subdomain"
  type        = string
  default     = "admin.shadowbeanco.net"
}

# RDS
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.micro"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "shadowbeanco"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "sbcadmin"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password - set via TF_VAR_db_password env var"
  type        = string
  sensitive   = true
}

# Cognito (existing)
variable "cognito_user_pool_id" {
  description = "Existing Cognito User Pool ID"
  type        = string
  default     = "ap-south-1_jZV6770zJ"
}

variable "cognito_identity_pool_id" {
  description = "Existing Cognito Identity Pool ID"
  type        = string
  default     = "ap-south-1:5dd67b93-9e3c-4de3-a74f-2df439437bbd"
}

variable "cognito_web_client_id" {
  description = "Existing Cognito Web Client ID"
  type        = string
  default     = "42vpa5vousikig0c4ohq2vmkge"
}
