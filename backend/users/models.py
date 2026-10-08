from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('user', 'User'),
        ('admin', 'Administrator'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    points = models.PositiveIntegerField(default=100, help_text="Gamification XP points earned")
    level = models.PositiveIntegerField(default=1, help_text="Calculated based on XP")
    bio = models.TextField(blank=True, default="Passionate lifelong learner exploring new frontiers.")
    avatar = models.CharField(max_length=50, blank=True, default="🚀", help_text="Avatar emoji or icon")
    avatar_image = models.ImageField(upload_to='avatars/', null=True, blank=True, help_text="Uploaded profile picture")

    def add_points(self, amount: int):
        self.points += amount
        # Calculate level: level up every 250 points
        self.level = max(1, (self.points // 250) + 1)
        self.save(update_fields=['points', 'level'])

    def __str__(self):
        return f"{self.username} ({self.get_role_display()}) - {self.points} XP"
