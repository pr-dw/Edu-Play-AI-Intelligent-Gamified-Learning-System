from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'points', 'level', 'bio', 'avatar', 'date_joined'
        ]
        read_only_fields = ['id', 'points', 'level', 'date_joined']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'role', 'avatar']

    def create(self, validated_data):
        password = validated_data.pop('password')
        if 'role' not in validated_data or validated_data['role'] not in ('user', 'admin'):
            validated_data['role'] = 'user'
        user = User(**validated_data)
        user.set_password(password)
        # Give initial welcome XP
        user.points = 100
        user.level = 1
        user.save()
        return user

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        user = authenticate(username=username, password=password)
        if not user:
            # Fallback check if user entered email instead of username
            try:
                user_obj = User.objects.get(email=username)
                if user_obj.check_password(password):
                    user = user_obj
            except User.DoesNotExist:
                pass

        if not user:
            raise serializers.ValidationError("Invalid username or password.")

        if not user.is_active:
            raise serializers.ValidationError("This account has been deactivated.")

        refresh = RefreshToken.for_user(user)
        return {
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }
