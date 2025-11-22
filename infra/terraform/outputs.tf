output "s3_data_bucket" {
  value       = aws_s3_bucket.data.bucket
  description = "Dataset bucket name"
}

output "s3_model_bucket" {
  value       = aws_s3_bucket.models.bucket
  description = "Model bucket name"
}

output "cognito_user_pool_id" {
  value       = aws_cognito_user_pool.this.id
  description = "User pool ID"
}

output "cognito_client_id" {
  value       = aws_cognito_user_pool_client.this.id
  description = "App client ID"
}

output "cognito_domain" {
  value       = aws_cognito_user_pool_domain.this.domain
  description = "Hosted UI domain"
}

output "app_public_ip" {
  value       = aws_instance.app.public_ip
  description = "Public IP for the Ubuntu host"
}

output "docdb_endpoint" {
  value       = aws_docdb_cluster.this.endpoint
  description = "DocumentDB endpoint"
}

output "docdb_connection_uri" {
  value       = "mongodb://${var.docdb_username}:${var.docdb_password}@${aws_docdb_cluster.this.endpoint}:${var.docdb_port}/?tls=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false"
  description = "Connection string for the DocumentDB cluster"
  sensitive   = true
}
