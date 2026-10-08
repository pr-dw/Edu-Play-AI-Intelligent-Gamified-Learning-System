from django.db import models
from django.conf import settings
from courses.models import Course, Lesson

class TutorSession(models.Model):
    PROVIDER_CHOICES = (
        ('ollama', 'Ollama (Qwen 2.5: 3B)'),
        ('gemini', 'Google Gemini API'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tutor_sessions')
    course = models.ForeignKey(Course, on_delete=models.SET_NULL, null=True, blank=True, related_name='tutor_sessions')
    lesson = models.ForeignKey(Lesson, on_delete=models.SET_NULL, null=True, blank=True, related_name='tutor_sessions')
    title = models.CharField(max_length=200, default='New Learning Session')
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES, default='ollama')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.user.username} - {self.title} ({self.provider})"

class TutorMessage(models.Model):
    ROLE_CHOICES = (
        ('user', 'User'),
        ('assistant', 'Assistant'),
        ('system', 'System'),
    )

    session = models.ForeignKey(TutorSession, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=15, choices=ROLE_CHOICES)
    content = models.TextField()
    provider_used = models.CharField(max_length=20, default='ollama')
    mode = models.CharField(max_length=30, default='general')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"[{self.role.upper()}] in Session #{self.session_id} via {self.provider_used}"
