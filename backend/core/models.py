# backend/core/models.py

from django.utils import timezone
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.core.exceptions import ValidationError
import os

class User(AbstractUser):
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('TRAINER', 'Trainer'),
        ('STUDENT', 'Student'),
        ('EMPLOYEE', 'Employee'), # <-- ADDED EMPLOYEE ROLE
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='ADMIN')
    expertise = models.CharField(max_length=100, blank=True, null=True) # Primarily for Trainers
    experience = models.IntegerField(blank=True, null=True) # Primarily for Trainers
    phone = models.CharField(max_length=20, blank=True, null=True)
    batches = models.ManyToManyField('Batch', blank=True, related_name='students') # Primarily for Students
    access_expiry_date = models.DateTimeField(null=True, blank=True) # Primarily for Trainers
    assigned_materials = models.ManyToManyField('Material', blank=True, related_name='assigned_users') # Primarily for Students
    resume = models.FileField(upload_to='resumes/', null=True, blank=True) # For Trainers & Employees
    assigned_assessments = models.ManyToManyField('Assessment', blank=True, related_name='assigned_students') # Primarily for Students
    must_change_password = models.BooleanField(default=False)
    department = models.CharField(max_length=100, blank=True, null=True)
    bio = models.TextField(blank=True, null=True, help_text="Professional summary or bio")
    @property
    def get_full_name(self):
        full_name = '%s %s' % (self.first_name, self.last_name)
        return full_name.strip()

# --- ADD THIS FUNCTION ---
def employee_marksheet_path(instance, filename):
    # file will be uploaded to MEDIA_ROOT/employee_marksheets/<employee_id>/<filename>
    return f'employee_marksheets/{instance.employee.id}/{filename}'
# --- END ADD ---

class EducationEntry(models.Model):
    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='education_entries', # This related_name is important
        limit_choices_to={'role': 'EMPLOYEE'}
    )
    title = models.CharField(max_length=200, help_text="e.g., B.E. in Computer Science or SSLC")
    institute = models.CharField(max_length=200, help_text="e.g., K S School Of Engineering And Management")
    location = models.CharField(max_length=100, blank=True, null=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    currently_ongoing = models.BooleanField(default=False)
    website = models.URLField(max_length=200, blank=True, null=True)
    academic_performance = models.TextField(blank=True, null=True, help_text="e.g., 7.67 CGPA or 84.96%")
    # --- ADD THIS LINE ---
    marksheet_file = models.FileField(upload_to=employee_marksheet_path, null=True, blank=True)

    class Meta:
        ordering = ['-start_date'] # Show newest education first

    def __str__(self):
        return f"{self.title} at {self.institute} ({self.employee.username})"
    
class WorkExperienceEntry(models.Model):
    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='work_experience_entries', # This related_name is important
        limit_choices_to={'role': 'EMPLOYEE'}
    )
    title = models.CharField(max_length=200, help_text="e.g., Software Engineer")
    institute = models.CharField(max_length=200, help_text="e.g., Google, Microsoft")
    location = models.CharField(max_length=100, blank=True, null=True)
    website = models.URLField(max_length=200, blank=True, null=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    currently_ongoing = models.BooleanField(default=False)
    description = models.TextField(blank=True, null=True, help_text="Describe your role, responsibilities, and achievements")

    class Meta:
        ordering = ['-start_date'] # Show newest experience first

    def __str__(self):
        return f"{self.title} at {self.institute} ({self.employee.username})"

class College(models.Model):
    name = models.CharField(max_length=100, unique=True)
    address = models.TextField(blank=True)
    contact_person = models.CharField(max_length=100, blank=True)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)
    courses = models.ManyToManyField('Course', blank=True, related_name='colleges')
    def __str__(self):
        return self.name

class Material(models.Model):
    MATERIAL_TYPE_CHOICES = (('PDF', 'PDF'), ('PPT', 'PPT'), ('DOC', 'DOC'), ('VIDEO', 'VIDEO'))
    title = models.CharField(max_length=100)
    course = models.ForeignKey('Course', on_delete=models.CASCADE, related_name='materials', null=True)
    type = models.CharField(max_length=10, choices=MATERIAL_TYPE_CHOICES)
    content = models.FileField(upload_to='materials/')
    uploader = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='uploaded_materials')
    duration_in_minutes = models.PositiveIntegerField(default=0, help_text="Duration of the material in minutes.")
    def __str__(self):
        return self.title

class Schedule(models.Model):
    trainer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='schedules')
    batch = models.ForeignKey('Batch', on_delete=models.CASCADE, related_name='schedules', null=True)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    materials = models.ManyToManyField(Material, blank=True)

    def __str__(self):
        if self.batch:
            course_name = self.batch.course.name if self.batch.course else "N/A"
            college_name = self.batch.college.name if self.batch.college else "N/A"
            return f"{course_name} at {college_name}"
        trainer_name = self.trainer.get_full_name if self.trainer else "N/A"
        return f"Unassigned Schedule for {trainer_name}"

class TrainerApplication(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    experience = models.PositiveIntegerField()
    tech_stack = models.CharField(max_length=255)
    expertise_domains = models.TextField()
    resume = models.FileField(upload_to='resumes/')
    status = models.CharField(max_length=20, default='PENDING')
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Trainer App: {self.name} - {self.email}"

class EmployeeApplication(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    skills = models.TextField(blank=True, help_text="Relevant skills or experience")
    department = models.CharField(max_length=100, blank=True, help_text="Intended department or role")
    resume = models.FileField(upload_to='resumes/')
    status = models.CharField(max_length=20, default='PENDING') # PENDING, APPROVED, DECLINED
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Employee App: {self.name} - {self.email}"

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
            today = timezone.now().date()
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
    course = models.CharField(max_length=100) # Consider making ForeignKey to Course
    type = models.CharField(max_length=20, choices=ASSESSMENT_TYPE_CHOICES)
    material = models.ForeignKey(Material, on_delete=models.SET_NULL, null=True, blank=True, related_name='assessments')
    questions = models.JSONField(default=list)

    def __str__(self):
        return self.title

class StudentAttempt(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attempts')
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name='attempts')
    score = models.IntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        student_name = self.student.username if self.student else "N/A"
        assessment_title = self.assessment.title if self.assessment else "N/A"
        return f"{student_name} - {assessment_title} - {self.score}%"

class Course(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    cover_photo = models.ImageField(upload_to='course_covers/', null=True, blank=True)

    def __str__(self):
        return self.name

class Batch(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='batches')
    college = models.ForeignKey(College, on_delete=models.CASCADE, related_name='batches', null=True)
    name = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()

    class Meta:
        unique_together = ('course', 'name', 'college')

    def __str__(self):
        course_name = self.course.name if self.course else "N/A"
        college_name = f" ({self.college.name})" if self.college else ""
        return f"{course_name} - {self.name}{college_name}"

    def delete(self, *args, **kwargs):
        if self.students.count() > 0:
            raise ValidationError("Cannot delete a batch that has students enrolled. Please remove all students from the batch first.")
        super().delete(*args, **kwargs)

class Module(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='modules')
    module_number = models.PositiveIntegerField()
    title = models.CharField(max_length=200)
    materials = models.ManyToManyField(Material, blank=True, related_name='modules')

    class Meta:
        unique_together = ('course', 'module_number')
        ordering = ['module_number']

    def __str__(self):
        course_name = self.course.name if self.course else "N/A"
        return f"Module {self.module_number}: {self.title} ({course_name})"

class Task(models.Model):
    STATUS_CHOICES = (
        ('TODO', 'To Do'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
    )
    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tasks',
        limit_choices_to={'role': 'EMPLOYEE'} # Ensure only employees can be assigned
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='TODO')
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        employee_name = self.employee.get_full_name if self.employee else "N/A"
        return f"Task: {self.title} ({employee_name}) - {self.status}"
    
def employee_document_path(instance, filename):
    # file will be uploaded to MEDIA_ROOT/employee_docs/<employee_id>/<filename>
    return f'employee_docs/{instance.employee.id}/{filename}'

class EmployeeDocument(models.Model):
    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='documents',
        limit_choices_to={'role': 'EMPLOYEE'} # Ensure only employees can have documents
    )
    title = models.CharField(max_length=200, help_text="Name or description of the document")
    document = models.FileField(upload_to=employee_document_path) # Use dynamic path
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        employee_name = self.employee.get_full_name if self.employee else "N/A"
        # Return filename if title is empty, otherwise title
        doc_name = self.title or os.path.basename(self.document.name)
        return f"Doc: {doc_name} ({employee_name})"
    
def employee_certificate_path(instance, filename):
    # Store certificates in their own folder
    return f'employee_certs/{instance.employee.id}/{filename}'

class Certification(models.Model):
    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='certification_entries',
        limit_choices_to={'role': 'EMPLOYEE'}
    )
    title = models.CharField(max_length=200, help_text="e.g., AWS Certified Cloud Practitioner")
    institute = models.CharField(max_length=200, help_text="e.g., Amazon Web Services")
    location = models.CharField(max_length=100, blank=True, null=True)
    website = models.URLField(max_length=200, blank=True, null=True)
    start_date = models.DateField(help_text="Issue Date") # Re-using start_date as Issue Date
    end_date = models.DateField(null=True, blank=True, help_text="Expiry Date") # Re-using end_date as Expiry Date
    currently_ongoing = models.BooleanField(default=False, help_text="Mark if this certification does not expire")
    description = models.TextField(blank=True, null=True, help_text="Add any other details")
    certificate_file = models.FileField(upload_to=employee_certificate_path, null=True, blank=True)

    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.title} from {self.institute} ({self.employee.username})"