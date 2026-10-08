from django.db import models
from django.conf import settings
from django.utils.text import slugify

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    icon = models.CharField(max_length=50, default='📘', help_text="Emoji or icon name")

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Course(models.Model):
    LEVEL_CHOICES = (
        ('Beginner', 'Beginner'),
        ('Intermediate', 'Intermediate'),
        ('Advanced', 'Advanced'),
    )

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    description = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='courses')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_courses')
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='Beginner')
    thumbnail = models.CharField(max_length=255, blank=True, default='🎯')
    xp_reward = models.PositiveIntegerField(default=500, help_text="Bonus XP on course completion")
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1
            while Course.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def total_lessons(self):
        return self.lessons.count()

    @property
    def total_duration(self):
        return sum(l.duration_minutes for l in self.lessons.all())

    @property
    def instructor_name(self):
        # Backward compatibility for serializers/views
        return f"{self.author.first_name} {self.author.last_name}".strip() or self.author.username

    def __str__(self):
        return self.title

class Lesson(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, blank=True)
    sequence_order = models.PositiveIntegerField(default=1)
    description = models.TextField(blank=True, default='')
    content = models.TextField(help_text="Detailed learning material used by users and AI tutor")
    duration_minutes = models.PositiveIntegerField(default=15)
    xp_reward = models.PositiveIntegerField(default=50, help_text="XP awarded for completing this lesson")

    class Meta:
        ordering = ['sequence_order', 'id']
        unique_together = ('course', 'sequence_order')

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.course.title} - #{self.sequence_order} {self.title}"

class Enrollment(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    enrolled_at = models.DateTimeField(auto_now_add=True)
    progress_percentage = models.FloatField(default=0.0)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'course')
        ordering = ['-enrolled_at']

    def update_progress(self):
        total_lessons = self.course.lessons.count()
        if total_lessons == 0:
            self.progress_percentage = 100.0
            self.is_completed = True
        else:
            completed_count = self.lesson_progress.filter(is_completed=True).count()
            self.progress_percentage = round((completed_count / total_lessons) * 100.0, 1)
            if self.progress_percentage >= 100.0 and not self.is_completed:
                self.is_completed = True
                from django.utils import timezone
                self.completed_at = timezone.now()
                # Award course completion bonus XP to user
                self.user.add_points(self.course.xp_reward)
        self.save()
        return self.progress_percentage

    def __str__(self):
        return f"{self.user.username} enrolled in {self.course.title} ({self.progress_percentage}%)"

class LessonProgress(models.Model):
    enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE, related_name='lesson_progress')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='progress_records')
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('enrollment', 'lesson')

    def __str__(self):
        return f"{self.enrollment.user.username} - {self.lesson.title}: {'Completed' if self.is_completed else 'Pending'}"
