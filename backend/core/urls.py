# backend/core/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, CollegeViewSet, MaterialViewSet, ScheduleViewSet, TrainerApplicationViewSet

# This router automatically creates all the API endpoints for our views
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'colleges', CollegeViewSet, basename='college')
router.register(r'materials', MaterialViewSet, basename='material')
router.register(r'schedules', ScheduleViewSet, basename='schedule')
router.register(r'applications', TrainerApplicationViewSet, basename='application')

# This line gathers all the URLs created by the router.
urlpatterns = [
    path('', include(router.urls)),
]