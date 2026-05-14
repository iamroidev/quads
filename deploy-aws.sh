#!/bin/bash
set -e

# QUADS Backend Deployment Script for AWS EC2
# Usage: ./deploy-aws.sh

echo "🚀 QUADS Backend Deployment to AWS"

# Configuration
INSTANCE_TYPE="t4g.nano"
KEY_NAME="quads-key"
SECURITY_GROUP="quads-sg"
AMI_ID="ami-0c02fb55956c7d316"  # Amazon Linux 2023 ARM
REGION="us-east-1"

# Step 1: Create Key Pair if not exists
if ! aws ec2 describe-key-pairs --key-names $KEY_NAME 2>/dev/null; then
    echo "🔑 Creating key pair..."
    aws ec2 create-key-pair --key-name $KEY_NAME --query 'KeyMaterial' --output text > $KEY_NAME.pem
    chmod 400 $KEY_NAME.pem
fi

# Step 2: Create Security Group
SG_ID=$(aws ec2 describe-security-groups --group-names $SECURITY_GROUP --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null || true)

if [ -z "$SG_ID" ]; then
    echo "🔒 Creating security group..."
    SG_ID=$(aws ec2 create-security-group --group-name $SECURITY_GROUP --description "QUADS API Security Group" --query 'GroupId' --output text)
    aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 22 --cidr 0.0.0.0/0
    aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0
    aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 443 --cidr 0.0.0.0/0
    aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 5000 --cidr 0.0.0.0/0
fi

# Step 3: Launch EC2 Instance
echo "🖥️  Launching EC2 instance..."
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --count 1 \
    --instance-type $INSTANCE_TYPE \
    --key-name $KEY_NAME \
    --security-group-ids $SG_ID \
    --user-data file://server/user-data.sh \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "⏳ Waiting for instance to be running..."
aws ec2 wait instance-running --instance-ids $INSTANCE_ID

PUBLIC_IP=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)

echo ""
echo "✅ Instance launched successfully!"
echo "📍 Public IP: $PUBLIC_IP"
echo "🔑 SSH: ssh -i $KEY_NAME.pem ec2-user@$PUBLIC_IP"
echo ""
echo "Next steps:"
echo "1. Copy .env to server: scp -i $KEY_NAME.pem server/.env ec2-user@$PUBLIC_IP:/home/ec2-user/quads/"
echo "2. SSH into instance and run: cd /home/ec2-user/quads && npm install && npm start"
echo "3. Set up Nginx reverse proxy (optional)"
echo "4. Configure Paystack webhook to: http://$PUBLIC_IP/api/payments/webhook"