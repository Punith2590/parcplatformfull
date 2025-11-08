# backend/core/serializers.py

import os
from rest_framework import serializers
from .models import (
    Batch, Module, StudentAttempt, User, College, Material, Schedule,
    TrainerApplication, EmployeeApplication, Task, # <-- Added EmployeeApplication, Task
    Expense, Bill, Assessment, Course, EmployeeDocument, EducationEntry, 
    WorkExperienceEntry, Certification
)
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.db import IntegrityError, transaction
from django.utils import timezone
from .utils import send_student_credentials, send_employee_credentials # <-- Added send_employee_credentials
import secrets

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['role'] = user.role
        token['user_id'] = user.id
        token['name'] = user.get_full_name
        token['must_change_password'] = user.must_change_password

        # Add role-specific data if needed in the token payload
        if user.role == 'STUDENT':
            user_batches = user.batches.all().select_related('course')
            token['batches'] = [b.id for b in user_batches]
            token['courses'] = list(set([b.course.name for b in user_batches]))
        # Add EMPLOYEE specific token data if necessary later
        # elif user.role == 'EMPLOYEE':
        #     token['department'] = user.department

        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user

        if not user.is_active:
            raise serializers.ValidationError("Your account is inactive. Please contact an administrator.")

        # Keep existing TRAINER validation
        if user.role == 'TRAINER':
            if user.access_expiry_date and user.access_expiry_date < timezone.now():
                user.is_active = False
                user.save()
                raise serializers.ValidationError("Your access period has expired. Please contact an administrator to be assigned to a new schedule.")
        # Add EMPLOYEE specific validation if needed later

        return data
    
class EducationEntrySerializer(serializers.ModelSerializer):
    # --- ADD THESE TWO LINES ---
    marksheet_url = serializers.SerializerMethodField()
    filename = serializers.SerializerMethodField()

    class Meta:
        model = EducationEntry
        fields = [
            'id', 'employee', 'title', 'institute', 'location', 
            'start_date', 'end_date', 'currently_ongoing', 
            'website', 'academic_performance',
            # --- ADD THESE THREE FIELDS ---
            'marksheet_file', 
            'marksheet_url',
            'filename'
        ]
        read_only_fields = ['employee', 'marksheet_url', 'filename']
        # --- ADD EXTRA_KWARGS ---
        extra_kwargs = {
            'marksheet_file': {'write_only': True, 'required': False} # File is optional
        }

    # --- ADD THESE TWO METHODS ---
    def get_marksheet_url(self, obj):
        request = self.context.get('request')
        if obj.marksheet_file and request:
            try:
                from django.urls import reverse
                # This 'view-marksheet' action needs to be created in the ViewSet
                url = reverse('education-entry-view-marksheet', kwargs={'pk': obj.pk})
                return request.build_absolute_uri(url)
            except Exception:
                if obj.marksheet_file.url:
                    return request.build_absolute_uri(obj.marksheet_file.url)
        return None

    def get_filename(self, obj):
        if obj.marksheet_file:
            return os.path.basename(obj.marksheet_file.name)
        return None

class WorkExperienceEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkExperienceEntry
        fields = [
            'id', 'employee', 'title', 'institute', 'location', 'website',
            'start_date', 'end_date', 'currently_ongoing', 'description'
        ]
        read_only_fields = ['employee']

class CertificationSerializer(serializers.ModelSerializer):
    certificate_url = serializers.SerializerMethodField()
    filename = serializers.SerializerMethodField()
    
    class Meta:
        model = Certification
        fields = [
            'id', 'employee', 'title', 'institute', 'location', 'website',
            'start_date', 'end_date', 'currently_ongoing', 'description',
            'certificate_file', 'certificate_url', 'filename' # Added file fields
        ]
        read_only_fields = ['employee', 'certificate_url', 'filename']
        extra_kwargs = {
            'certificate_file': {'write_only': True, 'required': False} # File is optional
        }

    def get_certificate_url(self, obj):
        request = self.context.get('request')
        if obj.certificate_file and request:
            try:
                from django.urls import reverse
                # We will create this view action in views.py
                url = reverse('certification-view-certificate', kwargs={'pk': obj.pk})
                return request.build_absolute_uri(url)
            except Exception:
                if obj.certificate_file.url:
                    return request.build_absolute_uri(obj.certificate_file.url)
        return None

    def get_filename(self, obj):
        if obj.certificate_file:
            return os.path.basename(obj.certificate_file.name)
        return None

class UserSerializer(serializers.ModelSerializer):
    name = serializers.CharField(write_only=True, required=True)
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    username = serializers.CharField(read_only=True)
    batches = serializers.PrimaryKeyRelatedField(
        queryset=Batch.objects.all(), many=True, required=False
    )
    # Add department field if applicable for reading/writing
    department = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    bio = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    education_entries = EducationEntrySerializer(many=True, read_only=True)
    work_experience_entries = WorkExperienceEntrySerializer(many=True, read_only=True)
    certification_entries = CertificationSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'role', 'expertise', 'experience', # Trainer fields
            'phone', 'access_expiry_date', # Trainer field
            'assigned_materials', 'assigned_assessments', 'batches', # Student fields
            'department', 'bio', 'education_entries', 'work_experience_entries', 'certification_entries',
            'name', 'full_name', 'resume', 'must_change_password'
        )
        extra_kwargs = {
            'email': {'required': True},
            # Make trainer/student fields not required by default if creating Employee/Admin
            'expertise': {'required': False, 'allow_blank': True, 'allow_null': True},
            'experience': {'required': False, 'allow_null': True},
            'batches': {'required': False},
            'bio': {'required': False, 'allow_blank': True, 'allow_null': True},
            'assigned_materials': {'read_only': True}, # Usually assigned via specific actions
            'assigned_assessments': {'read_only': True}, # Usually assigned via specific actions
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

        # Send credentials based on role
        if role == 'STUDENT':
            user.must_change_password = True
            user.save(update_fields=['must_change_password'])
            send_student_credentials(user, password)
        elif role == 'EMPLOYEE':
            user.must_change_password = True
            user.save(update_fields=['must_change_password'])
            send_employee_credentials(user, password) # <-- Use new util function
        # Trainers get credentials upon schedule assignment

        # Assign batches only if role is STUDENT
        if role == 'STUDENT' and batches_data:
            user.batches.set(batches_data)

        return user

class EmployeeApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeApplication
        fields = '__all__'


class TaskSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)

    class Meta:
        model = Task
        fields = ['id', 'employee', 'employee_name', 'title', 'description', 'status', 'due_date', 'created_at', 'updated_at']
        read_only_fields = ['employee', 'employee_name', 'created_at', 'updated_at'] # Employee set automatically

    def validate_employee(self, value):
        # This shouldn't be needed if employee is set in perform_create, but good for safety
        if value.role != 'EMPLOYEE':
            raise serializers.ValidationError("Tasks can only be assigned to users with the EMPLOYEE role.")
        return value

class EmployeeDocumentSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    # Provide the URL for the document field
    document_url = serializers.SerializerMethodField()
    filename = serializers.SerializerMethodField()

    class Meta:
        model = EmployeeDocument
        fields = [
            'id', 'employee', 'employee_name', 'title',
            'document', 'document_url', 'filename', # Include new fields
            'uploaded_at'
        ]
        read_only_fields = ['employee', 'employee_name', 'uploaded_at', 'document_url', 'filename']
        # Make document write-only for creation/update, URL read-only for retrieval
        extra_kwargs = {
            'document': {'write_only': True, 'required': True}
        }

    def get_document_url(self, obj):
        request = self.context.get('request')
        if obj.document and request:
            # Use the custom view action URL
            try:
                # Dynamically get the URL from the 'employee-document-view-document' route
                from django.urls import reverse
                url = reverse('employee-document-view-document', kwargs={'pk': obj.pk})
                return request.build_absolute_uri(url)
            except Exception as e:
                # Fallback to direct media URL (less secure, but works if view action fails)
                if obj.document.url:
                    return request.build_absolute_uri(obj.document.url)
        return None

    def get_filename(self, obj):
        if obj.document:
            return os.path.basename(obj.document.name)
        return None


class MaterialSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    uploader = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Material
        fields = ['id', 'title', 'course', 'course_name', 'type', 'content', 'uploader', 'duration_in_minutes']
        extra_kwargs = {
            'course': {'required': True, 'allow_null': True} # Allow null temporarily if needed? Check logic.
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
    college_name = serializers.CharField(source='college.name', read_only=True, allow_null=True)
    student_count = serializers.IntegerField(source='students.count', read_only=True)

    class Meta:
        model = Batch
        fields = ['id', 'course', 'course_name', 'college', 'college_name', 'name', 'start_date', 'end_date', 'student_count']