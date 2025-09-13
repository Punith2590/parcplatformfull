# backend/core/serializers.py

from rest_framework import serializers
from .models import User, College, Material, Schedule, TrainerApplication
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.db import IntegrityError

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['role'] = user.role
        token['name'] = user.get_full_name
        return token

class UserSerializer(serializers.ModelSerializer):
    name = serializers.CharField(write_only=True, required=True)
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    username = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'role', 'expertise', 'experience',
            'phone', 'course', 'college', 'access_expiry_date',
            'assigned_materials', 'name', 'full_name'
        )
        extra_kwargs = {
            'email': {'required': True},
        }

    def create(self, validated_data):
        full_name = validated_data.pop('name')
        email = validated_data.pop('email')
        name_parts = full_name.split(" ", 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""
        password = "password"
        try:
            user = User.objects.create_user(
                username=email,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                **validated_data
            )
        except IntegrityError:
            raise serializers.ValidationError({'email': ['A user with this email already exists.']})
        print(f"--- CREATED USER: {user.email} | TEMP PASSWORD: {password} ---")
        return user

class CollegeSerializer(serializers.ModelSerializer):
    class Meta:
        model = College
        fields = '__all__'

class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = '__all__'

class ScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Schedule
        fields = '__all__'

class TrainerApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainerApplication
        fields = '__all__'