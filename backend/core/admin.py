# backend/core/admin.py

from django.contrib import admin
from .models import User, College, Material, Schedule, Module, Course, Batch

# Register your models here to make them appear in the admin site.
admin.site.register(User)
admin.site.register(College)
admin.site.register(Material)
admin.site.register(Schedule)
admin.site.register(Course)
admin.site.register(Batch)
admin.site.register(Module)