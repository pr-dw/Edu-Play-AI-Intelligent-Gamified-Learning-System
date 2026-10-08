import uuid
from django.db import models
from django.conf import settings
from courses.models import Course

def generate_cert_number():
    random_part = uuid.uuid4().hex[:8].upper()
    return f"EDU-2026-{random_part}"

class Certificate(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='certificates')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='certificates')
    certificate_id = models.CharField(max_length=50, unique=True, default=generate_cert_number)
    verification_code = models.UUIDField(default=uuid.uuid4, unique=True)
    issue_date = models.DateTimeField(auto_now_add=True)
    grade = models.CharField(max_length=50, default='100% Course Mastery')
    is_valid = models.BooleanField(default=True)

    class Meta:
        unique_together = ('user', 'course')
        ordering = ['-issue_date']

    def __str__(self):
        return f"Certificate {self.certificate_id} - {self.user.username} for {self.course.title}"
