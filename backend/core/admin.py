# backend/core/admin.py

from django.contrib import admin
from .models import (
    User, College, Material, Schedule, Module, Course, Batch,
    TrainerApplication, EmployeeApplication, Task,
    Bill, Expense, Assessment, StudentAttempt, EmployeeDocument, EducationEntry,
    WorkExperienceEntry, Certification
)

# Register your models here to make them appear in the admin site.
admin.site.register(User)
admin.site.register(College)
admin.site.register(Material)
admin.site.register(Schedule)
admin.site.register(Course)
admin.site.register(Batch)
admin.site.register(Module)
admin.site.register(TrainerApplication)
admin.site.register(EmployeeApplication) # <-- Register new
admin.site.register(Task)               # <-- Register new
admin.site.register(Bill)
admin.site.register(Expense)
admin.site.register(Assessment)
admin.site.register(StudentAttempt)
admin.site.register(EmployeeDocument)
admin.site.register(EducationEntry)
admin.site.register(WorkExperienceEntry)
admin.site.register(Certification)