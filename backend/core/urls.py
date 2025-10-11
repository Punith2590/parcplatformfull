# backend/core/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, CollegeViewSet, MaterialViewSet, ScheduleViewSet,
    TrainerApplicationViewSet, BillViewSet, AssessmentViewSet, StudentAttemptViewSet, ReportingDashboardView,
    CourseViewSet, BatchViewSet, SetPasswordView
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'colleges', CollegeViewSet, basename='college')
router.register(r'materials', MaterialViewSet, basename='material')
router.register(r'schedules', ScheduleViewSet, basename='schedule')
router.register(r'applications', TrainerApplicationViewSet, basename='application')
router.register(r'bills', BillViewSet, basename='bill')
router.register(r'assessments', AssessmentViewSet, basename='assessment')
router.register(r'attempts', StudentAttemptViewSet, basename='attempt')
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'batches', BatchViewSet, basename='batch')

urlpatterns = [
    path('', include(router.urls)),
    path('reporting/', ReportingDashboardView.as_view(), name='reporting-dashboard'),
    path('auth/set-password/', SetPasswordView.as_view(), name='set-password'),
]