# backend/core/models.py

from django.utils import timezone
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
    assigned_materials = models.ManyToManyField('Material', blank=True, related_name='assigned_users')
    resume = models.FileField(upload_to='resumes/', null=True, blank=True)
    assigned_assessments = models.ManyToManyField('Assessment', blank=True, related_name='assigned_students')

    @property
    def get_full_name(self):
        """
        Returns the first_name plus the last_name, with a space in between.
        """
        full_name = '%s %s' % (self.first_name, self.last_name)
        return full_name.strip()

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
    
class Bill(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('PAID', 'Paid'),
    )
    trainer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bills')
    date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    invoice_number = models.CharField(max_length=20, unique=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            # Generate a unique invoice number, e.g., INV-2025-001
            today = timezone.now().date()
            today_string = today.strftime('%Y%m%d')
            next_bill_number = Bill.objects.filter(date__year=today.year).count() + 1
            self.invoice_number = f'INV-{today.year}-{next_bill_number:03d}'
        super().save(*args, **kwargs)

    def __str__(self):
        return self.invoice_number

class Expense(models.Model):
    bill = models.ForeignKey(Bill, on_delete=models.CASCADE, related_name='expenses')
    type = models.CharField(max_length=50)
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.type} - {self.amount}"
    
class Assessment(models.Model):
    ASSESSMENT_TYPE_CHOICES = (
        ('TEST', 'Test'),
        ('ASSIGNMENT', 'Assignment'),
    )
    title = models.CharField(max_length=100)
    course = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=ASSESSMENT_TYPE_CHOICES)
    material = models.ForeignKey(Material, on_delete=models.SET_NULL, null=True, blank=True, related_name='assessments')
    # For simplicity, questions will be a list of objects like:
    # [{"question": "...", "options": ["A", "B"], "answer": "A"}, ...]
    questions = models.JSONField(default=list) 
    
    def __str__(self):
        return self.title

class StudentAttempt(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attempts')
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name='attempts')
    score = models.IntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.student.username} - {self.assessment.title} - {self.score}%"