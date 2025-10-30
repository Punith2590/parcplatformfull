# backend/core/utils.py

from django.core.mail import send_mail
from django.conf import settings # <-- Import settings

# Existing function for students
def send_student_credentials(user, password):
    subject = 'Your Parc Platform Account Credentials'
    message = (
        f'Hi {user.first_name},\n\n'
        f'An account has been created for you on the Parc Platform. Please use the following temporary credentials to log in. '
        'You will be required to change your password upon your first login.\n\n'
        f'Username: {user.email}\n'
        f'Password: {password}\n\n'
        'Login URL: [Your Frontend Login URL Here]\n\n' # <-- Consider adding the login URL
        'Best regards,\nThe Parc Platform Team'
    )
    from_email = settings.EMAIL_HOST_USER # Use configured sender
    recipient_list = [user.email]

    try:
        send_mail(subject, message, from_email, recipient_list, fail_silently=False)
        print(f"--- SENT CREDENTIALS TO NEW STUDENT: {user.email} ---")
    except Exception as e:
        print(f"--- FAILED TO SEND CREDENTIALS TO STUDENT {user.email}: {e} ---")


# --- NEW function for employees ---
def send_employee_credentials(user, password):
    subject = 'Your Parc Platform Employee Account Credentials'
    message = (
        f'Hi {user.first_name},\n\n'
        f'An employee account has been created for you on the Parc Platform. Please use the following temporary credentials to log in. '
        'You will be required to change your password upon your first login.\n\n'
        f'Username: {user.email}\n'
        f'Password: {password}\n\n'
        'Login URL: [Your Frontend Login URL Here]\n\n' # <-- Consider adding the login URL
        'Best regards,\nThe Parc Platform Team'
    )
    from_email = settings.EMAIL_HOST_USER # Use configured sender
    recipient_list = [user.email]

    try:
        send_mail(subject, message, from_email, recipient_list, fail_silently=False)
        print(f"--- SENT CREDENTIALS TO NEW EMPLOYEE: {user.email} ---")
    except Exception as e:
        print(f"--- FAILED TO SEND CREDENTIALS TO EMPLOYEE {user.email}: {e} ---")
# --- END NEW function ---