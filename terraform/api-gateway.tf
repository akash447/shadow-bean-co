# ==============================================
# SHADOW BEAN CO - API Gateway + Lambda
# ==============================================

# Lambda function
resource "aws_lambda_function" "api" {
  function_name = "${var.project_name}-api"
  runtime       = "nodejs20.x"
  handler       = "index.handler"
  role          = aws_iam_role.lambda_exec.arn
  timeout       = 30
  memory_size   = 512

  filename         = "${path.module}/../lambda/api/api.zip"
  source_code_hash = filebase64sha256("${path.module}/../lambda/api/api.zip")

  # No VPC needed - using RDS Data API (public endpoint), not direct PG connection
  # VPC config removed to avoid needing NAT Gateway ($30/mo)

  environment {
    variables = {
      DB_CLUSTER_ARN        = aws_rds_cluster.main.arn
      DB_SECRET_ARN         = aws_secretsmanager_secret.db_credentials.arn
      DB_NAME               = var.db_name
      COGNITO_USER_POOL_ID  = var.cognito_user_pool_id
      COGNITO_CLIENT_ID     = var.cognito_web_client_id
      MEDIA_BUCKET          = aws_s3_bucket.media.id
      MEDIA_CDN_URL         = "https://media.${var.domain_name}"
    }
  }

  tags = {
    Name = "${var.project_name}-api"
  }
}

# API Gateway HTTP API
resource "aws_apigatewayv2_api" "main" {
  name          = "${var.project_name}-api"
  protocol_type = "HTTP"
  description   = "Shadow Bean Co API"

  cors_configuration {
    allow_origins = [
      "https://shadowbeanco.net",
      "https://www.shadowbeanco.net",
      "https://admin.shadowbeanco.net",
      "http://localhost:5173",
      "http://localhost:8081",
    ]
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization"]
    max_age       = 3600
  }

  tags = {
    Name = "${var.project_name}-api-gateway"
  }
}

resource "aws_apigatewayv2_stage" "prod" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
      errorMessage   = "$context.error.message"
    })
  }
}

resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.project_name}-api"
  retention_in_days = 30
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.api.invoke_arn
  integration_method = "POST"
}

resource "aws_apigatewayv2_route" "catch_all" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# Custom domain for API
resource "aws_apigatewayv2_domain_name" "api" {
  domain_name = "api.shadowbeanco.net"

  domain_name_configuration {
    certificate_arn = aws_acm_certificate_validation.api_regional.certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

resource "aws_apigatewayv2_api_mapping" "api" {
  api_id      = aws_apigatewayv2_api.main.id
  domain_name = aws_apigatewayv2_domain_name.api.domain_name
  stage       = aws_apigatewayv2_stage.prod.id
}

# Route 53 record for api.shadowbeanco.net
resource "aws_route53_record" "api" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "api.shadowbeanco.net"
  type    = "A"

  alias {
    name                   = aws_apigatewayv2_domain_name.api.domain_name_configuration[0].target_domain_name
    zone_id                = aws_apigatewayv2_domain_name.api.domain_name_configuration[0].hosted_zone_id
    evaluate_target_health = false
  }
}

# ==============================================
# OUTPUTS
# ==============================================

output "api_gateway_url" {
  description = "API Gateway URL"
  value       = aws_apigatewayv2_api.main.api_endpoint
}

output "api_custom_domain" {
  description = "Custom API domain"
  value       = "https://api.shadowbeanco.net"
}
