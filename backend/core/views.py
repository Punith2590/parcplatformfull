# backend/core/views.py

from django.http import FileResponse, HttpResponse, Http404
from django.core.mail import send_mail
from django.utils import timezone
from django.db.models import Sum, Q
from rest_framework import viewsets, status, permissions # <-- Added permissions
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied
from django.core.exceptions import ValidationError
from .models import (
    User, College, Material, Schedule, TrainerApplication, Bill,
    Assessment, StudentAttempt, Course, Batch, Module,
    EmployeeApplication, Task, EmployeeDocument, EducationEntry, 
    WorkExperienceEntry, Certification
)
from .serializers import (
    UserSerializer, CollegeSerializer, MaterialSerializer,
    ScheduleSerializer, MyTokenObtainPairSerializer, TrainerApplicationSerializer,
    BillSerializer, AssessmentSerializer, StudentAttemptSerializer, CourseSerializer, BatchSerializer, ModuleSerializer,
    EmployeeApplicationSerializer, TaskSerializer, EmployeeDocumentSerializer, EducationEntrySerializer, 
    WorkExperienceEntrySerializer, CertificationSerializer
)
import secrets, os
from rest_framework_simplejwt.views import TokenObtainPairView
import pandas as pd
from django.db import IntegrityError, transaction
from .utils import send_student_credentials, send_employee_credentials
import mimetypes

# --- Token and Password Views (Unchanged) ---
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

class SetPasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        password = request.data.get("password")
        if not password or len(password) < 8:
            return Response({"error": "Password must be at least 8 characters long."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(password)
        user.must_change_password = False
        user.save()
        return Response({"status": "Password set successfully. Please log in again."}, status=status.HTTP_200_OK)

# --- Trainer Application ViewSet (Unchanged, but ensure email content is appropriate) ---
class TrainerApplicationViewSet(viewsets.ModelViewSet):
    queryset = TrainerApplication.objects.filter(status='PENDING')
    serializer_class = TrainerApplicationSerializer
    # AllowAny for creation, IsAuthenticated for approval/decline/resume view
    def get_permissions(self):
        if self.action in ['approve', 'decline', 'view_resume']:
            return [IsAuthenticated()]
        return [AllowAny()]

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def approve(self, request, pk=None):
        application = self.get_object()
        user, created = User.objects.get_or_create(
            username=application.email,
            defaults={
                'first_name': application.name.split(' ')[0],
                'last_name': ' '.join(application.name.split(' ')[1:]),
                'email': application.email,
                'phone': application.phone,
                'expertise': application.expertise_domains, # For Trainer
                'experience': application.experience,       # For Trainer
                'role': 'TRAINER',                           # Set Role
                'is_active': False, # Trainers activated upon scheduling
                'resume': application.resume,
                # Trainers will receive credentials when assigned a schedule. We do not force them to change
                # the temporary password on first login so they can access the system until their access expires.
                'must_change_password': False
            }
        )

        if not created:
            # If user exists but is not a TRAINER, maybe update role? Or reject?
            # Current logic: Reject if user already exists.
            return Response({'error': 'A user with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        application.status = 'APPROVED'
        application.save()

        # No automatic credential email here - it's sent upon first schedule assignment for trainers

        send_mail(
            'Your Trainer Application has been Approved!',
            f'Hi {user.first_name},\n\nCongratulations! Your application to become a trainer at Parc Platform has been approved. '
            'You will receive another email with your login credentials once you have been assigned to your first schedule.\n\n'
            'Best regards,\nThe Parc Platform Team',
            'admin@parcplatform.com', # Use settings.EMAIL_HOST_USER
            [user.email],
            fail_silently=False,
        )

        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def decline(self, request, pk=None):
        application = self.get_object()
        send_mail(
            'Update on Your Parc Platform Trainer Application',
            f'Hi {application.name},\n\nThank you for your interest in becoming a trainer. '
            'After careful consideration, we have decided not to move forward with your application at this time.\n\n'
            'We wish you the best in your future endeavors.\n\n'
            'Best regards,\nThe Parc Platform Team',
            'admin@parcplatform.com', # Use settings.EMAIL_HOST_USER
            [application.email],
            fail_silently=False,
        )
        application.delete()
        return Response({'status': 'Trainer application declined and deleted'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def view_resume(self, request, pk=None):
        application = self.get_object()
        if hasattr(application, 'resume') and application.resume:
            try:
                # Security: Ensure only Admins can view resumes here
                if request.user.role != 'ADMIN' and not request.user.is_staff:
                    raise PermissionDenied("You do not have permission to view this resume.")

                with application.resume.open('rb') as f:
                    resume_data = f.read()
                content_type, _ = mimetypes.guess_type(application.resume.name)
                content_type = content_type or 'application/octet-stream'
                return HttpResponse(resume_data, content_type=content_type)
            except FileNotFoundError:
                return Response({'error': 'Resume file not found on server.'}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({'error': 'Resume not found for this application.'}, status=status.HTTP_404_NOT_FOUND)


# --- NEW Employee Application ViewSet ---
class EmployeeApplicationViewSet(viewsets.ModelViewSet):
    queryset = EmployeeApplication.objects.filter(status='PENDING')
    serializer_class = EmployeeApplicationSerializer

    # AllowAny for creation, IsAuthenticated for admin actions
    def get_permissions(self):
        if self.action in ['approve', 'decline', 'view_resume', 'list', 'retrieve']:
             # Only Admin should list/retrieve pending applications
            return [IsAuthenticated()] # Further restrict to Admin if needed
        return [AllowAny()] # For creating application

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated]) # Add Admin permission check later if needed
    def approve(self, request, pk=None):
        # Add permission check: Only Admin
        if request.user.role != 'ADMIN' and not request.user.is_staff:
             raise PermissionDenied("Only Admins can approve employee applications.")

        application = self.get_object()
        user, created = User.objects.get_or_create(
            username=application.email,
            defaults={
                'first_name': application.name.split(' ')[0],
                'last_name': ' '.join(application.name.split(' ')[1:]),
                'email': application.email,
                'phone': application.phone,
                'department': application.department, # For Employee
                'role': 'EMPLOYEE',                  # Set Role
                'is_active': True,                   # Employees are active immediately
                'resume': application.resume,
                'must_change_password': True         # Employees must change password
            }
        )

        if not created:
            return Response({'error': 'A user with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        # Generate password and send credentials
        password = secrets.token_urlsafe(8)
        user.set_password(password)
        user.save()
        send_employee_credentials(user, password) # Use the specific util function

        application.status = 'APPROVED'
        application.save()

        # Send separate approval confirmation email (optional)
        send_mail(
            'Your Employee Application has been Approved!',
            f'Hi {user.first_name},\n\nCongratulations! Your application to become an employee at Parc Platform has been approved. '
            'You should receive another email shortly with your temporary login credentials.\n\n'
            'Best regards,\nThe Parc Platform Team',
            'admin@parcplatform.com', # Use settings.EMAIL_HOST_USER
            [user.email],
            fail_silently=False,
        )

        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated]) # Add Admin permission check later if needed
    def decline(self, request, pk=None):
        # Add permission check: Only Admin
        if request.user.role != 'ADMIN' and not request.user.is_staff:
             raise PermissionDenied("Only Admins can decline employee applications.")

        application = self.get_object()
        send_mail(
            'Update on Your Parc Platform Employee Application',
            f'Hi {application.name},\n\nThank you for your interest in joining Parc Platform. '
            'After careful consideration, we have decided not to move forward with your application at this time.\n\n'
            'We wish you the best in your future endeavors.\n\n'
            'Best regards,\nThe Parc Platform Team',
            'admin@parcplatform.com', # Use settings.EMAIL_HOST_USER
            [application.email],
            fail_silently=False,
        )
        application.delete()
        return Response({'status': 'Employee application declined and deleted'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated]) # Add Admin permission check later if needed
    def view_resume(self, request, pk=None):
        # Add permission check: Only Admin
        if request.user.role != 'ADMIN' and not request.user.is_staff:
             raise PermissionDenied("Only Admins can view employee application resumes.")

        application = self.get_object()
        if hasattr(application, 'resume') and application.resume:
            try:
                with application.resume.open('rb') as f:
                    resume_data = f.read()
                content_type, _ = mimetypes.guess_type(application.resume.name)
                content_type = content_type or 'application/octet-stream'
                return HttpResponse(resume_data, content_type=content_type)
            except FileNotFoundError:
                return Response({'error': 'Resume file not found on server.'}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({'error': 'Resume not found for this application.'}, status=status.HTTP_404_NOT_FOUND)


class UserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated] # Base permission
    queryset = User.objects.all()
    serializer_class = UserSerializer
      
    def get_serializer_context(self):
        # Pass request to serializer context (useful for UserSerializer if it needs it)
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

    def perform_update(self, serializer):
        user = self.request.user
        instance = self.get_object()

        if user.role == 'ADMIN' or user.is_staff or instance.id == user.id:
            if (user.role != 'ADMIN' and not user.is_staff) and 'role' in serializer.validated_data:
                if serializer.validated_data['role'] != instance.role:
                    raise PermissionDenied("You do not have permission to change your role.")
            
            full_name = serializer.validated_data.pop('name', None)
            if full_name:
                name_parts = full_name.split(" ", 1)
                serializer.validated_data['first_name'] = name_parts[0]
                serializer.validated_data['last_name'] = name_parts[1] if len(name_parts) > 1 else ""

            serializer.save()
        else:
            raise PermissionDenied("You do not have permission to update this user.")

    @action(detail=True, methods=['get'])
    def view_resume(self, request, pk=None):
        user_obj = self.get_object() # Renamed to avoid conflict

        # Allow user to view their own resume, or Admin to view any
        if request.user != user_obj and request.user.role != 'ADMIN' and not request.user.is_staff:
            raise PermissionDenied("You do not have permission to view this resume.")

        if hasattr(user_obj, 'resume') and user_obj.resume:
            try:
                with user_obj.resume.open('rb') as f:
                    resume_data = f.read()
                content_type, _ = mimetypes.guess_type(user_obj.resume.name)
                content_type = content_type or 'application/octet-stream'
                return HttpResponse(resume_data, content_type=content_type)
            except FileNotFoundError:
                return Response({'error': 'Resume file not found on server.'}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({'error': 'Resume not found for this user.'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def assign_materials(self, request, pk=None):
        # Same as before
        user = self.get_object()
        if user.role != 'STUDENT':
            return Response({'error': 'Can only assign materials to students.'}, status=status.HTTP_400_BAD_REQUEST)
        material_ids = request.data.get('material_ids', [])
        materials = Material.objects.filter(id__in=material_ids)
        if len(materials) != len(material_ids):
            invalid_ids = set(material_ids) - set(m.id for m in materials)
            return Response({'error': f'Invalid material IDs: {list(invalid_ids)}'}, status=status.HTTP_400_BAD_REQUEST)
        user.assigned_materials.set(materials)
        # No need for user.save() when using set() on ManyToManyField
        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN' or user.is_staff:
            return Task.objects.all().select_related('employee').order_by('-updated_at')
        elif user.role == 'EMPLOYEE':
            return Task.objects.filter(employee=user).order_by('-updated_at')
        else:
            return Task.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'EMPLOYEE':
            # Employees create tasks for themselves
            serializer.save(employee=user)
        # --- MODIFICATION START ---
        elif user.role == 'ADMIN' or user.is_staff:
            # Admins create tasks FOR a specified employee
            employee_id = self.request.data.get('employee') # Get employee ID from request data
            if not employee_id:
                raise serializer.ValidationError({"employee": "Admin must specify an employee ID when creating a task."})
            try:
                # Validate that the provided ID is for an actual employee
                employee = User.objects.get(id=employee_id, role='EMPLOYEE')
                serializer.save(employee=employee) # Save with the specified employee
            except User.DoesNotExist:
                raise serializer.ValidationError({"employee": "Specified user does not exist or is not an employee."})
            except ValueError:
                 raise serializer.ValidationError({"employee": "Invalid employee ID format."})
        # --- MODIFICATION END ---
        else:
            # Other roles cannot create tasks
            raise PermissionDenied("You do not have permission to create tasks.")

    def perform_update(self, serializer):
        task = self.get_object()
        user = self.request.user
        if task.employee == user or user.role == 'ADMIN' or user.is_staff:
            if 'employee' in serializer.validated_data and serializer.validated_data['employee'] != task.employee:
                 raise serializers.ValidationError("Cannot change the assigned employee of a task.")
            serializer.save()
        else:
            raise PermissionDenied("You do not have permission to update this task.")

    def perform_destroy(self, instance):
        user = self.request.user
        # Allow employee to delete their own task, or Admin to delete any
        if instance.employee == user or user.role == 'ADMIN' or user.is_staff:
            instance.delete()
        else:
            raise PermissionDenied("You do not have permission to delete this task.")
        
class EmployeeDocumentViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeDocumentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser) # For file upload

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN' or user.is_staff:
            # Admins can see all documents
            return EmployeeDocument.objects.all().select_related('employee')
        elif user.role == 'EMPLOYEE':
            # Employees can only see their own documents
            return EmployeeDocument.objects.filter(employee=user)
        else:
            # Other roles see nothing
            return EmployeeDocument.objects.none()

    def get_serializer_context(self):
        # Pass request to serializer context
        # This is needed for the SerializerMethodField (document_url)
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'EMPLOYEE':
            # Employees can only upload documents for themselves
            serializer.save(employee=user)
        else:
            # Admins cannot (currently) upload documents *for* employees
            # This could be changed if needed
            raise PermissionDenied("Only employees can upload documents to their own profile.")

    def perform_destroy(self, instance):
        user = self.request.user
        # Allow employee to delete their own document, or Admin to delete any
        if instance.employee == user or user.role == 'ADMIN' or user.is_staff:
            # Delete the actual file from storage
            if instance.document:
                instance.document.delete(save=False) # Delete file, don't save model yet
            instance.delete() # Delete the model instance
        else:
            raise PermissionDenied("You do not have permission to delete this document.")

    @action(detail=True, methods=['get'])
    def view_document(self, request, pk=None):
        doc = self.get_object() # get_object() respects get_queryset() permissions for Employees
        user = request.user

        # Admin check (get_queryset already filtered for Employee, but Admin needs access to all)
        if user.role == 'ADMIN' or user.is_staff:
            pass # Admin allowed
        elif doc.employee != user:
             # This check is redundant if get_queryset is working, but good for safety
             raise PermissionDenied("You do not have permission to view this document.")

        file_field = doc.document
        if not file_field:
             return Response({'detail': 'No file found for this document.'}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            f = file_field.open('rb')
            content_type, _ = mimetypes.guess_type(file_field.name)
            content_type = content_type or 'application/octet-stream'
            # Use 'inline' to try opening in browser, 'attachment' to force download
            response = FileResponse(f, content_type=content_type)
            response['Content-Disposition'] = f'inline; filename="{os.path.basename(file_field.name)}"'
            return response
        except FileNotFoundError:
             return Response({'detail': 'File not found on server.'}, status=status.HTTP_404_NOT_FOUND)
        
class EducationEntryViewSet(viewsets.ModelViewSet):
    serializer_class = EducationEntrySerializer
    permission_classes = [IsAuthenticated]
    # --- ADD THIS LINE ---
    parser_classes = (MultiPartParser, FormParser) # For file upload

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN' or user.is_staff:
            # Admins can see all education entries (e.g., for user management)
            return EducationEntry.objects.all().select_related('employee')
        elif user.role == 'EMPLOYEE':
            # Employees see only their own
            return EducationEntry.objects.filter(employee=user)
        return EducationEntry.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'EMPLOYEE':
            serializer.save(employee=user)
        else:
            # Admins could potentially create entries *for* employees
            # For now, let's restrict creation to employees themselves
            raise PermissionDenied("Only employees can add education entries to their own profile.")

    def perform_update(self, serializer):
        entry = self.get_object()
        user = self.request.user
        # Allow employee to update their own entry, or Admin to update any
        if entry.employee == user or user.role == 'ADMIN' or user.is_staff:
            serializer.save()
        else:
            raise PermissionDenied("You do not have permission to update this entry.")

    def perform_destroy(self, instance):
        user = self.request.user
        # Allow employee to delete their own entry, or Admin to delete any
        if instance.employee == user or user.role == 'ADMIN' or user.is_staff:
            # --- ADDED: Delete the file from storage ---
            if instance.marksheet_file:
                instance.marksheet_file.delete(save=False)
            # --- END ADD ---
            instance.delete()
        else:
            raise PermissionDenied("You do not have permission to delete this document.")

    # --- ADD THIS NEW ACTION ---
    @action(detail=True, methods=['get'])
    def view_marksheet(self, request, pk=None):
        doc = self.get_object()
        user = request.user
        
        # Check permissions
        if not (user.role == 'ADMIN' or user.is_staff or doc.employee == user):
             raise PermissionDenied("You do not have permission to view this marksheet.")
        
        file_field = doc.marksheet_file
        if not file_field:
             return Response({'detail': 'No marksheet file found for this entry.'}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            f = file_field.open('rb')
            content_type, _ = mimetypes.guess_type(file_field.name)
            content_type = content_type or 'application/octet-stream'
            response = FileResponse(f, content_type=content_type)
            response['Content-Disposition'] = f'inline; filename="{os.path.basename(file_field.name)}"'
            return response
        except FileNotFoundError:
             return Response({'detail': 'File not found on server.'}, status=status.HTTP_404_NOT_FOUND)
    # --- END ADD ---

class WorkExperienceEntryViewSet(viewsets.ModelViewSet):
    serializer_class = WorkExperienceEntrySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN' or user.is_staff:
            return WorkExperienceEntry.objects.all().select_related('employee')
        elif user.role == 'EMPLOYEE':
            return WorkExperienceEntry.objects.filter(employee=user)
        return WorkExperienceEntry.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'EMPLOYEE':
            serializer.save(employee=user)
        else:
            raise PermissionDenied("Only employees can add work experience to their own profile.")

    def perform_update(self, serializer):
        entry = self.get_object()
        user = self.request.user
        if entry.employee == user or user.role == 'ADMIN' or user.is_staff:
            serializer.save()
        else:
            raise PermissionDenied("You do not have permission to update this entry.")

    def perform_destroy(self, instance):
        user = self.request.user
        if instance.employee == user or user.role == 'ADMIN' or user.is_staff:
            instance.delete()
        else:
            raise PermissionDenied("You do not have permission to delete this entry.")

class CertificationViewSet(viewsets.ModelViewSet):
    serializer_class = CertificationSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser) # For file upload

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN' or user.is_staff:
            return Certification.objects.all().select_related('employee')
        elif user.role == 'EMPLOYEE':
            return Certification.objects.filter(employee=user)
        return Certification.objects.none()
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'EMPLOYEE':
            serializer.save(employee=user)
        else:
            raise PermissionDenied("Only employees can add certifications to their own profile.")

    def perform_update(self, serializer):
        entry = self.get_object()
        user = self.request.user
        if entry.employee == user or user.role == 'ADMIN' or user.is_staff:
            serializer.save()
        else:
            raise PermissionDenied("You do not have permission to update this entry.")

    def perform_destroy(self, instance):
        user = self.request.user
        if instance.employee == user or user.role == 'ADMIN' or user.is_staff:
            # Delete the associated file from storage
            if instance.certificate_file:
                instance.certificate_file.delete(save=False)
            instance.delete()
        else:
            raise PermissionDenied("You do not have permission to delete this entry.")

    @action(detail=True, methods=['get'])
    def view_certificate(self, request, pk=None):
        doc = self.get_object()
        user = request.user
        
        if not (user.role == 'ADMIN' or user.is_staff or doc.employee == user):
             raise PermissionDenied("You do not have permission to view this certificate.")
        
        file_field = doc.certificate_file
        if not file_field:
             return Response({'detail': 'No file found for this certificate.'}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            response = FileResponse(file_field.open('rb'), as_attachment=False)
            response['Content-Disposition'] = f'inline; filename="{os.path.basename(file_field.name)}"'
            return response
        except FileNotFoundError:
             return Response({'detail': 'File not found on server.'}, status=status.HTTP_404_NOT_FOUND)

class CollegeViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = College.objects.all()
    serializer_class = CollegeSerializer

    @action(detail=True, methods=['post'])
    def manage_courses(self, request, pk=None):
        # Add Admin check if needed
        college = self.get_object()
        course_ids = request.data.get('course_ids', [])
        courses_to_set = Course.objects.filter(id__in=course_ids)
        college.courses.set(courses_to_set)
        return Response(self.get_serializer(college).data, status=status.HTTP_200_OK)

class MaterialViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = MaterialSerializer
    parser_classes = (MultiPartParser, FormParser)
    queryset = Material.objects.all()

    @action(detail=True, methods=['get'])
    def view_content(self, request, pk=None):
        material = self.get_object()
        user = request.user
        allowed = False
        role = getattr(user, 'role', None)

        # Admin/Staff access
        if role == 'ADMIN' or user.is_staff:
            allowed = True
        # Trainer access
        elif role == 'TRAINER':
            # Own uploads or public materials
            if material.uploader_id == user.id or material.uploader_id is None:
                allowed = True
            # Materials linked via current/future schedules
            else:
                allowed = Schedule.objects.filter(
                    trainer=user,
                    materials__id=material.id,
                    end_date__gte=timezone.now() # Check if schedule is active/upcoming
                ).exists()
        # Student access
        elif role == 'STUDENT':
             # Directly assigned materials
            if user.assigned_materials.filter(id=material.id).exists():
                 allowed = True
             # Materials linked via Modules in their enrolled Courses (check batches)
            elif material.course_id is not None:
                 allowed = user.batches.filter(course_id=material.course_id).exists()

        if not allowed:
            return Response({'detail': 'You do not have permission to view this material.'}, status=status.HTTP_403_FORBIDDEN)

        file_field = material.content
        if not file_field:
            return Response({'detail': 'No content found for this material.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            f = file_field.open('rb')
            content_type, _ = mimetypes.guess_type(file_field.name)
            content_type = content_type or 'application/octet-stream'
            response = FileResponse(f, content_type=content_type)
             # Use inline for browser viewing, attachment for download prompt
            response['Content-Disposition'] = f'inline; filename="{file_field.name.rsplit("/", 1)[-1]}"'
            return response
        except FileNotFoundError:
             return Response({'detail': 'File not found on server.'}, status=status.HTTP_404_NOT_FOUND)


    def perform_create(self, serializer):
        # Allow Admin or Trainer to upload
        user = self.request.user
        if user.role == 'TRAINER':
            serializer.save(uploader=user)
        elif user.role == 'ADMIN' or user.is_staff:
             # Admins create 'public' materials unless explicitly assigned later
             # Or maybe Admins should also be set as uploader? Decide based on requirements.
            serializer.save(uploader=None) # Default: Admin uploads are public
        else:
            raise PermissionDenied("Only Admins or Trainers can upload materials.")


    def perform_update(self, serializer):
        material = self.get_object()
        user = self.request.user
        # Allow uploader or Admin to edit
        if material.uploader == user or user.role == 'ADMIN' or user.is_staff:
            serializer.save()
        else:
            raise PermissionDenied("You do not have permission to edit this material.")

    def perform_destroy(self, instance):
        user = self.request.user
         # Allow uploader or Admin to delete
        if instance.uploader == user or user.role == 'ADMIN' or user.is_staff:
            instance.delete()
        else:
            raise PermissionDenied("You do not have permission to delete this material.")

class CourseViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated] # Or IsAdminUser if only admins manage courses
    queryset = Course.objects.all().prefetch_related('modules__materials')
    serializer_class = CourseSerializer
    parser_classes = (MultiPartParser, FormParser) # For cover_photo upload

class ModuleViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated] # Or IsAdminUser
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer

class BatchViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated] # Or IsAdminUser
    queryset = Batch.objects.select_related('course', 'college').prefetch_related('students').all() # Optimize queries
    serializer_class = BatchSerializer

    def destroy(self, request, *args, **kwargs):
        # Existing logic is fine
        instance = self.get_object()
        try:
            self.perform_destroy(instance)
        except ValidationError as e:
            return Response({"error": e.messages}, status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_204_NO_CONTENT)

    # create_with_students - existing logic seems fine, assumes Admin creates
    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def create_with_students(self, request, *args, **kwargs):
        # Add Admin check if needed
        file_obj = request.FILES.get('file')
        course_id = request.data.get('course')
        college_id = request.data.get('college') # Should now be optional based on your model?
        batch_name = request.data.get('name')
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')

        if not all([file_obj, course_id, batch_name, start_date, end_date]): # college_id removed from check
            return Response({'error': 'Missing required fields (file, course, name, start_date, end_date).'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            course = Course.objects.get(id=int(course_id))
            college = None
            if college_id: # Handle optional college
                 college = College.objects.get(id=int(college_id))

            batch = Batch.objects.create(
                course=course, college=college, name=batch_name,
                start_date=start_date, end_date=end_date
            )
        except (Course.DoesNotExist, College.DoesNotExist, IntegrityError) as e:
             # Handle unique_together constraint error specifically if needed
            return Response({'error': f'Failed to create batch: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        # Student processing remains the same
        try:
            df = pd.read_excel(file_obj) if file_obj.name.endswith(('.xls', '.xlsx')) else pd.read_csv(file_obj)
            users_to_add = []
            created_count = 0
            skipped_count = 0
            errors = []

            with transaction.atomic(): # Process students within a transaction
                for index, row in df.iterrows():
                    name, email = row.get('name'), row.get('email')
                    if not name or not email or not isinstance(email, str):
                        errors.append(f"Row {index+2}: Missing name or invalid email.")
                        skipped_count += 1
                        continue

                    email = email.strip().lower()
                    name = str(name).strip()

                    user, created = User.objects.get_or_create(
                        username=email,
                        defaults={
                            'email': email,
                            'first_name': name.split(" ", 1)[0],
                            'last_name': name.split(" ", 1)[1] if len(name.split(" ", 1)) > 1 else "",
                            'role': 'STUDENT',
                            'must_change_password': True
                        }
                    )
                    if created:
                        created_count += 1
                        password = secrets.token_urlsafe(8)
                        user.set_password(password)
                        user.save()
                        send_student_credentials(user, password) # Send credentials only for newly created users
                    elif user.role != 'STUDENT':
                         errors.append(f"Row {index+2}: Email {email} exists but is not a student.")
                         skipped_count += 1
                         continue # Don't add non-students

                    users_to_add.append(user)

                batch.students.add(*users_to_add)

            serializer = self.get_serializer(batch)
            response_data = serializer.data
            response_data['import_summary'] = {
                 'added_to_batch': len(users_to_add),
                 'newly_created': created_count,
                 'skipped': skipped_count,
                 'errors': errors
            }
            return Response(response_data, status=status.HTTP_201_CREATED)

        except Exception as e:
            # Clean up the created batch if student processing fails
            batch.delete()
            return Response({'error': f'File processing error: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    # add_students_from_file - existing logic seems fine
    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def add_students_from_file(self, request, pk=None):
         # Add Admin check if needed
        batch = self.get_object()
        file_obj = request.FILES.get('file')

        if not file_obj:
            return Response({'error': 'No file uploaded.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            df = pd.read_excel(file_obj) if file_obj.name.endswith(('.xls', '.xlsx')) else pd.read_csv(file_obj)
            users_to_add = []
            created_count = 0
            skipped_count = 0
            errors = []

            with transaction.atomic():
                for index, row in df.iterrows():
                    name, email = row.get('name'), row.get('email')
                    if not name or not email or not isinstance(email, str):
                        errors.append(f"Row {index+2}: Missing name or invalid email.")
                        skipped_count += 1
                        continue

                    email = email.strip().lower()
                    name = str(name).strip()

                    user, created = User.objects.get_or_create(
                        username=email,
                        defaults={
                            'email': email,
                            'first_name': name.split(" ", 1)[0],
                            'last_name': name.split(" ", 1)[1] if len(name.split(" ", 1)) > 1 else "",
                            'role': 'STUDENT',
                            'must_change_password': True
                        }
                    )
                    if created:
                        created_count += 1
                        password = secrets.token_urlsafe(8)
                        user.set_password(password)
                        user.save()
                        send_student_credentials(user, password)
                    elif user.role != 'STUDENT':
                         errors.append(f"Row {index+2}: Email {email} exists but is not a student.")
                         skipped_count += 1
                         continue

                    users_to_add.append(user)

                batch.students.add(*users_to_add)

            serializer = self.get_serializer(batch)
            response_data = serializer.data
            response_data['import_summary'] = {
                 'added_to_batch': len(users_to_add),
                 'newly_created': created_count,
                 'skipped': skipped_count,
                 'errors': errors
            }
            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': f'An error occurred during file processing: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    # add_students - existing logic seems fine
    @action(detail=True, methods=['post'])
    def add_students(self, request, pk=None):
        # Add Admin check if needed
        batch = self.get_object()
        student_ids = request.data.get('student_ids', [])

        students_to_add = User.objects.filter(id__in=student_ids, role='STUDENT')
        batch.students.add(*students_to_add)

        return Response(self.get_serializer(batch).data, status=status.HTTP_200_OK)

    # remove_students - existing logic seems fine
    @action(detail=True, methods=['post'])
    def remove_students(self, request, pk=None):
         # Add Admin check if needed
        batch = self.get_object()
        student_ids = request.data.get('student_ids', [])

        students_to_remove = User.objects.filter(id__in=student_ids)
        batch.students.remove(*students_to_remove)

        return Response(self.get_serializer(batch).data, status=status.HTTP_200_OK)

    # assign_materials - existing logic seems fine
    @action(detail=True, methods=['post'])
    def assign_materials(self, request, pk=None):
         # Add Admin or Trainer check if needed
        batch = self.get_object()
        material_ids = request.data.get('material_ids', [])

        try:
            materials_to_assign = Material.objects.filter(id__in=material_ids)
            if len(materials_to_assign) != len(material_ids):
                valid_ids = set(materials_to_assign.values_list('id', flat=True))
                invalid_ids = [mid for mid in material_ids if mid not in valid_ids]
                return Response({'error': f'Invalid material IDs provided: {invalid_ids}'}, status=status.HTTP_400_BAD_REQUEST)

            students_in_batch = batch.students.all()

            with transaction.atomic():
                for student in students_in_batch:
                    student.assigned_materials.add(*materials_to_assign)

            return Response({'status': f'Materials assigned to {students_in_batch.count()} students in batch {batch.name}.'}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ScheduleViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated] # Or IsAdminUser
    queryset = Schedule.objects.select_related('trainer', 'batch__course', 'batch__college').prefetch_related('materials').all() # Optimize
    serializer_class = ScheduleSerializer

    # _update_trainer_expiry_and_send_credentials - existing logic is fine
    def _update_trainer_expiry_and_send_credentials(self, trainer):
        # Prevent updates if trainer object is None (e.g., if deleted)
        if not trainer:
            return

        latest_schedule = Schedule.objects.filter(
            trainer=trainer,
            end_date__gte=timezone.now()
        ).order_by('-end_date').first()

        password_changed = False
        # Check if password needs reset (first login or inactive/expired)
        if trainer.must_change_password or not trainer.is_active or (trainer.access_expiry_date and trainer.access_expiry_date < timezone.now()):
            temp_password = secrets.token_urlsafe(8)
            trainer.set_password(temp_password)
            trainer.is_active = True
            # Do not force trainers to change their password when credentials are issued/reset.
            trainer.must_change_password = False
            password_changed = True

        if latest_schedule:
            new_expiry = latest_schedule.end_date
            # Only update if the new expiry is different or password changed requires saving
            if trainer.access_expiry_date != new_expiry or password_changed:
                trainer.access_expiry_date = new_expiry
                trainer.save() # Saves expiry, active status, must_change_password flag, and new password hash if changed

            if password_changed:
                # Send email with credentials only if the password was actually reset
                send_mail(
                    'Your Parc Platform Login Credentials & Schedule Update',
                    f'Hi {trainer.first_name},\n\nYou have been assigned to a new schedule or your access needed reactivation. '
                    'Please use the following temporary credentials to log in. You may change your password after logging in if you wish.\n\n'
                    f'Username: {trainer.email}\n'
                    f'Password: {temp_password}\n\n'
                    f'Your access will be valid until: {trainer.access_expiry_date.strftime("%Y-%m-%d %H:%M")}\n\n'
                    'Login URL: [Your Frontend Login URL Here]\n\n'
                    'Best regards,\nThe Parc Platform Team',
                    'admin@parcplatform.com', # Use settings.EMAIL_HOST_USER
                    [trainer.email],
                    fail_silently=False,
                )
                print(f"--- SENT/RESET CREDENTIALS TO TRAINER: {trainer.email} | TEMP PASSWORD: {temp_password} ---")
        else:
            # If no upcoming schedules, deactivate and clear expiry, unless already inactive
            if trainer.is_active or trainer.access_expiry_date is not None:
                trainer.is_active = False
                trainer.access_expiry_date = None
                trainer.save(update_fields=['is_active', 'access_expiry_date'])


    def perform_create(self, serializer):
        schedule = serializer.save()
        self._update_trainer_expiry_and_send_credentials(schedule.trainer)

    def perform_update(self, serializer):
        schedule = serializer.save()
        self._update_trainer_expiry_and_send_credentials(schedule.trainer)

    def perform_destroy(self, instance):
        trainer = instance.trainer
        instance.delete()
        self._update_trainer_expiry_and_send_credentials(trainer) # Recalculate expiry after deletion

class BillViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Bill.objects.select_related('trainer').prefetch_related('expenses').all().order_by('-date') # Optimize
    serializer_class = BillSerializer

    # Add permission checks if needed (e.g., Trainer can only CRUD own bills, Admin can CRUD all)
    def get_queryset(self):
         user = self.request.user
         if user.role == 'ADMIN' or user.is_staff:
             return super().get_queryset()
         elif user.role == 'TRAINER':
             return super().get_queryset().filter(trainer=user)
         return Bill.objects.none()

    @action(detail=True, methods=['post'])
    def mark_as_paid(self, request, pk=None):
        # Add Admin check if needed
        bill = self.get_object()
        bill.status = 'PAID'
        bill.save()
        return Response(BillSerializer(bill).data)

    def perform_create(self, serializer):
         # Allow Trainer to create for themselves, or Admin to create for any Trainer
        user = self.request.user
        if user.role == 'TRAINER':
             # Ensure trainer isn't trying to create a bill for someone else
            if 'trainer' in serializer.validated_data and serializer.validated_data['trainer'] != user:
                 raise PermissionDenied("Trainers can only create bills for themselves.")
            serializer.save(trainer=user)
        elif user.role == 'ADMIN' or user.is_staff:
             # Admin must specify the trainer in the request data
            if 'trainer' not in serializer.validated_data:
                 raise ValidationError("Admin must specify a trainer when creating a bill.")
            serializer.save()
        else:
             raise PermissionDenied("You do not have permission to create bills.")


class AssessmentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated] # Or IsAdminUser/IsTrainerOrAdmin
    queryset = Assessment.objects.all()
    serializer_class = AssessmentSerializer

class StudentAttemptViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = StudentAttempt.objects.select_related('student', 'assessment').all() # Optimize
    serializer_class = StudentAttemptSerializer
    # Add permission checks (Student can CRUD own, Admin/Trainer can List/Retrieve?)

class ReportingDashboardView(APIView):
    permission_classes = [IsAuthenticated] # Or IsAdminUser/IsTrainerOrAdmin

    def get(self, request, *args, **kwargs):
        # Existing logic seems fine, assumes Admin view
        leaderboard_data = User.objects.filter(role='STUDENT') \
            .annotate(total_score=Sum('attempts__score')) \
            .filter(total_score__isnull=False) \
            .order_by('-total_score') \
            .values('id', 'first_name', 'last_name', 'total_score')[:20] # Limit leaderboard size

        leaderboard = [
            {
                'studentId': entry['id'], # Include ID if needed on frontend
                'studentName': f"{entry['first_name']} {entry['last_name']}".strip(),
                'totalScore': entry['total_score'] or 0
            } for entry in leaderboard_data
        ]

        recent_attempts_queryset = StudentAttempt.objects.select_related('student', 'assessment').order_by('-timestamp')[:15] # Limit attempts shown
        recent_attempts = StudentAttemptSerializer(recent_attempts_queryset, many=True).data

        return Response({
            'leaderboard': leaderboard,
            'student_attempts': recent_attempts,
        })