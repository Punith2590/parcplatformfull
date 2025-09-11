# backend/core/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import User, College, Material, Schedule, TrainerApplication
from .serializers import (
    UserSerializer, CollegeSerializer, MaterialSerializer, 
    ScheduleSerializer, MyTokenObtainPairSerializer, TrainerApplicationSerializer
)
import secrets
from rest_framework_simplejwt.views import TokenObtainPairView

# This view is for logging in and is public by default.
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

# This ViewSet is for the public trainer onboarding form.
class TrainerApplicationViewSet(viewsets.ModelViewSet):
    queryset = TrainerApplication.objects.filter(status='PENDING')
    serializer_class = TrainerApplicationSerializer
    # --- FIX: Explicitly allow anyone to submit an application ---
    permission_classes = [AllowAny] 

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def approve(self, request, pk=None):
        """
        Approves an application. Only authenticated users (admins) can access this.
        """
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
                'is_active': False
            }
        )

        if not created:
            return Response({'error': 'A user with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        application.status = 'APPROVED'
        application.save()

        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

# --- FIX: Add permissions to all ViewSets that require a user to be logged in ---
class UserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = User.objects.all()
    serializer_class = UserSerializer

class CollegeViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = College.objects.all()
    serializer_class = CollegeSerializer

class MaterialViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer

class ScheduleViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Schedule.objects.all()
    serializer_class = ScheduleSerializer

    def _update_trainer_expiry(self, trainer):
        latest_schedule = Schedule.objects.filter(trainer=trainer).order_by('-end_date').first()
        if latest_schedule:
            trainer.access_expiry_date = latest_schedule.end_date
            trainer.save()
        else:
            trainer.access_expiry_date = None
            trainer.save()

    def perform_create(self, serializer):
        schedule = serializer.save()
        trainer = schedule.trainer
    
        if not trainer.is_active:
            temp_password = secrets.token_urlsafe(8)
            trainer.set_password(temp_password)
            trainer.is_active = True
            trainer.save()
            print(f"--- SENDING CREDENTIALS TO {trainer.email} | PASSWORD: {temp_password} ---")
    
        self._update_trainer_expiry(trainer)

    def perform_update(self, serializer):
        schedule = serializer.save()
        self._update_trainer_expiry(schedule.trainer)

    def perform_destroy(self, instance):
        trainer = instance.trainer
        instance.delete()
        self._update_trainer_expiry(trainer)