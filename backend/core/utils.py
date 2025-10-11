# backend/core/utils.py

from django.core.mail import send_mail

def send_student_credentials(user, password):
    send_mail(
        'Your Parc Platform Account Credentials',
        f'Hi {user.first_name},\n\n'
        f'An account has been created for you on the Parc Platform. Please use the following temporary credentials to log in. '
        'You will be required to change your password upon your first login.\n\n'
        f'Username: {user.email}\n'
        f'Password: {password}\n\n'
        'Best regards,\nThe Parc Platform Team',
        'admin@parcplatform.com',
        [user.email],
        fail_silently=False,
    )
    print(f"--- SENT CREDENTIALS TO NEW STUDENT: {user.email} ---")