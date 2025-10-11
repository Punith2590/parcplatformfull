# backend/core/views.py

from django.http import FileResponse, HttpResponse
from django.core.mail import send_mail
from django.utils import timezone
from django.db.models import Sum, Q
from rest_framework import viewsets, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied
from .models import (
    User, College, Material, Schedule, TrainerApplication, Bill,
    Assessment, StudentAttempt, Course, Batch
)
from .serializers import (
    UserSerializer, CollegeSerializer, MaterialSerializer,
    ScheduleSerializer, MyTokenObtainPairSerializer, TrainerApplicationSerializer,
    BillSerializer, AssessmentSerializer, StudentAttemptSerializer, CourseSerializer, BatchSerializer
)
import secrets
from rest_framework_simplejwt.views import TokenObtainPairView
import pandas as pd
from django.db import IntegrityError, transaction
from .utils import send_student_credentials

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

class TrainerApplicationViewSet(viewsets.ModelViewSet):
    queryset = TrainerApplication.objects.filter(status='PENDING')
    serializer_class = TrainerApplicationSerializer
    permission_classes = [AllowAny]

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
                'expertise': application.expertise_domains,
                'experience': application.experience,
                'role': 'TRAINER',
                'is_active': False,
                'resume': application.resume
            }
        )

        if not created:
            return Response({'error': 'A user with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        application.status = 'APPROVED'
        application.save()

        send_mail(
            'Your Application has been Approved!',
            f'Hi {user.first_name},\n\nCongratulations! Your application to become a trainer at Parc Platform has been approved. '
            'You will receive another email with your login credentials once you have been assigned to your first schedule.\n\n'
            'Best regards,\nThe Parc Platform Team',
            'admin@parcplatform.com',
            [user.email],
            fail_silently=False,
        )

        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def decline(self, request, pk=None):
        application = self.get_object()
        send_mail(
            'Update on Your Parc Platform Application',
            f'Hi {application.name},\n\nThank you for your interest in becoming a trainer. '
            'After careful consideration, we have decided not to move forward with your application at this time.\n\n'
            'We wish you the best in your future endeavors.\n\n'
            'Best regards,\nThe Parc Platform Team',
            'admin@parcplatform.com',
            [application.email],
            fail_silently=False,
        )
        application.delete()
        return Response({'status': 'application declined and deleted'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def view_resume(self, request, pk=None):
        application = self.get_object()
        if hasattr(application, 'resume') and application.resume:
            try:
                with application.resume.open('rb') as f:
                    resume_data = f.read()
                return HttpResponse(resume_data, content_type='application/pdf')
            except FileNotFoundError:
                return Response({'error': 'Resume file not found on server.'}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({'error': 'Resume not found for this application.'}, status=status.HTTP_404_NOT_FOUND)

class UserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = User.objects.all()
    serializer_class = UserSerializer

    @action(detail=True, methods=['get'])
    def view_resume(self, request, pk=None):
        user = self.get_object()
        if hasattr(user, 'resume') and user.resume:
            try:
                with user.resume.open('rb') as f:
                    resume_data = f.read()
                return HttpResponse(resume_data, content_type='application/pdf')
            except FileNotFoundError:
                return Response({'error': 'Resume file not found on server.'}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({'error': 'Resume not found for this user.'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def assign_materials(self, request, pk=None):
        user = self.get_object()
        if user.role != 'STUDENT':
            return Response({'error': 'Can only assign materials to students.'}, status=status.HTTP_400_BAD_REQUEST)
        material_ids = request.data.get('material_ids', [])
        materials = Material.objects.filter(id__in=material_ids)
        if len(materials) != len(material_ids):
            return Response({'error': 'One or more material IDs are invalid.'}, status=status.HTTP_400_BAD_REQUEST)
        user.assigned_materials.set(materials)
        user.save()
        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)

class CollegeViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = College.objects.all()
    serializer_class = CollegeSerializer

    @action(detail=True, methods=['post'])
    def manage_courses(self, request, pk=None):
        college = self.get_object()
        course_ids = request.data.get('course_ids', [])
        courses_to_set = Course.objects.filter(id__in=course_ids)
        college.courses.set(courses_to_set)
        return Response(self.get_serializer(college).data, status=status.HTTP_200_OK)

class MaterialViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = MaterialSerializer
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.role == 'ADMIN':
            return Material.objects.all()
        return Material.objects.filter(Q(uploader__isnull=True) | Q(uploader=user))

    def perform_create(self, serializer):
        if self.request.user.role == 'TRAINER':
            serializer.save(uploader=self.request.user)
        else:
            serializer.save(uploader=None)

    def perform_update(self, serializer):
        material = self.get_object()
        user = self.request.user
        if material.uploader == user or user.is_staff or user.role == 'ADMIN':
            serializer.save()
        else:
            raise PermissionDenied("You do not have permission to edit this material.")

    def perform_destroy(self, instance):
        user = self.request.user
        if instance.uploader == user or user.is_staff or user.role == 'ADMIN':
            instance.delete()
        else:
            raise PermissionDenied("You do not have permission to delete this material.")

class CourseViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Course.objects.all()
    serializer_class = CourseSerializer

class BatchViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Batch.objects.all()
    serializer_class = BatchSerializer

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def create_with_students(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        course_id = request.data.get('course')
        college_id = request.data.get('college')
        batch_name = request.data.get('name')
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')

        if not all([file_obj, course_id, college_id, batch_name, start_date, end_date]):
            return Response({'error': 'Missing required fields.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            course = Course.objects.get(id=int(course_id))
            college = College.objects.get(id=int(college_id))
            batch = Batch.objects.create(
                course=course, college=college, name=batch_name,
                start_date=start_date, end_date=end_date
            )
        except (Course.DoesNotExist, College.DoesNotExist, IntegrityError) as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            df = pd.read_excel(file_obj) if file_obj.name.endswith(('.xls', '.xlsx')) else pd.read_csv(file_obj)
            users_to_add = []
            for _, row in df.iterrows():
                name, email = row.get('name'), row.get('email')
                if not all([name, email]): continue
                user, created = User.objects.get_or_create(
                    username=email,
                    defaults={
                        'email': email,
                        'first_name': str(name).split(" ", 1)[0],
                        'last_name': str(name).split(" ", 1)[1] if len(str(name).split(" ", 1)) > 1 else "",
                        'role': 'STUDENT',
                        'must_change_password': True
                    }
                )
                if created:
                    password = secrets.token_urlsafe(8)
                    user.set_password(password)
                    user.save()
                    send_student_credentials(user, password)
                users_to_add.append(user)

            batch.students.add(*users_to_add)
            return Response(self.get_serializer(batch).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            batch.delete()
            return Response({'error': f'File processing error: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        
    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def add_students_from_file(self, request, pk=None):
        batch = self.get_object()
        file_obj = request.FILES.get('file')

        if not file_obj:
            return Response({'error': 'No file uploaded.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            df = pd.read_excel(file_obj) if file_obj.name.endswith(('.xls', '.xlsx')) else pd.read_csv(file_obj)
            users_to_add = []
            for _, row in df.iterrows():
                name, email = row.get('name'), row.get('email')
                if not all([name, email]): continue

                user, created = User.objects.get_or_create(
                    username=email,
                    defaults={
                        'email': email,
                        'first_name': str(name).split(" ", 1)[0],
                        'last_name': str(name).split(" ", 1)[1] if len(str(name).split(" ", 1)) > 1 else "",
                        'role': 'STUDENT',
                        'must_change_password': True
                    }
                )
                if created:
                    password = secrets.token_urlsafe(8)
                    user.set_password(password)
                    user.save()
                    send_student_credentials(user, password)
                users_to_add.append(user)
            
            batch.students.add(*users_to_add)
            return Response(self.get_serializer(batch).data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': f'An error occurred: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        
    @action(detail=True, methods=['post'])
    def add_students(self, request, pk=None):
        batch = self.get_object()
        student_ids = request.data.get('student_ids', [])
        
        students_to_add = User.objects.filter(id__in=student_ids, role='STUDENT')
        batch.students.add(*students_to_add)
        
        return Response(self.get_serializer(batch).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def remove_students(self, request, pk=None):
        batch = self.get_object()
        student_ids = request.data.get('student_ids', [])
        
        students_to_remove = User.objects.filter(id__in=student_ids)
        batch.students.remove(*students_to_remove)
        
        return Response(self.get_serializer(batch).data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def assign_materials(self, request, pk=None):
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
    permission_classes = [IsAuthenticated]
    queryset = Schedule.objects.all()
    serializer_class = ScheduleSerializer

    def _update_trainer_expiry_and_send_credentials(self, trainer):
        latest_schedule = Schedule.objects.filter(
            trainer=trainer,
            end_date__gte=timezone.now()
        ).order_by('-end_date').first()

        password_changed = False
        if not trainer.is_active or (trainer.access_expiry_date and trainer.access_expiry_date < timezone.now()):
            temp_password = secrets.token_urlsafe(8)
            trainer.set_password(temp_password)
            trainer.is_active = True
            password_changed = True

        if latest_schedule:
            trainer.access_expiry_date = latest_schedule.end_date
            trainer.save()
            
            if password_changed:
                send_mail(
                    'Your Parc Platform Login Credentials',
                    f'Hi {trainer.first_name},\n\nYou have been assigned to a new schedule. Please use the following temporary credentials to log in.\n\n'
                    f'Username: {trainer.email}\n'
                    f'Password: {temp_password}\n\n'
                    f'Your access will be valid until: {trainer.access_expiry_date.strftime("%Y-%m-%d %H:%M")}\n\n'
                    'Best regards,\nThe Parc Platform Team',
                    'admin@parcplatform.com',
                    [trainer.email],
                    fail_silently=False,
                )
                print(f"--- SENT NEW CREDENTIALS TO: {trainer.email} | TEMP PASSWORD: {temp_password} ---")
        else:
            trainer.is_active = False
            trainer.access_expiry_date = None
            trainer.save()

    def perform_create(self, serializer):
        schedule = serializer.save()
        self._update_trainer_expiry_and_send_credentials(schedule.trainer)

    def perform_update(self, serializer):
        schedule = serializer.save()
        self._update_trainer_expiry_and_send_credentials(schedule.trainer)

    def perform_destroy(self, instance):
        trainer = instance.trainer
        instance.delete()
        self._update_trainer_expiry_and_send_credentials(trainer)

class BillViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Bill.objects.all().order_by('-date')
    serializer_class = BillSerializer

    @action(detail=True, methods=['post'])
    def mark_as_paid(self, request, pk=None):
        bill = self.get_object()
        bill.status = 'PAID'
        bill.save()
        return Response(BillSerializer(bill).data)
    
class AssessmentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Assessment.objects.all()
    serializer_class = AssessmentSerializer

class StudentAttemptViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = StudentAttempt.objects.all()
    serializer_class = StudentAttemptSerializer

class ReportingDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        leaderboard_data = User.objects.filter(role='STUDENT') \
            .annotate(total_score=Sum('attempts__score')) \
            .filter(total_score__isnull=False) \
            .order_by('-total_score') \
            .values('id', 'first_name', 'last_name', 'total_score')
        
        leaderboard = [
            {
                'studentName': f"{entry['first_name']} {entry['last_name']}".strip(),
                'totalScore': entry['total_score']
            } for entry in leaderboard_data
        ]

        recent_attempts_queryset = StudentAttempt.objects.select_related('student', 'assessment').order_by('-timestamp')[:10]
        recent_attempts = StudentAttemptSerializer(recent_attempts_queryset, many=True).data

        return Response({
            'leaderboard': leaderboard,
            'student_attempts': recent_attempts,
        })