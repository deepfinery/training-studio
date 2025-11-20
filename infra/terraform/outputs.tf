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

output "app_public_ip" {
  value       = aws_instance.app.public_ip
  description = "Public IP for the Ubuntu host"
}
