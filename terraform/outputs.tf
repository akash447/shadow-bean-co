# ==============================================
# SHADOW BEAN CO - Terraform Outputs
# ==============================================

output "rds_cluster_endpoint" {
  description = "RDS Aurora cluster endpoint"
  value       = aws_rds_cluster.main.endpoint
}

output "rds_cluster_reader_endpoint" {
  description = "RDS Aurora reader endpoint"
  value       = aws_rds_cluster.main.reader_endpoint
}

output "rds_cluster_arn" {
  description = "RDS Aurora cluster ARN (for Data API)"
  value       = aws_rds_cluster.main.arn
}

output "db_secret_arn" {
  description = "Secrets Manager ARN for DB credentials"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "media_bucket_name" {
  description = "S3 media bucket name"
  value       = aws_s3_bucket.media.id
}

output "media_bucket_arn" {
  description = "S3 media bucket ARN"
  value       = aws_s3_bucket.media.arn
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for media"
  value       = aws_cloudfront_distribution.media.id
}

output "cloudfront_domain_name" {
  description = "CloudFront domain name"
  value       = aws_cloudfront_distribution.media.domain_name
}

output "media_cdn_url" {
  description = "Full media CDN URL"
  value       = "https://media.shadowbeanco.net"
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = data.aws_route53_zone.main.zone_id
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "lambda_exec_role_arn" {
  description = "Lambda execution role ARN"
  value       = aws_iam_role.lambda_exec.arn
}
