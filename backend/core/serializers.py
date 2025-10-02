# backend/core/serializers.py

from rest_framework import serializers
from .models import Batch, StudentAttempt, User, College, Material, Schedule, TrainerApplication, Expense, Bill, Assessment, Course
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.db import IntegrityError, transaction
from django.utils import timezone

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['role'] = user.role
        token['name'] = user.get_full_name
        token['course'] = user.course
        return token
    
    def validate(self, attrs):
        # Run the default validation first
        data = super().validate(attrs)

        # self.user is now available after super().validate()
        user = self.user

        # --- THIS IS THE NEW SECURITY CHECK ---
        # 1. Check if the user account is active
        if not user.is_active:
            raise serializers.ValidationError("Your account is inactive. Please contact an administrator.")

        # 2. For trainers, check if their access has expired
        if user.role == 'TRAINER':
            if user.access_expiry_date and user.access_expiry_date < timezone.now():
                # Deactivate the user for future login attempts
                user.is_active = False
                user.save()
                raise serializers.ValidationError("Your access period has expired. Please contact an administrator to be assigned to a new schedule.")

        return data

class UserSerializer(serializers.ModelSerializer):
    name = serializers.CharField(write_only=True, required=True)
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    username = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'role', 'expertise', 'experience',
            'phone', 'course', 'college', 'access_expiry_date',
            'assigned_materials', 'name', 'full_name', 'resume', 'assigned_assessments', 'batch'
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

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = ['id', 'type', 'description', 'amount']

class BillSerializer(serializers.ModelSerializer):
    expenses = ExpenseSerializer(many=True)
    trainer_name = serializers.CharField(source='trainer.get_full_name', read_only=True)

    class Meta:
        model = Bill
        fields = ['id', 'trainer', 'trainer_name', 'date', 'status', 'invoice_number', 'expenses']
    
    def create(self, validated_data):
        expenses_data = validated_data.pop('expenses')
        with transaction.atomic():
            bill = Bill.objects.create(**validated_data)
            for expense_data in expenses_data:
                Expense.objects.create(bill=bill, **expense_data)
        return bill
    
class AssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assessment
        fields = '__all__'

class StudentAttemptSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    assessment_title = serializers.CharField(source='assessment.title', read_only=True)
    course = serializers.CharField(source='assessment.course', read_only=True)

    class Meta:
        model = StudentAttempt
        fields = ['id', 'student', 'student_name', 'assessment', 'assessment_title', 'course', 'score', 'timestamp']

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = '__all__'

class BatchSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    student_count = serializers.IntegerField(source='students.count', read_only=True)
    
    class Meta:
        model = Batch
        fields = ['id', 'course', 'course_name', 'name', 'start_date', 'end_date', 'student_count']