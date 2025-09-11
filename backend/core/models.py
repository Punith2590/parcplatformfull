# backend/core/models.py

from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('TRAINER', 'Trainer'),
        ('STUDENT', 'Student'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='ADMIN')
    expertise = models.CharField(max_length=100, blank=True, null=True)
    experience = models.IntegerField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    course = models.CharField(max_length=100, blank=True, null=True)
    college = models.CharField(max_length=100, blank=True, null=True)
    access_expiry_date = models.DateTimeField(null=True, blank=True)

class College(models.Model):
    name = models.CharField(max_length=100, unique=True)
    address = models.TextField(blank=True)
    contact_person = models.CharField(max_length=100, blank=True)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)
    def __str__(self):
        return self.name

class Material(models.Model):
    MATERIAL_TYPE_CHOICES = (('PDF', 'PDF'), ('PPT', 'PPT'), ('DOC', 'DOC'), ('VIDEO', 'VIDEO'))
    title = models.CharField(max_length=100)
    course = models.CharField(max_length=100)
    type = models.CharField(max_length=10, choices=MATERIAL_TYPE_CHOICES)
    content = models.FileField(upload_to='materials/')
    def __str__(self):
        return self.title

class Schedule(models.Model):
    trainer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='schedules')
    college = models.ForeignKey(College, on_delete=models.CASCADE)
    course = models.CharField(max_length=100)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    materials = models.ManyToManyField(Material, blank=True)
    def __str__(self):
        return f"{self.course} at {self.college.name}"
    
class TrainerApplication(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    experience = models.PositiveIntegerField()
    tech_stack = models.CharField(max_length=255)
    expertise_domains = models.TextField()
    resume = models.FileField(upload_to='resumes/') # This will store the resume file
    status = models.CharField(max_length=20, default='PENDING')
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.email}"