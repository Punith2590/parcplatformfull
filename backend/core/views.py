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
    Assessment, StudentAttempt
)
from .serializers import (
    UserSerializer, CollegeSerializer, MaterialSerializer,
    ScheduleSerializer, MyTokenObtainPairSerializer, TrainerApplicationSerializer,
    BillSerializer, AssessmentSerializer, StudentAttemptSerializer
)
import secrets
from rest_framework_simplejwt.views import TokenObtainPairView

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