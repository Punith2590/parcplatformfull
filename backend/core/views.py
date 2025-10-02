# backend/core/views.py

from django.http import FileResponse
from django.core.mail import send_mail
from django.utils import timezone
from django.db.models import Sum
from rest_framework import viewsets, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
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
from django.db import IntegrityError

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

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
                'is_active': False,  # User is created but cannot log in yet
                'resume': application.resume
            }
        )

        if not created:
            return Response({'error': 'A user with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        application.status = 'APPROVED'
        application.save()

        # Send approval email (no credentials)
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
        
        # Send rejection email
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
        
        # Delete the application from the database
        application.delete()
        
        return Response({'status': 'application declined and deleted'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def view_resume(self, request, pk=None):
        application = self.get_object()
        if hasattr(application, 'resume') and application.resume:
            return FileResponse(application.resume.open(), content_type='application/pdf')
        else:
            return Response({'error': 'Resume not found.'}, status=status.HTTP_404_NOT_FOUND)


class UserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = User.objects.all()
    serializer_class = UserSerializer

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def bulk_create_students(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        college_name = request.data.get('college')

        if not file_obj:
            return Response({'error': 'No file uploaded.'}, status=status.HTTP_400_BAD_REQUEST)
        if not college_name:
            return Response({'error': 'College name is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Check file extension to use the correct pandas reader
            if file_obj.name.endswith('.csv'):
                df = pd.read_csv(file_obj)
            elif file_obj.name.endswith(('.xls', '.xlsx')):
                df = pd.read_excel(file_obj)
            else:
                return Response({'error': 'Unsupported file format. Please upload a CSV or Excel file.'}, status=status.HTTP_400_BAD_REQUEST)

            students_to_create = []
            errors = []

            for index, row in df.iterrows():
                name = row.get('name')
                email = row.get('email')
                course = row.get('course')

                # Validate data in the current row
                if not all([name, email, course]):
                    errors.append(f"Row {index + 2}: Missing one or more required fields (name, email, course).")
                    continue
                
                if User.objects.filter(username=email).exists():
                    errors.append(f"Row {index + 2}: A user with the email '{email}' already exists.")
                    continue

                name_parts = str(name).split(" ", 1)
                first_name = name_parts[0]
                last_name = name_parts[1] if len(name_parts) > 1 else ""

                students_to_create.append(
                    User(
                        username=email,
                        email=email,
                        first_name=first_name,
                        last_name=last_name,
                        role='STUDENT',
                        college=college_name,
                        course=str(course)
                    )
                )

            if errors:
                return Response({'errors': errors}, status=status.HTTP_400_BAD_REQUEST)

            created_users = User.objects.bulk_create(students_to_create)
            
            # Set a default password for each new user
            for user in created_users:
                user.set_password('password')
                user.save()

            return Response(
                {'status': f'{len(created_users)} students created successfully.'},
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            return Response({'error': f'An error occurred while processing the file: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def view_resume(self, request, pk=None):
        user = self.get_object()
        if hasattr(user, 'resume') and user.resume:
            return FileResponse(user.resume.open(), content_type='application/pdf')
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

class MaterialViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer
    parser_classes = (MultiPartParser, FormParser)

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
        batch_name = request.data.get('name')
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')

        if not all([file_obj, course_id, batch_name, start_date, end_date]):
            return Response({'error': 'Missing required fields (file, course, name, start_date, end_date).'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            course = Course.objects.get(id=int(course_id))
        except Course.DoesNotExist:
            return Response({'error': f'Course with ID {course_id} not found.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # 1. Create the Batch manually
        try:
            batch = Batch.objects.create(
                course=course,
                name=batch_name,
                start_date=start_date,
                end_date=end_date
            )
        except IntegrityError:
            return Response({'error': 'A batch with this name already exists for this course.'}, status=status.HTTP_400_BAD_REQUEST)


        # 2. Process the student file
        try:
            df = pd.read_excel(file_obj) if file_obj.name.endswith(('.xls', '.xlsx')) else pd.read_csv(file_obj)
            students_to_create = []
            
            for index, row in df.iterrows():
                name = row.get('name')
                email = row.get('email')
                
                if not all([name, email]): continue # Skip rows with missing data
                if User.objects.filter(username=email).exists(): continue # Skip existing users

                name_parts = str(name).split(" ", 1)
                students_to_create.append(
                    User(
                        username=email, email=email,
                        first_name=name_parts[0],
                        last_name=name_parts[1] if len(name_parts) > 1 else "",
                        role='STUDENT',
                        course=batch.course.name,
                        college=batch.course.college.name,
                        batch=batch
                    )
                )

            created_users = User.objects.bulk_create(students_to_create)
            for user in created_users:
                user.set_password('password')
                user.save()

            return Response(self.get_serializer(batch).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            batch.delete() # Rollback: delete the batch if student processing fails
            return Response({'error': f'An error occurred while processing the student file: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        
    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def add_students_from_file(self, request, pk=None):
        batch = self.get_object()
        file_obj = request.FILES.get('file')

        if not file_obj:
            return Response({'error': 'No file uploaded.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            df = pd.read_excel(file_obj) if file_obj.name.endswith(('.xls', '.xlsx')) else pd.read_csv(file_obj)
            
            for index, row in df.iterrows():
                name = row.get('name')
                email = row.get('email')
                
                if not all([name, email]): continue

                # Get existing student or create a new one
                user, created = User.objects.get_or_create(
                    username=email,
                    defaults={
                        'email': email,
                        'first_name': str(name).split(" ", 1)[0],
                        'last_name': str(name).split(" ", 1)[1] if len(str(name).split(" ", 1)) > 1 else "",
                        'role': 'STUDENT',
                        'course': batch.course.name,
                        'college': batch.course.college.name,
                    }
                )
                # Assign the user to this batch
                user.batch = batch
                user.save()

                if created:
                    user.set_password('password')
                    user.save()
                    print(f"--- CREATED AND ADDED USER: {user.email} ---")
                else:
                    print(f"--- ADDED EXISTING USER: {user.email} ---")


            return Response(self.get_serializer(batch).data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': f'An error occurred while processing the file: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        
    @action(detail=True, methods=['post'])
    def add_students(self, request, pk=None):
        batch = self.get_object()
        student_ids = request.data.get('student_ids', [])
        
        students_to_add = User.objects.filter(id__in=student_ids, role='STUDENT')
        batch.students.add(*students_to_add)
        
        return Response(self.get_serializer(batch).data, status=status.HTTP_200_OK)

    # --- NEW ACTION TO REMOVE STUDENTS ---
    @action(detail=True, methods=['post'])
    def remove_students(self, request, pk=None):
        batch = self.get_object()
        student_ids = request.data.get('student_ids', [])
        
        students_to_remove = User.objects.filter(id__in=student_ids, batch=batch)
        batch.students.remove(*students_to_remove)
        
        return Response(self.get_serializer(batch).data, status=status.HTTP_200_OK)
        

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