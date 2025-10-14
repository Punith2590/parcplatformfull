# backend/core/serializers.py

from rest_framework import serializers
from .models import Batch, Module, StudentAttempt, User, College, Material, Schedule, TrainerApplication, Expense, Bill, Assessment, Course
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.db import IntegrityError, transaction
from django.utils import timezone
from .utils import send_student_credentials
import secrets

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['role'] = user.role
        token['name'] = user.get_full_name
        token['must_change_password'] = user.must_change_password
        
        if user.role == 'STUDENT':
            user_batches = user.batches.all().select_related('course')
            token['batches'] = [b.id for b in user_batches]
            token['courses'] = list(set([b.course.name for b in user_batches]))
        else:
            token['courses'] = [] 
            token['batches'] = []

        return token
    
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user

        if not user.is_active:
            raise serializers.ValidationError("Your account is inactive. Please contact an administrator.")

        if user.role == 'TRAINER':
            if user.access_expiry_date and user.access_expiry_date < timezone.now():
                user.is_active = False
                user.save()
                raise serializers.ValidationError("Your access period has expired. Please contact an administrator to be assigned to a new schedule.")

        return data

class UserSerializer(serializers.ModelSerializer):
    name = serializers.CharField(write_only=True, required=True)
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    username = serializers.CharField(read_only=True)
    batches = serializers.PrimaryKeyRelatedField(
        queryset=Batch.objects.all(), many=True, required=False
    )

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'role', 'expertise', 'experience',
            'phone', 'access_expiry_date',
            'assigned_materials', 'name', 'full_name', 'resume', 
            'assigned_assessments', 'batches', 'must_change_password'
        )
        extra_kwargs = {
            'email': {'required': True},
        }

    def create(self, validated_data):
        batches_data = validated_data.pop('batches', None)
        full_name = validated_data.pop('name')
        email = validated_data.pop('email')
        role = validated_data.get('role')
        name_parts = full_name.split(" ", 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""
        
        password = secrets.token_urlsafe(8)
        
        try:
            user = User.objects.create_user(
                username=email, email=email, password=password,
                first_name=first_name, last_name=last_name,
                **validated_data
            )
        except IntegrityError:
            raise serializers.ValidationError({'email': ['A user with this email already exists.']})

        if role == 'STUDENT':
            user.must_change_password = True
            user.save()
            send_student_credentials(user, password)

        if batches_data:
            user.batches.set(batches_data)
        
        return user

class MaterialSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    uploader = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Material
        fields = ['id', 'title', 'course', 'course_name', 'type', 'content', 'uploader', 'duration_in_minutes']
        extra_kwargs = {
            'course': {'required': True}
        }

class ModuleSerializer(serializers.ModelSerializer):
    materials = MaterialSerializer(many=True, read_only=True)
    material_ids = serializers.PrimaryKeyRelatedField(
        queryset=Material.objects.all(), many=True, write_only=True, source='materials', required=False
    )

    class Meta:
        model = Module
        fields = ['id', 'course', 'module_number', 'title', 'materials', 'material_ids']

class CourseSerializer(serializers.ModelSerializer):
    modules = ModuleSerializer(many=True, read_only=True)
    
    class Meta:
        model = Course
        fields = ['id', 'name', 'description', 'modules', 'cover_photo']

class CollegeSerializer(serializers.ModelSerializer):
    courses = CourseSerializer(many=True, read_only=True)

    class Meta:
        model = College
        fields = '__all__'

class ScheduleSerializer(serializers.ModelSerializer):
    trainer_name = serializers.CharField(source='trainer.get_full_name', read_only=True)
    batch_name = serializers.CharField(source='batch.name', read_only=True)
    course_name = serializers.CharField(source='batch.course.name', read_only=True)
    college_name = serializers.CharField(source='batch.college.name', read_only=True)
    materials = MaterialSerializer(many=True, read_only=True)
    material_ids = serializers.PrimaryKeyRelatedField(
        queryset=Material.objects.all(),
        many=True,
        write_only=True,
        source='materials',
        required=False
    )

    class Meta:
        model = Schedule
        fields = [
            'id', 'trainer', 'trainer_name', 'batch', 'batch_name', 'course_name', 'college_name', 
            'start_date', 'end_date', 'materials', 'material_ids'
        ]

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

class BatchSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    college_name = serializers.CharField(source='college.name', read_only=True)
    student_count = serializers.IntegerField(source='students.count', read_only=True)
    
    class Meta:
        model = Batch
        fields = ['id', 'course', 'course_name', 'college', 'college_name', 'name', 'start_date', 'end_date', 'student_count']