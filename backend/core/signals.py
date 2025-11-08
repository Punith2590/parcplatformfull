# backend/core/signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
# --- UPDATE IMPORTS ---
from .models import Certification, EmployeeDocument, EducationEntry

@receiver(post_save, sender=Certification)
def create_employee_document_from_certificate(sender, instance, created, **kwargs):
    """
    When a new Certification is created AND it has a file,
    automatically create a corresponding EmployeeDocument.
    """
    if created and instance.certificate_file:
        # Check if a document with this exact file path already exists for this user
        # to prevent duplicates if the signal fires multiple times.
        # We link to the file, not copy it, so the path is the unique identifier.
        if not EmployeeDocument.objects.filter(employee=instance.employee, document=instance.certificate_file).exists():
            EmployeeDocument.objects.create(
                employee=instance.employee,
                title=f"Certificate: {instance.title}", # Prepend title
                document=instance.certificate_file # Link to the same file path
            )
    
    # Handle update? If the certificate_file is *changed*, should we update the EmployeeDocument?
    # This is more complex. For now, we only handle creation.


# --- ADD THIS NEW RECEIVER ---
@receiver(post_save, sender=EducationEntry)
def create_employee_document_from_marksheet(sender, instance, **kwargs):
    """
    When an EducationEntry is saved AND it has a marksheet_file,
    automatically create a corresponding EmployeeDocument if one for that file
    doesn't already exist.
    """
    if instance.marksheet_file:
        # Check if a document for this *specific file* already exists
        if not EmployeeDocument.objects.filter(employee=instance.employee, document=instance.marksheet_file).exists():
            EmployeeDocument.objects.create(
                employee=instance.employee,
                title=f"Marksheet: {instance.title} ({instance.institute})",
                document=instance.marksheet_file
            )
# --- END ADD ---