from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'  # Use email as the username field

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if not email or not password:
            raise serializers.ValidationError({
                'detail': 'Both email and password are required.'
            })

        try:
            user = User.objects.get(email=email)
            if not user.check_password(password):
                raise serializers.ValidationError({
                    'detail': 'Invalid email or password.'
                })
        except User.DoesNotExist:
            raise serializers.ValidationError({
                'detail': 'Invalid email or password.'
            })

        if not user.is_active:
            raise serializers.ValidationError({
                'detail': 'User account is disabled.'
            })

        refresh = self.get_token(user)
        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'email': user.email,
            'is_merchant': user.is_merchant
        }
        return data

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'password2', 'is_merchant')
        extra_kwargs = {
            'email': {'required': True},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data['email'],
            is_merchant=validated_data.get('is_merchant', False)
        )
        user.set_password(validated_data['password'])
        user.save()
        return user 